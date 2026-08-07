"use client";

import { useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";
import { notifyMessagesChanged } from "@/components/admin/AdminShell";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";
import { deleteJson } from "@/components/admin/danger/useDeleteConfirm";

type Message = {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
  emailDeliveryStatus?: string;
  emailDeliveryNote?: string | null;
  createdAt: string;
};

export default function AdminMessagesPage() {
  return (
    <AdminGuardedClient>
      <MessagesManager />
    </AdminGuardedClient>
  );
}

function deliveryLabel(status?: string) {
  if (status === "delivered") return "Email delivered";
  if (status === "failed") return "Email failed";
  return "Saved in inbox only";
}

function MessagesManager() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [csrfToken, setCsrfToken] = useState("");
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (query) params.set("q", query);
    const [csrf, data] = await Promise.all([
      fetch("/api/csrf").then((r) => r.json()),
      fetch(`/api/admin/messages?${params}`).then((r) => r.json()),
    ]);
    setCsrfToken(csrf.csrfToken || "");
    setMessages(data.messages || []);
    notifyMessagesChanged();
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: Message["status"]) {
    const res = await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, csrfToken }),
    });
    const json = await res.json();
    setToast(json.ok ? "Message updated." : json.error || "Failed");
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Messages</h2>
          <p className="text-slate-500">
            Parent-managed inbox for contact-form submissions. Children cannot message each other here.
          </p>
        </div>
        {csrfToken ? (
          <SectionDangerZone
            scope="messages"
            csrfToken={csrfToken}
            onToast={setToast}
            onDeleted={async () => {
              setSelected(null);
              await load();
            }}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          className="admin-input max-w-xs"
          placeholder="Search messages"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search messages"
        />
        <select
          className="admin-input max-w-[180px]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All</option>
          <option value="UNREAD">Unread</option>
          <option value="READ">Read</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button className="admin-btn secondary" type="button" onClick={load}>
          Filter
        </button>
        <a className="admin-btn secondary" href="/api/admin/export?format=csv">
          Export CSV
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-2">
          {messages.length === 0 ? (
            <p className="admin-card p-5 text-slate-500">No messages yet.</p>
          ) : (
            messages.map((message) => (
              <button
                key={message.id}
                type="button"
                className="admin-card block w-full p-4 text-left"
                onClick={() => {
                  setSelected(message);
                  if (message.status === "UNREAD") setStatus(message.id, "READ");
                }}
              >
                <p className="font-bold">
                  {message.status === "UNREAD" ? "● " : ""}
                  {message.subject}
                </p>
                <p className="text-sm text-slate-500">
                  {message.senderName} · {new Date(message.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {deliveryLabel(message.emailDeliveryStatus)}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="admin-card p-5">
          {selected ? (
            <>
              <h3 className="text-2xl font-bold">{selected.subject}</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-semibold text-slate-500">Sender name</dt>
                  <dd>{selected.senderName}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Email address</dt>
                  <dd>{selected.senderEmail}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Date and time</dt>
                  <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Read/unread status</dt>
                  <dd>{selected.status}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">Email-delivery status</dt>
                  <dd>
                    {deliveryLabel(selected.emailDeliveryStatus)}
                    {selected.emailDeliveryNote ? ` — ${selected.emailDeliveryNote}` : ""}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3">{selected.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="admin-btn"
                  href={`mailto:${selected.senderEmail}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                >
                  Reply in email app
                </a>
                <button
                  className="admin-btn secondary"
                  type="button"
                  onClick={() => setStatus(selected.id, "UNREAD")}
                >
                  Mark unread
                </button>
                <button
                  className="admin-btn secondary"
                  type="button"
                  onClick={() => setStatus(selected.id, "READ")}
                >
                  Mark read
                </button>
                <button
                  className="admin-btn secondary"
                  type="button"
                  onClick={() => setStatus(selected.id, "ARCHIVED")}
                >
                  Archive
                </button>
                <button
                  className="admin-btn danger"
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Select a message to read it.</p>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={confirmDelete && Boolean(selected)}
        title={selected ? `Delete “${selected.subject}”?` : "Delete"}
        description={
          selected
            ? `Delete “${selected.subject}” from ${selected.senderName}? This message will be permanently removed and cannot be recovered.`
            : ""
        }
        busy={deleting}
        onCancel={() => {
          if (!deleting) setConfirmDelete(false);
        }}
        onConfirm={async () => {
          if (!selected) return;
          setDeleting(true);
          const result = await deleteJson("/api/admin/messages", {
            id: selected.id,
            confirm: true,
            csrfToken,
          });
          setDeleting(false);
          if (result.ok) {
            setToast(result.message || "Message deleted.");
            setConfirmDelete(false);
            setSelected(null);
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
