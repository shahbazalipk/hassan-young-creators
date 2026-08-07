"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";
import { deleteJson } from "@/components/admin/danger/useDeleteConfirm";

type Challenge = {
  id: string;
  title: string;
  description: string;
  status: string;
  publishAt: string | null;
};

export default function AdminChallengesPage() {
  return (
    <AdminGuardedClient>
      <ChallengesManager />
    </AdminGuardedClient>
  );
}

function ChallengesManager() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Challenge | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [csrf, data] = await Promise.all([
      fetch("/api/csrf").then((r) => r.json()),
      fetch("/api/admin/challenges").then((r) => r.json()),
    ]);
    setCsrfToken(csrf.csrfToken || "");
    setChallenges(data.challenges || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        status: String(form.get("status") || "DRAFT"),
        publishAt: String(form.get("publishAt") || "") || null,
        csrfToken,
      }),
    });
    const json = await res.json();
    setToast(json.ok ? "Challenge saved." : json.error || "Failed");
    if (json.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Games & Challenges</h2>
          <p className="text-slate-500">Create, schedule, publish, and archive safe creative challenges.</p>
        </div>
        {csrfToken ? (
          <SectionDangerZone
            scope="challenges"
            csrfToken={csrfToken}
            label="Delete All Challenges"
            onToast={setToast}
            onDeleted={load}
          />
        ) : null}
      </div>

      <form onSubmit={onCreate} className="admin-card grid gap-3 p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Title
          <input className="admin-input mt-1" name="title" required />
        </label>
        <label className="text-sm font-semibold">
          Status
          <select className="admin-input mt-1" name="status" defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Description
          <textarea className="admin-input mt-1" name="description" rows={3} required />
        </label>
        <label className="text-sm font-semibold">
          Publish at (optional)
          <input className="admin-input mt-1" name="publishAt" type="datetime-local" />
        </label>
        <div className="md:col-span-2">
          <button className="admin-btn" type="submit">
            Save challenge
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {challenges.length === 0 ? (
          <p className="admin-card p-5 text-slate-500">No challenges yet.</p>
        ) : (
          challenges.map((challenge) => (
            <article key={challenge.id} className="admin-card p-4">
              <h3 className="text-xl font-bold">{challenge.title}</h3>
              <p className="text-sm text-slate-500">{challenge.status}</p>
              <p className="mt-2">{challenge.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const).map((status) => (
                  <button
                    key={status}
                    className="admin-btn secondary"
                    type="button"
                    onClick={async () => {
                      await fetch("/api/admin/challenges", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: challenge.id,
                          title: challenge.title,
                          description: challenge.description,
                          status,
                          publishAt: challenge.publishAt,
                          csrfToken,
                        }),
                      });
                      await load();
                    }}
                  >
                    Mark {status.toLowerCase()}
                  </button>
                ))}
                <button
                  className="admin-btn danger"
                  type="button"
                  onClick={() => setPendingDelete(challenge)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete “${pendingDelete.title}”?` : "Delete"}
        description={
          pendingDelete
            ? `Delete “${pendingDelete.title}”? This challenge and its submissions will be permanently removed and cannot be recovered.`
            : ""
        }
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteJson("/api/admin/challenges", {
            id: pendingDelete.id,
            confirm: true,
            csrfToken,
          });
          setDeleting(false);
          if (result.ok) {
            setToast(result.message || "Challenge deleted.");
            setPendingDelete(null);
            await load();
          } else {
            setToast(result.error || "Deletion failed.");
          }
        }}
      />

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
