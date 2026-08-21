/**
 * Slash Cards admin — uses shared server auth (no hardcoded passwords).
 * Question CRUD remains local for offline play; admin panel access requires AppUser.role ADMIN.
 */

import { DEFAULT_QUESTIONS, createQuestionId } from "./questions.js";
import {
  getCustomQuestions,
  setCustomQuestions,
  getDeletedDefaultIds,
  setDeletedDefaultIds,
} from "./storage.js";

let adminAllowed = false;
let cachedUser = null;

export async function refreshAdminAccess() {
  try {
    const data = await fetch("/api/user/auth", {
      credentials: "same-origin",
      cache: "no-store",
    }).then((r) => r.json());
    cachedUser = data.user || null;
    adminAllowed = Boolean(data.ok && data.isLoggedIn && data.user && data.user.isAdmin);
    return adminAllowed;
  } catch {
    adminAllowed = false;
    cachedUser = null;
    return false;
  }
}

export function checkAdminSession() {
  return adminAllowed;
}

export function getAdminUser() {
  return cachedUser;
}

/** @deprecated Client credential login removed — use Hassan admin / shared auth. */
export async function loginAdmin() {
  return refreshAdminAccess();
}

export async function logoutAdmin() {
  await fetch("/api/user/auth", { method: "DELETE", credentials: "same-origin" });
  adminAllowed = false;
  cachedUser = null;
}

export function getAllQuestions() {
  const deleted = new Set(getDeletedDefaultIds());
  const defaults = DEFAULT_QUESTIONS.filter((q) => !deleted.has(q.id));
  return [...defaults, ...getCustomQuestions()];
}

export function upsertQuestion(data) {
  const list = getCustomQuestions();
  const id = data.id || createQuestionId();
  const next = {
    id,
    text: data.text,
    options: data.options,
    correct: data.correct,
    difficulty: data.difficulty,
  };
  const idx = list.findIndex((q) => q.id === id);
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  setCustomQuestions(list);

  // If editing a default id, soft-delete default so custom wins
  if (DEFAULT_QUESTIONS.some((q) => q.id === id)) {
    const deleted = new Set(getDeletedDefaultIds());
    deleted.add(id);
    setDeletedDefaultIds([...deleted]);
  }
  return next;
}

export function deleteQuestion(id) {
  const custom = getCustomQuestions().filter((q) => q.id !== id);
  setCustomQuestions(custom);
  if (DEFAULT_QUESTIONS.some((q) => q.id === id)) {
    const deleted = new Set(getDeletedDefaultIds());
    deleted.add(id);
    setDeletedDefaultIds([...deleted]);
  }
}

export function renderQuestionsTable(tbody, filter, { onEdit, onDelete }) {
  const all = getAllQuestions();
  const rows = filter && filter !== "all" ? all.filter((q) => q.difficulty === filter) : all;
  tbody.innerHTML = "";
  rows.forEach((q) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${q.difficulty}</td><td>${q.text}</td><td></td>`;
    const actions = tr.querySelector("td:last-child");
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => onEdit(q));
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", () => onDelete(q));
    actions.append(edit, del);
    tbody.appendChild(tr);
  });
}
