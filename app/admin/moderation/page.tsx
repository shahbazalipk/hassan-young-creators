"use client";

import { useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";

export default function AdminModerationPage() {
  return (
    <AdminGuardedClient>
      <ModerationManager />
    </AdminGuardedClient>
  );
}

function ModerationManager() {
  const [csrfToken, setCsrfToken] = useState("");
  const [data, setData] = useState<{ inspiration: any[]; guestbook: any[]; challenges: any[] }>({
    inspiration: [],
    guestbook: [],
    challenges: [],
  });
  const [toast, setToast] = useState("");
  const [edits, setEdits] = useState<Record<string, { nickname: string; message: string }>>({});
  const [pendingDelete, setPendingDelete] = useState<{
    queue: string;
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [csrf, queue] = await Promise.all([
      fetch("/api/csrf").then((r) => r.json()),
      fetch("/api/admin/moderation").then((r) => r.json()),
    ]);
    setCsrfToken(csrf.csrfToken || "");
    setData({
      inspiration: queue.inspiration || [],
      guestbook: queue.guestbook || [],
      challenges: queue.challenges || [],
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function moderate(
    queue: string,
    id: string,
    action: string,
    extra: Record<string, string> = {}
  ) {
    const res = await fetch("/api/admin/moderation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queue, id, action, csrfToken, ...extra }),
    });
    const json = await res.json();
    setToast(json.ok ? json.message || "Updated." : json.error || "Failed");
    await load();
  }

  async function disableAll() {
    const res = await fetch("/api/admin/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken }),
    });
    const json = await res.json();
    setToast(json.message || json.error || "Done");
  }

  function draft(id: string, nickname: string, message: string) {
    return edits[id] || { nickname, message };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Submissions</h2>
          <p className="text-slate-500">
            Pending Approval queue — review, edit out personal info, then approve or reject.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="admin-btn secondary" type="button" onClick={disableAll}>
            Disable all public submissions
          </button>
          {csrfToken ? (
            <SectionDangerZone
              scope="submissions"
              csrfToken={csrfToken}
              onToast={setToast}
              onDeleted={load}
            />
          ) : null}
        </div>
      </div>

      <Queue
        title="Inspiration Wall"
        items={data.inspiration}
        draft={draft}
        setEdits={setEdits}
        getMessage={(item) => item.message}
        onAction={moderate}
        onDelete={(item) =>
          setPendingDelete({
            queue: "inspiration",
            id: item.id,
            label: item.message?.slice(0, 80) || "inspiration submission",
          })
        }
        queue="inspiration"
      />

      <Queue
        title="Challenge notes"
        items={data.challenges}
        draft={draft}
        setEdits={setEdits}
        getMessage={(item) => item.note}
        subtitle={(item) => item.challenge?.title}
        onAction={moderate}
        onDelete={(item) =>
          setPendingDelete({
            queue: "challenge",
            id: item.id,
            label: item.note?.slice(0, 80) || "challenge submission",
          })
        }
        queue="challenge"
      />

      <Queue
        title="Guestbook"
        items={data.guestbook}
        draft={draft}
        setEdits={setEdits}
        getMessage={(item) => item.message}
        onAction={moderate}
        onDelete={(item) =>
          setPendingDelete({
            queue: "guestbook",
            id: item.id,
            label: item.message?.slice(0, 80) || "guestbook submission",
          })
        }
        queue="guestbook"
      />

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete “${pendingDelete.label}”?` : "Delete"}
        description={
          pendingDelete
            ? `Delete “${pendingDelete.label}”? This submission will be permanently removed and cannot be recovered.`
            : ""
        }
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const res = await fetch("/api/admin/moderation", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              queue: pendingDelete.queue,
              id: pendingDelete.id,
              action: "DELETE",
              confirm: true,
              csrfToken,
            }),
          });
          const json = await res.json();
          setDeleting(false);
          if (json.ok) {
            setToast(json.message || "Submission deleted.");
            setPendingDelete(null);
            await load();
          } else {
            setToast(json.error || "Deletion failed.");
          }
        }}
      />

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function Queue({
  title,
  items,
  queue,
  draft,
  setEdits,
  getMessage,
  subtitle,
  onAction,
  onDelete,
}: {
  title: string;
  items: any[];
  queue: string;
  draft: (id: string, nickname: string, message: string) => { nickname: string; message: string };
  setEdits: React.Dispatch<
    React.SetStateAction<Record<string, { nickname: string; message: string }>>
  >;
  getMessage: (item: any) => string;
  subtitle?: (item: any) => string | undefined;
  onAction: (
    queue: string,
    id: string,
    action: string,
    extra?: Record<string, string>
  ) => Promise<void>;
  onDelete: (item: any) => void;
}) {
  return (
    <section className="admin-card p-5">
      <h3 className="text-xl font-bold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-slate-500">No pending items. Nice and calm.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const current = draft(item.id, item.nickname, getMessage(item));
            return (
              <li key={item.id} className="rounded-xl border border-slate-100 p-3">
                {subtitle?.(item) ? (
                  <p className="mb-2 text-sm font-semibold text-slate-500">{subtitle(item)}</p>
                ) : null}
                <label className="block text-sm font-semibold">
                  Nickname
                  <input
                    className="admin-input mt-1"
                    value={current.nickname}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [item.id]: { ...current, nickname: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="mt-2 block text-sm font-semibold">
                  Message
                  <textarea
                    className="admin-input mt-1"
                    rows={3}
                    value={current.message}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [item.id]: { ...current, message: e.target.value },
                      }))
                    }
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() =>
                      onAction(queue, item.id, "EDIT", {
                        nickname: current.nickname,
                        message: current.message,
                        note: current.message,
                      })
                    }
                  >
                    Save safe edit
                  </button>
                  <button
                    className="admin-btn"
                    type="button"
                    onClick={() => onAction(queue, item.id, "APPROVE")}
                  >
                    Approve
                  </button>
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() => onAction(queue, item.id, "REJECT")}
                  >
                    Reject
                  </button>
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() => onAction(queue, item.id, "HIDE")}
                  >
                    Hide
                  </button>
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() => onAction(queue, item.id, "BLOCK_IP")}
                  >
                    Block spam source
                  </button>
                  <button className="admin-btn danger" type="button" onClick={() => onDelete(item)}>
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
