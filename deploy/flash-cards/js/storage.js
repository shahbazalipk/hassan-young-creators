/**
 * LocalStorage helpers for leaderboard, custom questions, and admin session.
 */

const KEYS = {
  LEADERBOARD: "slashcards_leaderboard",
  QUESTIONS: "slashcards_custom_questions",
  ADMIN: "slashcards_admin_session",
  DELETED_DEFAULTS: "slashcards_deleted_defaults",
};

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLeaderboard() {
  return readJSON(KEYS.LEADERBOARD, []);
}

/** Persist a score and return the updated sorted leaderboard (top 10). */
export function saveScore(entry) {
  const list = getLeaderboard();
  list.push({
    name: entry.name,
    age: entry.age,
    score: entry.score,
    total: entry.total,
    percent: entry.total ? Math.round((entry.score / entry.total) * 100) : 0,
    at: Date.now(),
  });
  list.sort((a, b) => {
    if (b.percent !== a.percent) return b.percent - a.percent;
    if (b.score !== a.score) return b.score - a.score;
    return a.at - b.at;
  });
  const top = list.slice(0, 10);
  writeJSON(KEYS.LEADERBOARD, top);
  return top;
}

export function getCustomQuestions() {
  return readJSON(KEYS.QUESTIONS, []);
}

export function setCustomQuestions(questions) {
  writeJSON(KEYS.QUESTIONS, questions);
}

export function getDeletedDefaultIds() {
  return readJSON(KEYS.DELETED_DEFAULTS, []);
}

export function setDeletedDefaultIds(ids) {
  writeJSON(KEYS.DELETED_DEFAULTS, ids);
}

export function isAdminLoggedIn() {
  return readJSON(KEYS.ADMIN, null)?.ok === true;
}

export function setAdminLoggedIn(ok) {
  if (ok) writeJSON(KEYS.ADMIN, { ok: true, at: Date.now() });
  else localStorage.removeItem(KEYS.ADMIN);
}

export { KEYS };
