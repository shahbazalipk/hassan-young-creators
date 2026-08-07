"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";
import { deleteJson } from "@/components/admin/danger/useDeleteConfirm";

type Project = {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  url: string | null;
  accent: string;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  completedAt: string | null;
  sortOrder: number;
  imagePath: string | null;
};

export default function AdminProjectsPage() {
  return (
    <AdminGuardedClient>
      <ProjectsManager />
    </AdminGuardedClient>
  );
}

function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState<Project | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [csrf, list] = await Promise.all([
      fetch("/api/csrf").then((r) => r.json()),
      fetch("/api/admin/projects").then((r) => r.json()),
    ]);
    setCsrfToken(csrf.csrfToken || "");
    setProjects(list.projects || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("csrfToken", csrfToken);
    data.set("featured", data.get("featured") ? "true" : "false");
    const res = await fetch("/api/admin/projects", { method: "POST", body: data });
    const json = await res.json();
    setToast(json.ok ? "Project saved." : json.error || "Could not save.");
    if (json.ok) {
      form.reset();
      await load();
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      id: editing.id,
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      technologies: String(form.get("technologies") || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      url: String(form.get("url") || "") || null,
      accent: String(form.get("accent") || "cyan"),
      status: String(form.get("status") || "DRAFT"),
      featured: Boolean(form.get("featured")),
      completedAt: String(form.get("completedAt") || "") || null,
      csrfToken,
    };
    const res = await fetch("/api/admin/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setToast(json.ok ? "Project updated." : json.error || "Update failed.");
    if (json.ok) {
      setEditing(null);
      await load();
    }
  }

  async function act(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/projects", {
      method: body.confirm ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, csrfToken }),
    });
    const json = await res.json();
    setToast(json.ok ? json.message || "Updated." : json.error || "Failed.");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Projects</h2>
          <p className="text-slate-500">
            Manage Hassan’s two live websites: KidMind AI and Flash Cards.
          </p>
        </div>
        {csrfToken ? (
          <SectionDangerZone
            scope="projects"
            csrfToken={csrfToken}
            onToast={setToast}
            onDeleted={load}
          />
        ) : null}
      </div>

      <form onSubmit={createProject} className="admin-card grid gap-3 p-5 md:grid-cols-2">
        <h3 className="md:col-span-2 text-xl font-bold">Add project</h3>
        <ProjectFields />
        <div className="md:col-span-2">
          <button className="admin-btn" type="submit">
            Save project
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <p className="admin-card p-5 text-slate-500">No projects yet. Add the first one above.</p>
        ) : (
          projects.map((project) => (
            <article key={project.id} className="admin-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">
                    {project.title} {project.featured ? "★" : ""}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {project.status} · {project.technologies.join(", ")}
                  </p>
                  <p className="mt-2 text-slate-600">{project.description}</p>
                  {project.url ? (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold text-slate-500">Development URL: </span>
                      <a
                        className="break-all text-blue-700 underline-offset-2 hover:underline focus-visible:underline"
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {project.url}
                      </a>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No development URL yet.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="admin-btn secondary" type="button" onClick={() => setPreview(project)}>
                    Preview
                  </button>
                  <button className="admin-btn secondary" type="button" onClick={() => setEditing(project)}>
                    Edit
                  </button>
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() => act({ id: project.id, action: "toggle-publish" })}
                  >
                    {project.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() => act({ id: project.id, action: "toggle-featured" })}
                  >
                    {project.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() => act({ id: project.id, action: "reorder", direction: "up" })}
                  >
                    Move up
                  </button>
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={() => act({ id: project.id, action: "reorder", direction: "down" })}
                  >
                    Move down
                  </button>
                  <button
                    className="admin-btn danger"
                    type="button"
                    onClick={() => setPendingDelete(project)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="admin-card max-w-lg p-5">
            <h3 className="text-2xl font-bold">{preview.title}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {preview.status}
              {preview.featured ? " · Featured" : ""}
            </p>
            <p className="mt-2">{preview.description}</p>
            <p className="mt-2 text-sm text-slate-500">{preview.technologies.join(" · ")}</p>
            {preview.url ? (
              <p className="mt-2 text-sm text-blue-700 break-all">{preview.url}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No public URL yet (coming-soon modal).</p>
            )}
            <button className="admin-btn mt-4" type="button" onClick={() => setPreview(null)}>
              Close preview
            </button>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form onSubmit={saveEdit} className="admin-card max-h-[90vh] w-full max-w-2xl overflow-auto p-5">
            <h3 className="mb-3 text-2xl font-bold">Edit project</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <ProjectFields project={editing} />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="admin-btn" type="submit">
                Save changes
              </button>
              <button className="admin-btn secondary" type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete “${pendingDelete.title}”?` : "Delete"}
        description={
          pendingDelete
            ? `Delete “${pendingDelete.title}”? This project will be removed from the admin panel and public portfolio. This action cannot be recovered.`
            : ""
        }
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result = await deleteJson("/api/admin/projects", {
            id: pendingDelete.id,
            confirm: true,
            csrfToken,
          });
          setDeleting(false);
          if (result.ok) {
            setToast(result.message || "Project deleted.");
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

function ProjectFields({ project }: { project?: Project }) {
  return (
    <>
      <label className="text-sm font-semibold">
        Title
        <input className="admin-input mt-1" name="title" required defaultValue={project?.title} />
      </label>
      <label className="text-sm font-semibold">
        Accent
        <select className="admin-input mt-1" name="accent" defaultValue={project?.accent || "cyan"}>
          <option value="cyan">Cyan</option>
          <option value="violet">Violet</option>
          <option value="amber">Amber</option>
          <option value="mint">Mint</option>
          <option value="coral">Coral</option>
        </select>
      </label>
      <label className="md:col-span-2 text-sm font-semibold">
        Description
        <textarea
          className="admin-input mt-1"
          name="description"
          rows={3}
          required
          defaultValue={project?.description}
        />
      </label>
      <label className="text-sm font-semibold">
        Technologies (comma separated)
        <input
          className="admin-input mt-1"
          name="technologies"
          placeholder="HTML, CSS, JavaScript"
          defaultValue={project?.technologies?.join(", ")}
        />
      </label>
      <label className="text-sm font-semibold">
        URL (optional)
        <input
          className="admin-input mt-1"
          name="url"
          type="url"
          placeholder="https://"
          defaultValue={project?.url || ""}
        />
      </label>
      <label className="text-sm font-semibold">
        Completion date
        <input
          className="admin-input mt-1"
          name="completedAt"
          type="date"
          defaultValue={project?.completedAt ? project.completedAt.slice(0, 10) : ""}
        />
      </label>
      <label className="text-sm font-semibold">
        Status
        <select className="admin-input mt-1" name="status" defaultValue={project?.status || "DRAFT"}>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      {!project ? (
        <label className="text-sm font-semibold">
          Preview image
          <input
            className="admin-input mt-1"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
          />
        </label>
      ) : null}
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input name="featured" type="checkbox" defaultChecked={project?.featured} /> Featured project
      </label>
    </>
  );
}
