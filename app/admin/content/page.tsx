"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";

export default function AdminContentPage() {
  return (
    <AdminGuardedClient>
      <ContentManager />
    </AdminGuardedClient>
  );
}

function ContentManager() {
  const [csrfToken, setCsrfToken] = useState("");
  const [resources, setResources] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [toast, setToast] = useState("");

  async function load() {
    const [csrf, data] = await Promise.all([
      fetch("/api/csrf").then((r) => r.json()),
      fetch("/api/admin/content").then((r) => r.json()),
    ]);
    setCsrfToken(csrf.csrfToken || "");
    setResources(data.resources || []);
    setBadges(data.badges || []);
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
      <div>
        <h2 className="text-3xl font-bold">Resources & Badges</h2>
        <p className="text-slate-500">
          Manage parent-approved learning links and effort-based achievement badges.
        </p>
      </div>

      <form onSubmit={createResource} className="admin-card grid gap-3 p-5 md:grid-cols-2">
        <h3 className="md:col-span-2 text-xl font-bold">Add learning resource</h3>
        <label className="text-sm font-semibold">
          Title
          <input className="admin-input mt-1" name="title" required />
        </label>
        <label className="text-sm font-semibold">
          Category
          <input className="admin-input mt-1" name="category" required placeholder="HTML basics" />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Description
          <textarea className="admin-input mt-1" name="description" rows={3} required />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          External URL (optional, opens in new tab)
          <input className="admin-input mt-1" name="url" type="url" placeholder="https://" />
        </label>
        <div className="md:col-span-2">
          <button className="admin-btn" type="submit">
            Save resource
          </button>
        </div>
      </form>

      <section className="admin-card p-5">
        <h3 className="text-xl font-bold">Learning resources</h3>
        {resources.length === 0 ? (
          <p className="mt-3 text-slate-500">No resources yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {resources.map((resource) => (
              <li key={resource.id} className="rounded-xl border border-slate-100 p-3">
                <p className="font-semibold">
                  {resource.title}{" "}
                  <span className="text-sm font-normal text-slate-500">
                    ({resource.isPublished ? "Published" : "Hidden"})
                  </span>
                </p>
                <p className="text-sm text-slate-600">{resource.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="admin-btn secondary"
                    type="button"
                    onClick={async () => {
                      await fetch("/api/admin/content", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          kind: "resource",
                          id: resource.id,
                          title: resource.title,
                          description: resource.description,
                          category: resource.category,
                          url: resource.url || "",
                          isPublished: !resource.isPublished,
                          csrfToken,
                        }),
                      });
                      await load();
                    }}
                  >
                    {resource.isPublished ? "Hide" : "Publish"}
                  </button>
                  <button
                    className="admin-btn danger"
                    type="button"
                    onClick={async () => {
                      if (!window.confirm("Delete this resource?")) return;
                      await fetch("/api/admin/content", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          kind: "resource",
                          id: resource.id,
                          confirm: true,
                          csrfToken,
                        }),
                      });
                      await load();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={createBadge} className="admin-card grid gap-3 p-5 md:grid-cols-2">
        <h3 className="md:col-span-2 text-xl font-bold">Add badge</h3>
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

      <section className="admin-card p-5">
        <h3 className="text-xl font-bold">Achievement badges</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {badges.map((badge) => (
            <article key={badge.id} className="rounded-xl border border-slate-100 p-3">
              <p className="text-2xl">{badge.icon}</p>
              <p className="font-semibold" style={{ color: badge.color }}>
                {badge.name}
              </p>
              <p className="text-sm text-slate-600">{badge.description}</p>
              <button
                className="admin-btn secondary mt-2"
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
            </article>
          ))}
        </div>
      </section>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
