"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GlobalDangerZone } from "@/components/admin/danger/GlobalDangerZone";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";
import { deleteJson } from "@/components/admin/danger/useDeleteConfirm";

type ActivityItem = {
  id: string;
  summary: string;
  createdAt: string;
  userName: string | null;
};

export function DashboardDangerControls({ initialActivity }: { initialActivity: ActivityItem[] }) {
  const router = useRouter();
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState("");
  const [activity, setActivity] = useState(initialActivity);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/csrf")
      .then((r) => r.json())
      .then((data) => setCsrfToken(data.csrfToken || ""));
  }, []);

  useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const pendingItem = activity.find((item) => item.id === pendingId) || null;

  return (
    <div className="space-y-6">
      <section className="admin-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">Recent activity</h3>
            <p className="mt-1 text-sm text-slate-500">Admin actions for this portfolio.</p>
          </div>
          {csrfToken ? (
            <SectionDangerZone
              scope="activity"
              csrfToken={csrfToken}
              label="Delete All Activity History"
              onToast={setToast}
              onDeleted={async () => {
                setActivity([]);
                router.refresh();
              }}
            />
          ) : null}
        </div>
        {activity.length === 0 ? (
          <p className="mt-3 text-slate-500">No admin actions yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="font-semibold">{item.summary}</p>
                  <p className="text-sm text-slate-500">
                    {item.userName || "System"} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn danger"
                  onClick={() => setPendingId(item.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {csrfToken ? (
        <GlobalDangerZone
          csrfToken={csrfToken}
          onToast={setToast}
          onDeleted={async () => {
            setActivity([]);
            router.refresh();
          }}
        />
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(pendingItem)}
        title={pendingItem ? `Delete activity record?` : "Delete"}
        description={
          pendingItem
            ? `Delete “${pendingItem.summary}”? This activity record will be permanently removed and cannot be recovered.`
            : ""
        }
        busy={busy}
        onCancel={() => {
          if (!busy) setPendingId(null);
        }}
        onConfirm={async () => {
          if (!pendingItem) return;
          setBusy(true);
          const result = await deleteJson("/api/admin/activity", {
            id: pendingItem.id,
            confirm: true,
            csrfToken,
          });
          setBusy(false);
          if (result.ok) {
            setToast(result.message || "Activity record deleted.");
            setActivity((prev) => prev.filter((item) => item.id !== pendingItem.id));
            setPendingId(null);
            router.refresh();
          } else {
            setToast(result.error || "Deletion failed.");
          }
        }}
      />

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
