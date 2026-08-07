"use client";

import { useState } from "react";

type Idea = { id: string; title: string; prompt: string };

export function IdeaGenerator({ ideas }: { ideas: Idea[] }) {
  const [index, setIndex] = useState(0);
  const idea = ideas[index] || null;

  function nextIdea() {
    if (!ideas.length) return;
    setIndex((current) => (current + 1) % ideas.length);
  }

  return (
    <div className="contact-card reveal" style={{ marginTop: "2rem" }}>
      <p className="eyebrow">Safe project-idea generator</p>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>
        Need an idea?
      </h3>
      {idea ? (
        <>
          <p className="contact-message">{idea.title}</p>
          <p className="contact-note">{idea.prompt}</p>
        </>
      ) : (
        <p className="contact-note">Ideas will appear here once a parent adds them.</p>
      )}
      <button className="btn btn-primary" type="button" onClick={nextIdea} style={{ marginTop: "1rem" }} data-cursor="link">
        Surprise me with another idea
      </button>
    </div>
  );
}
