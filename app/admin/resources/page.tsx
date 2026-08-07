"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";
import { deleteJson } from "@/components/admin/danger/useDeleteConfirm";

type Resource = {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string | null;
};

export default function AdminResourcesPage() {
  return (
    <AdminGuardedClient>
      <ResourcesManager />
    </AdminGuardedClient>
  );
}

function ResourcesManager() {
  const [csrfToken, setCsrfToken] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [csrf, data] = await Promise.all([
      fetch("/api/csrf").then((r) => r.json()),
      fetch("/api/admin/content").then((r) => r.json()),
    ]);
    setCsrfToken(csrf.csrfToken || "");
    setResources(data.resources || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "resource",
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        category: String(form.get("category") || ""),
        url: String(form.get("url") || "") || null,
        isPublished: true,
        csrfToken,
      }),
    });
    const json = await res.json();
    setToast(json.ok ? "Resource saved." : json.error || "Failed");
    if (json.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Learning Resources</h2>
          <p className="text-slate-500">
            Parent-approved learning cards. External links open in a new tab with safe attributes.
          </p>
        </div>
        {csrfToken ? (
          <SectionDangerZone
            scope="resources"
            csrfToken={csrfToken}
            onToast={setToast}
            onDeleted={load}
          />
        ) : null}
      </div>

      <form onSubmit={createResource} className="admin-card grid gap-3 p-5 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Title
          <input className="admin-input mt-1" name="title" required />
        </label>
        <label className="text-sm font-semibold">
          Category
          <input className="admin-input mt-1" name="category" required />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Description
          <textarea className="admin-input mt-1" name="description" rows={3} required />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          External URL (optional)
          <input className="admin-input mt-1" name="url" type="url" placeholder="https://" />
        </label>
        <div className="md:col-span-2">
          <button className="admin-btn" type="submit">
            Save resource
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {resources.length === 0 ? (
          <p className="admin-card p-5 text-slate-500">No learning resources yet.</p>
        ) : (
          resources.map((resource) => (
            <article key={resource.id} className="admin-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">{resource.title}</h3>
                  <p className="text-sm text-slate-500">{resource.category}</p>
                  <p className="mt-2 text-slate-600">{resource.description}</p>
                  {resource.url ? (
                    <a
                      className="admin-btn secondary mt-3 inline-flex"
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open resource
                    </a>
                  ) : null}
                </div>
                <button
                  className="admin-btn danger"
                  type="button"
                  onClick={() => setPendingDelete(resource)}
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
            ? `Delete “${pendingDelete.title}”? This learning resource will be permanently removed and cannot be recovered.`
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
            kind: "resource",
            id: pendingDelete.id,
            confirm: true,
            csrfToken,
          });
          setDeleting(false);
          if (result.ok) {
            setToast(result.message || "Resource deleted.");
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
