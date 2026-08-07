"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";
import { deleteJson } from "@/components/admin/danger/useDeleteConfirm";

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
};

export default function AdminBadgesPage() {
  return (
    <AdminGuardedClient>
      <BadgesManager />
    </AdminGuardedClient>
  );
}

function BadgesManager() {
  const [csrfToken, setCsrfToken] = useState("");
  const [badges, setBadges] = useState<Badge[]>([]);
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Badge | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [csrf, data] = await Promise.all([
      fetch("/api/csrf").then((r) => r.json()),
      fetch("/api/admin/content").then((r) => r.json()),
    ]);
    setCsrfToken(csrf.csrfToken || "");
    setBadges(data.badges || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createBadge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "badge",
        name: String(form.get("name") || ""),
        description: String(form.get("description") || ""),
        icon: String(form.get("icon") || "🏅"),
        color: String(form.get("color") || "#3de7ff"),
        isActive: true,
        csrfToken,
      }),
    });
    const json = await res.json();
    setToast(json.ok ? "Badge saved." : json.error || "Failed");
    if (json.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Badges & Rewards</h2>
          <p className="text-slate-500">
            Celebrate effort, kindness, creativity, and consistency — not competition.
          </p>
        </div>
        {csrfToken ? (
          <SectionDangerZone
            scope="badges"
            csrfToken={csrfToken}
            onToast={setToast}
            onDeleted={load}
          />
        ) : null}
      </div>

      <form onSubmit={createBadge} className="admin-card grid gap-3 p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Name
          <input className="admin-input mt-1" name="name" required />
        </label>
        <label className="text-sm font-semibold">
          Icon emoji
          <input className="admin-input mt-1" name="icon" defaultValue="🏅" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Description
          <textarea className="admin-input mt-1" name="description" rows={2} required />
        </label>
        <label className="text-sm font-semibold">
          Color
          <input className="admin-input mt-1" name="color" defaultValue="#3de7ff" />
        </label>
        <div className="md:col-span-2">
          <button className="admin-btn" type="submit">
            Save badge
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {badges.length === 0 ? (
          <p className="admin-card p-5 text-slate-500 sm:col-span-2">No badges yet.</p>
        ) : (
          badges.map((badge) => (
            <article key={badge.id} className="admin-card p-4">
              <p className="text-2xl">{badge.icon}</p>
              <p className="font-semibold" style={{ color: badge.color }}>
                {badge.name}
              </p>
              <p className="text-sm text-slate-600">{badge.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="admin-btn secondary"
                  type="button"
                  onClick={async () => {
                    await fetch("/api/admin/content", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        kind: "badge",
                        id: badge.id,
                        name: badge.name,
                        description: badge.description,
                        icon: badge.icon,
                        color: badge.color,
                        isActive: !badge.isActive,
                        csrfToken,
                      }),
                    });
                    await load();
                  }}
                >
                  {badge.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  className="admin-btn danger"
                  type="button"
                  onClick={() => setPendingDelete(badge)}
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
        title={pendingDelete ? `Delete “${pendingDelete.name}”?` : "Delete"}
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? This badge will be permanently removed and cannot be recovered.`
            : ""
        }
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteJson("/api/admin/content", {
            kind: "badge",
            id: pendingDelete.id,
            confirm: true,
            csrfToken,
          });
          setDeleting(false);
          if (result.ok) {
            setToast(result.message || "Badge deleted.");
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
