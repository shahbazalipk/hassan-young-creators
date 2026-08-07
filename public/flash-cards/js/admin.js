/**
 * Admin auth + question CRUD (localStorage-backed).
 */

import {
  getCustomQuestions,
  setCustomQuestions,
  getDeletedDefaultIds,
  setDeletedDefaultIds,
  isAdminLoggedIn,
  setAdminLoggedIn,
} from "./storage.js";
import { DEFAULT_QUESTIONS, createQuestionId } from "./questions.js";

/** Demo credentials for the hidden admin panel */
export const ADMIN_CREDENTIALS = {
  email: "admin@slashcards.com",
  password: "Admin@123",
};

export function loginAdmin(email, password) {
  const ok =
    email.trim().toLowerCase() === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password;
  if (ok) setAdminLoggedIn(true);
  return ok;
}

export function logoutAdmin() {
  setAdminLoggedIn(false);
}

export function checkAdminSession() {
  return isAdminLoggedIn();
}

/** Merged question bank (defaults minus deleted + custom). */
export function getAllQuestions() {
  const deleted = new Set(getDeletedDefaultIds());
  const defaults = DEFAULT_QUESTIONS.filter((q) => !deleted.has(q.id));
  return [...defaults, ...getCustomQuestions()];
}

export function upsertQuestion(data) {
  const customs = getCustomQuestions();
  if (data.id && customs.some((q) => q.id === data.id)) {
    const next = customs.map((q) => (q.id === data.id ? { ...q, ...data } : q));
    setCustomQuestions(next);
    return;
  }

  // Editing a default: store override as custom with same id, mark default deleted
  if (data.id && DEFAULT_QUESTIONS.some((q) => q.id === data.id)) {
    const deleted = new Set(getDeletedDefaultIds());
    deleted.add(data.id);
    setDeletedDefaultIds([...deleted]);
    const without = customs.filter((q) => q.id !== data.id);
    without.push({ ...data });
    setCustomQuestions(without);
    return;
  }

  const id = data.id || createQuestionId();
  customs.push({ ...data, id });
  setCustomQuestions(customs);
}

export function deleteQuestion(id) {
  const customs = getCustomQuestions().filter((q) => q.id !== id);
  setCustomQuestions(customs);

  if (DEFAULT_QUESTIONS.some((q) => q.id === id)) {
    const deleted = new Set(getDeletedDefaultIds());
    deleted.add(id);
    setDeletedDefaultIds([...deleted]);
  }
}

export function renderQuestionsTable(tbody, filter = "all", handlers = {}) {
  tbody.innerHTML = "";
  let list = getAllQuestions();
  if (filter !== "all") list = list.filter((q) => q.difficulty === filter);

  if (!list.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">No questions found.</td>`;
    tbody.appendChild(tr);
    return;
  }

  list.forEach((q) => {
    const tr = document.createElement("tr");
    const correctLabel = `${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}`;
    tr.innerHTML = `
      <td>${escapeHtml(q.text)}</td>
      <td><span class="badge badge-${q.difficulty}">${q.difficulty}</span></td>
      <td>${escapeHtml(correctLabel)}</td>
      <td class="q-actions"></td>
    `;
    const actions = tr.querySelector(".q-actions");

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-secondary btn-sm";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => handlers.onEdit?.(q));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn btn-ghost btn-sm";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => handlers.onDelete?.(q));

    actions.append(editBtn, delBtn);
    tbody.appendChild(tr);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
