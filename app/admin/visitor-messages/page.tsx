"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";
import { notifyVisitorChatChanged } from "@/components/admin/AdminShell";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";
import { deleteJson } from "@/components/admin/danger/useDeleteConfirm";

type ConversationSummary = {
  id: string;
  status: string;
  archived: boolean;
  blocked: boolean;
  unreadCount: number;
  preview: string;
  previewRole: string;
  lastMessageAt: string | null;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  senderRole: "visitor" | "admin";
  body: string;
  createdAt: string;
  ticks: "sent" | "delivered" | "read" | null;
  statusLabel: string;
};

type PendingDelete =
  | { kind: "conversation"; id: string }
  | { kind: "message"; id: string; preview: string }
  | null;

export default function AdminVisitorMessagesPage() {
  return (
    <AdminGuardedClient>
      <VisitorMessagesManager />
    </AdminGuardedClient>
  );
}

function VisitorMessagesManager() {
  const [csrfToken, setCsrfToken] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState("");
  const [filter, setFilter] = useState<"active" | "archived" | "blocked" | "all">("active");
  const [meta, setMeta] = useState({ unreadMessages: 0, blocked: false, archived: false });
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadList() {
    const [csrf, data] = await Promise.all([
      fetch("/api/csrf").then((r) => r.json()),
      fetch("/api/admin/visitor-chat").then((r) => r.json()),
    ]);
    setCsrfToken(csrf.csrfToken || "");
    setConversations(data.conversations || []);
    notifyVisitorChatChanged();
  }

  async function openConversation(id: string) {
    setSelectedId(id);
    const res = await fetch(`/api/admin/visitor-chat/${id}`);
    const data = await res.json();
    if (!data.ok) {
      setToast(data.error || "Could not open conversation.");
      return;
    }
    setMessages(data.messages || []);
    setMeta({
      unreadMessages: 0,
      blocked: Boolean(data.conversation?.blocked),
      archived: Boolean(data.conversation?.archived),
    });
    await loadList();
  }

  useEffect(() => {
    loadList();
    const timer = window.setInterval(loadList, 15000);
    return () => window.clearInterval(timer);
  }, []);

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || !reply.trim()) return;
    const res = await fetch("/api/admin/visitor-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: selectedId,
        message: reply,
        csrfToken,
      }),
    });
    const data = await res.json();
    setToast(data.ok ? "Reply sent." : data.error || "Failed to send reply.");
    if (data.ok) {
      setReply("");
      setMessages(data.messages || []);
      await loadList();
      notifyVisitorChatChanged();
    }
  }

  async function act(action: string) {
    if (!selectedId) return;
    if (action === "delete") {
      setPendingDelete({ kind: "conversation", id: selectedId });
      return;
    }

    const res = await fetch("/api/admin/visitor-chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedId, action, csrfToken }),
    });
    const data = await res.json();
    setToast(data.ok ? "Conversation updated." : data.error || "Failed");
    if (data.ok) {
      await openConversation(selectedId);
      notifyVisitorChatChanged();
    }
  }

  const visible = conversations.filter((c) => {
    if (filter === "all") return true;
    if (filter === "archived") return c.archived;
    if (filter === "blocked") return c.blocked;
    return !c.archived && !c.blocked;
  });

  const deleteTitle =
    pendingDelete?.kind === "conversation"
      ? "Delete this conversation?"
      : pendingDelete?.kind === "message"
        ? "Delete this message?"
        : "Delete";

  const deleteDescription =
    pendingDelete?.kind === "conversation"
      ? "Delete this visitor conversation and all of its replies? This permanently removes the conversation and cannot be recovered."
      : pendingDelete?.kind === "message"
        ? `Delete “${pendingDelete.preview}”? This message will be permanently removed and cannot be recovered.`
        : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Visitor Messages</h2>
          <p className="text-slate-500">
            Private one-to-one conversations between anonymous visitors and the admin. Visitors cannot
            message each other.
          </p>
        </div>
        {csrfToken ? (
          <SectionDangerZone
            scope="visitor-messages"
            csrfToken={csrfToken}
            onToast={setToast}
            onDeleted={async () => {
              setSelectedId(null);
              setMessages([]);
              await loadList();
              notifyVisitorChatChanged();
            }}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["active", "archived", "blocked", "all"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`admin-btn secondary ${filter === value ? "ring-2 ring-blue-400" : ""}`}
            onClick={() => setFilter(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
        <button type="button" className="admin-btn secondary" onClick={loadList}>
          Refresh
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {visible.length === 0 ? (
            <p className="admin-card p-5 text-slate-500">No visitor conversations yet.</p>
          ) : (
            visible.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-card block w-full p-4 text-left ${selectedId === item.id ? "ring-2 ring-blue-400" : ""}`}
                onClick={() => openConversation(item.id)}
              >
                <p className="font-bold">
                  {item.unreadCount > 0 ? "● " : ""}
                  Visitor conversation
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.preview}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.lastMessageAt
                    ? new Date(item.lastMessageAt).toLocaleString()
                    : new Date(item.createdAt).toLocaleString()}
                  {item.blocked ? " · Blocked" : ""}
                  {item.archived ? " · Archived" : ""}
                  {item.unreadCount > 0 ? ` · ${item.unreadCount} unread` : ""}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="admin-card flex min-h-[28rem] flex-col p-4">
          {!selectedId ? (
            <p className="m-auto text-slate-500">Select a conversation to read and reply.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <button className="admin-btn secondary" type="button" onClick={() => act("mark-read")}>
                  Mark read
                </button>
                <button className="admin-btn secondary" type="button" onClick={() => act("mark-unread")}>
                  Mark unread
                </button>
                <button
                  className="admin-btn secondary"
                  type="button"
                  onClick={() => act(meta.archived ? "unarchive" : "archive")}
                >
                  {meta.archived ? "Unarchive" : "Archive"}
                </button>
                <button
                  className="admin-btn secondary"
                  type="button"
                  onClick={() => act(meta.blocked ? "unblock" : "block")}
                >
                  {meta.blocked ? "Unblock" : "Block spam"}
                </button>
                <button className="admin-btn danger" type="button" onClick={() => act("delete")}>
                  Delete conversation
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3">
                {messages.length === 0 ? (
                  <p className="text-slate-500">No messages yet.</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        message.senderRole === "admin"
                          ? "ml-auto bg-sky-100 text-slate-800"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {message.senderRole === "admin" ? (
                        <p className="mb-1 text-xs font-bold text-sky-800">Reply from Admin</p>
                      ) : null}
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={`text-[11px] ${
                            message.senderRole === "admin" ? "text-slate-500" : "text-blue-100"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleString()} · {message.statusLabel}
                        </p>
                        <button
                          type="button"
                          className={`text-xs font-bold underline-offset-2 hover:underline ${
                            message.senderRole === "admin" ? "text-rose-700" : "text-rose-100"
                          }`}
                          onClick={() =>
                            setPendingDelete({
                              kind: "message",
                              id: message.id,
                              preview: message.body.slice(0, 80),
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendReply} className="mt-3 space-y-2">
                <label className="block text-sm font-semibold">
                  Reply as Admin
                  <textarea
                    className="admin-input mt-1"
                    rows={3}
                    maxLength={1000}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    disabled={meta.blocked}
                    required
                  />
                </label>
                <button className="admin-btn" type="submit" disabled={meta.blocked || !reply.trim()}>
                  Send reply
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        title={deleteTitle}
        description={deleteDescription}
        busy={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          setDeleting(true);
          const result =
            pendingDelete.kind === "conversation"
              ? await deleteJson("/api/admin/visitor-chat", {
                  conversationId: pendingDelete.id,
                  confirm: true,
                  csrfToken,
                })
              : await deleteJson("/api/admin/visitor-chat", {
                  messageId: pendingDelete.id,
                  confirm: true,
                  csrfToken,
                });
          setDeleting(false);
          if (result.ok) {
            setToast(result.message || "Deleted.");
            setPendingDelete(null);
            if (pendingDelete.kind === "conversation") {
              setSelectedId(null);
              setMessages([]);
              await loadList();
            } else if (selectedId) {
              await openConversation(selectedId);
            }
            notifyVisitorChatChanged();
          } else {
            setToast(result.error || "Deletion failed.");
          }
        }}
      />

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
