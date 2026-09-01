/**
 * Cloud API helpers for Flash Cards (same-domain Next.js backend).
 * Leaderboard and quiz grading are server-authoritative — never localStorage.
 */

const APP = "flash-cards";

export async function pingVisitor(googleIdToken) {
  try {
    const res = await fetch("/api/visitors/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(googleIdToken ? { googleIdToken } : {}),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Could not record visit." };
  }
}

/**
 * @param {object} [opts]
 * @param {number} [opts.limit]
 * @param {string|null} [opts.cursor]
 * @param {'all'|'week'|'month'} [opts.period]
 */
export async function fetchLeaderboard(opts = {}) {
  const limit = opts.limit || 20;
  const cursor = opts.cursor || "";
  const period = opts.period || "all";
  const params = new URLSearchParams({
    app: APP,
    limit: String(limit),
    period,
  });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/leaderboard?${params.toString()}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Could not reach the global leaderboard.");
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Failed to load leaderboard");
  return {
    entries: (data.entries || []).map((e) => ({
      id: e.id,
      name: e.displayName,
      age: e.age,
      score: e.correctCount,
      total: e.totalQuestions,
      percent: e.scorePercent,
      at: new Date(e.completedAt).getTime(),
      durationMs: e.durationMs,
      ageBand: e.ageBand,
    })),
    nextCursor: data.nextCursor || null,
    period: data.period || period,
    rankingRules: data.rankingRules || "",
  };
}

export async function startCloudQuiz({ displayName, age, count, playerKey }) {
  const res = await fetch("/api/quiz/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      app: APP,
      displayName,
      age,
      count,
      playerKey,
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Could not start quiz");
  return data;
}

export async function submitCloudQuiz(sessionId, answers, durationMs) {
  const res = await fetch(`/api/quiz/sessions/${encodeURIComponent(sessionId)}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ answers, durationMs }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Could not submit quiz");
  return data;
}
