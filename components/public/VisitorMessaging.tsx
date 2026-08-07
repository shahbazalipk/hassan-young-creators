"use client";

import { FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  senderRole: "visitor" | "admin";
  body: string;
  createdAt: string;
  ticks: "sent" | "delivered" | "read" | null;
  statusLabel: string;
};

type PanelMode = "closed" | "open";

function DeliveryTicks({ ticks, label }: { ticks: ChatMessage["ticks"]; label: string }) {
  if (!ticks) return null;
  const color = ticks === "read" ? "vm-tick-read" : "vm-tick-muted";
  return (
    <span className={`vm-ticks ${color}`} title={label} aria-label={label}>
      {ticks === "sent" ? "✓" : "✓✓"}
    </span>
  );
}

export function VisitorMessaging({
  csrfToken,
  enabled,
}: {
  csrfToken: string;
  enabled: boolean;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [unreadAdminReplies, setUnreadAdminReplies] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [messagingOn, setMessagingOn] = useState(enabled);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const loadConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/visitor-chat");
      const data = await res.json();
      if (!data.ok) return;
      setMessagingOn(data.enabled !== false);
      setBlocked(Boolean(data.blocked));
      setMessages(data.messages || []);
      setUnreadAdminReplies(Number(data.unreadAdminReplies) || 0);
    } catch {
      // Keep previous state.
    }
  }, []);

  const markSeen = useCallback(async () => {
    try {
      const res = await fetch("/api/visitor-chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages || []);
        setUnreadAdminReplies(0);
      }
    } catch {
      // Ignore temporary failures.
    }
  }, [csrfToken]);

  useEffect(() => {
    loadConversation();
    const timer = window.setInterval(loadConversation, 12000);
    return () => window.clearInterval(timer);
  }, [loadConversation]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    loadConversation().finally(() => setLoading(false));
    markSeen();
    const focusTimer = window.setTimeout(() => textareaRef.current?.focus(), 180);
    return () => window.clearTimeout(focusTimer);
  }, [open, loadConversation, markSeen]);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function openPanel(_mode: PanelMode = "open") {
    setOpen(true);
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || status === "sending" || blocked || !messagingOn) return;
    const outgoing = draft;
    setStatus("sending");
    setStatusText("Sending your message…");
    try {
      const res = await fetch("/api/visitor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: outgoing,
          website: "",
          csrfToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setStatusText(data.error || "We couldn’t send your message. Please try again.");
        return;
      }
      setDraft("");
      setMessages(data.messages || []);
      setUnreadAdminReplies(Number(data.unreadAdminReplies) || 0);
      setStatus("success");
      setStatusText("Your message was sent to the admin.");
    } catch {
      setStatus("error");
      setStatusText("We couldn’t send your message. Please try again.");
    }
  }

  async function clearConversation() {
    if (!window.confirm("Clear your conversation access from this device?")) return;
    const res = await fetch("/api/visitor-chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken }),
    });
    const data = await res.json();
    if (data.ok) {
      setMessages([]);
      setUnreadAdminReplies(0);
      setStatus("idle");
      setStatusText("");
    }
  }

  return (
    <>
      <section className="section visitor-message-cta" id="message-admin" aria-labelledby={titleId}>
        <div className="container">
          <div className="visitor-message-cta-card reveal">
            <p className="eyebrow">Private &amp; safe</p>
            <h2 id={titleId}>Message the Admin</h2>
            <p className="section-lead">
              Have a question, suggestion, or idea? Send a safe message to the website admin.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              data-cursor="link"
              onClick={() => openPanel("open")}
            >
              Write a Message
            </button>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="visitor-messages-tab"
        aria-label={
          unreadAdminReplies > 0
            ? `Your Messages, ${unreadAdminReplies} unread admin replies`
            : "Your Messages"
        }
        aria-expanded={open}
        aria-controls="visitor-message-drawer"
        onClick={() => openPanel("open")}
        data-cursor="link"
      >
        <span className="visitor-messages-tab-icon" aria-hidden="true">
          💬
        </span>
        <span className="visitor-messages-tab-label">Your Messages</span>
        {unreadAdminReplies > 0 ? (
          <span className="visitor-messages-tab-badge" aria-hidden="true">
            {unreadAdminReplies > 9 ? "9+" : unreadAdminReplies}
          </span>
        ) : null}
      </button>

      {open ? (
        <button
          type="button"
          className="visitor-message-backdrop"
          aria-label="Close messages panel"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="visitor-message-drawer"
        className={`visitor-message-drawer ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="visitor-drawer-title"
        hidden={!open}
      >
        <header className="visitor-message-drawer-header">
          <div>
            <h2 id="visitor-drawer-title">Your Messages</h2>
            <p>Your messages are privately saved for this browser.</p>
          </div>
          <button
            type="button"
            className="visitor-message-close"
            aria-label="Close messages"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </header>

        <div className="visitor-message-list" ref={listRef}>
          {!messagingOn ? (
            <p className="visitor-message-empty">Messages are temporarily unavailable.</p>
          ) : loading && messages.length === 0 ? (
            <p className="visitor-message-empty">Loading your private messages…</p>
          ) : messages.length === 0 ? (
            <p className="visitor-message-empty">
              No messages yet. You can safely send a question or suggestion to the admin.
            </p>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`visitor-bubble-row ${message.senderRole === "visitor" ? "is-visitor" : "is-admin"}`}
              >
                {message.senderRole === "admin" ? (
                  <p className="visitor-bubble-label">Reply from Admin</p>
                ) : null}
                <div className={`visitor-bubble ${message.senderRole === "visitor" ? "visitor" : "admin"}`}>
                  <p>{message.body}</p>
                </div>
                <div className="visitor-bubble-meta">
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleString()}
                  </time>
                  <DeliveryTicks ticks={message.ticks} label={message.statusLabel} />
                  <span className="sr-only">{message.statusLabel}</span>
                </div>
              </article>
            ))
          )}
        </div>

        <form className="visitor-message-composer" onSubmit={onSend}>
          <p className="visitor-safety-note">
            Please do not share your full name, email, phone number, school, address, passwords,
            photos, or location.
          </p>
          {blocked ? (
            <p className="visitor-message-status" role="status">
              This conversation cannot send more messages.
            </p>
          ) : null}
          {!messagingOn ? (
            <p className="visitor-message-status" role="status">
              Messages are temporarily unavailable.
            </p>
          ) : null}
          <label className="sr-only" htmlFor="visitor-chat-input">
            Write a message to the admin
          </label>
          <textarea
            id="visitor-chat-input"
            ref={textareaRef}
            className="visitor-message-input"
            rows={3}
            maxLength={1000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a safe message…"
            disabled={blocked || !messagingOn || status === "sending"}
          />
          <label className="sr-only" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
          <div className="visitor-message-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={blocked || !messagingOn || status === "sending" || !draft.trim()}
              data-cursor="link"
            >
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clearConversation}>
              Clear My Conversation From This Device
            </button>
          </div>
          {statusText ? (
            <p
              className={`visitor-message-status ${status === "error" ? "is-error" : ""}`}
              role="status"
            >
              {statusText}
            </p>
          ) : null}
        </form>
      </aside>
    </>
  );
}
