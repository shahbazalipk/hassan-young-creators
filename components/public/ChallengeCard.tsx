"use client";

import { FormEvent, useState } from "react";

type Challenge = { id: string; title: string; description: string };

export function ChallengeCard({
  challenge,
  csrfToken,
}: {
  challenge: Challenge;
  csrfToken: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch("/api/challenges/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          nickname: String(form.get("nickname") || "Anonymous Creator"),
          note: String(form.get("note") || ""),
          csrfToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error || "Could not submit.");
        setLoading(false);
        return;
      }
      setMessage(data.message);
      if (data.celebrate) launchConfetti();
      event.currentTarget.reset();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="glass-card project-card reveal">
      <div className="project-body">
        <h3>{challenge.title}</h3>
        <p>{challenge.description}</p>
        <button className="btn btn-primary" type="button" onClick={() => setOpen((v) => !v)} data-cursor="link">
          {open ? "Hide form" : "I completed this"}
        </button>
        {open ? (
          <form onSubmit={onSubmit} style={{ marginTop: "0.9rem" }}>
            <label>
              Nickname
              <input className="admin-input" name="nickname" defaultValue="Anonymous Creator" maxLength={40} />
            </label>
            <label style={{ display: "block", marginTop: "0.6rem" }}>
              What did you try? (no private details)
              <textarea className="admin-input" name="note" rows={3} required minLength={3} maxLength={300} />
            </label>
            <button className="btn btn-ghost" type="submit" disabled={loading} style={{ marginTop: "0.7rem" }}>
              {loading ? "Sending…" : "Send for approval"}
            </button>
          </form>
        ) : null}
        {message ? <p className="contact-note" style={{ marginTop: "0.6rem" }}>{message}</p> : null}
      </div>
    </article>
  );
}

function launchConfetti() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  const colors = ["#3de7ff", "#9b6bff", "#ffd166", "#ff7a6e", "#5dffb0"];
  for (let i = 0; i < 28; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.25}s`;
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), 1800);
  }
}
