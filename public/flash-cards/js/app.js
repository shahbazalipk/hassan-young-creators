/**
 * Slash Cards — main application controller
 * Screens: Welcome → Setup → Quiz → Certificate (+ hidden Admin)
 */

import { Fireworks } from "./fireworks.js";
import {
  unlockAudio,
  playFireworksSound,
  playCelebrate,
  playClick,
} from "./audio.js";
import { getLeaderboard, saveScore } from "./storage.js";
import { selectQuestions } from "./questions.js";
import { renderLeaderboard } from "./leaderboard.js";
import { QuizEngine } from "./quiz.js";
import {
  fillCertificate,
  saveCertificatePng,
  copyResultLink,
  shareWithParentsWhatsApp,
} from "./certificate.js";
import {
  loginAdmin,
  logoutAdmin,
  checkAdminSession,
  getAllQuestions,
  upsertQuestion,
  deleteQuestion,
  renderQuestionsTable,
} from "./admin.js";

const SCREENS = [
  "welcome",
  "setup",
  "quiz",
  "certificate",
  "admin-login",
  "admin",
];

const state = {
  student: { name: "", age: 0 },
  cardCount: 10,
  lastResult: null,
  fireworksInterval: null,
};

const fireworks = new Fireworks(document.getElementById("fireworks-canvas"));

const quiz = new QuizEngine({
  onScoreChange: () => {
    /* score UI updated inside engine */
  },
  onComplete: (result) => finishQuiz(result),
});

function $(id) {
  return document.getElementById(id);
}

function showScreen(name) {
  SCREENS.forEach((s) => {
    const el = $(`screen-${s}`);
    if (!el) return;
    const active = s === name;
    el.classList.toggle("active", active);
    el.hidden = !active;
  });
}

/* ---------- Welcome ---------- */
function startWelcome() {
  showScreen("welcome");
  fireworks.start(1.15);
  // Periodic celebratory pops (user gesture unlocks audio on Start)
  clearInterval(state.fireworksInterval);
  state.fireworksInterval = setInterval(() => {
    if ($(`screen-welcome`)?.classList.contains("active")) {
      playFireworksSound();
    }
  }, 2800);
}

function leaveWelcome() {
  clearInterval(state.fireworksInterval);
  state.fireworksInterval = null;
  fireworks.stop();
  unlockAudio().then(() => playClick());
  goToSetup(false);
}

/* ---------- Setup ---------- */
function goToSetup(keepStudent = false) {
  showScreen("setup");
  fireworks.stop();
  renderLeaderboard(
    $("setup-leaderboard"),
    getLeaderboard(),
    keepStudent ? state.student.name : null
  );

  if (keepStudent && state.student.name) {
    $("student-name").value = state.student.name;
    $("student-age").value = String(state.student.age || "");
  }
}

function validateSetup() {
  const name = $("student-name").value.trim();
  const age = Number($("student-age").value);
  let ok = true;

  $("name-error").textContent = "";
  $("age-error").textContent = "";

  if (name.length < 2) {
    $("name-error").textContent = "Please enter your name (at least 2 letters).";
    ok = false;
  }
  if (!Number.isFinite(age) || age < 5 || age > 16) {
    $("age-error").textContent = "Age must be between 5 and 16.";
    ok = false;
  }
  return ok ? { name, age } : null;
}

function startQuizFromSetup(event) {
  event.preventDefault();
  const student = validateSetup();
  if (!student) return;

  const selected = document.querySelector('input[name="cardCount"]:checked');
  const cardCount = Number(selected?.value || 10);

  state.student = student;
  state.cardCount = cardCount;

  const bank = getAllQuestions();
  const questions = selectQuestions(bank, student.age, cardCount);
  if (!questions.length) {
    alert("No questions available. Ask an admin to add some!");
    return;
  }

  playClick();
  showScreen("quiz");
  renderLeaderboard($("quiz-leaderboard"), getLeaderboard(), student.name);

  quiz.bindElements({
    progress: $("quiz-progress"),
    scoreEl: $("quiz-score"),
    nameEl: $("card-student-name"),
    ageEl: $("card-student-age"),
    questionText: $("question-text"),
    optionsEl: $("answer-options"),
    feedback: $("feedback"),
    timerValue: $("timer-value"),
    timerWrap: document.querySelector(".timer-wrap"),
    timerArc: $("timer-arc"),
    card: $("slash-card"),
  });

  quiz.start(student, questions);
}

/* ---------- Certificate ---------- */
function finishQuiz(result) {
  const { score, total, student } = result;
  state.lastResult = { name: student.name, age: student.age, score, total };

  saveScore({ name: student.name, age: student.age, score, total });
  fillCertificate(state.lastResult);
  renderLeaderboard($("final-leaderboard"), getLeaderboard(), student.name);

  showScreen("certificate");
  fireworks.start(1.4);
  fireworks.celebrate();
  playCelebrate();
  setTimeout(() => fireworks.stop(), 4500);
}

function showToast(msg) {
  const toast = $("action-toast");
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.hidden = true;
  }, 2500);
}

async function onSaveCertificate() {
  try {
    const safe = (state.lastResult?.name || "student").replace(/[^\w\-]+/g, "_");
    await saveCertificatePng(`slash-cards-${safe}.png`);
    showToast("Certificate saved!");
  } catch {
    showToast("Could not save — try a screenshot instead.");
  }
}

async function onCopyLink() {
  if (!state.lastResult) return;
  try {
    await copyResultLink(state.lastResult);
    showToast("Link copied to clipboard!");
  } catch {
    showToast("Copy failed — please try again.");
  }
}

function onShareParents() {
  if (!state.lastResult) return;
  shareWithParentsWhatsApp(state.lastResult);
}

/** Continue → reset round, ask for card count again (keep student). */
function onContinue() {
  fireworks.stop();
  playClick();
  quiz.stop();
  showScreen("setup");
  $("student-name").value = state.student.name;
  $("student-age").value = String(state.student.age);
  renderLeaderboard($("setup-leaderboard"), getLeaderboard(), state.student.name);
  showToast("Choose how many Slash Cards to play next!");
}

/* ---------- Admin ---------- */
function openAdminLogin() {
  quiz.stop();
  fireworks.stop();
  if (checkAdminSession()) {
    openAdminPanel();
    return;
  }
  showScreen("admin-login");
  $("admin-email").value = "";
  $("admin-password").value = "";
  $("admin-email-error").textContent = "";
  $("admin-password-error").textContent = "";
}

function openAdminPanel() {
  showScreen("admin");
  refreshAdminTable();
  resetQuestionForm();
}

function refreshAdminTable() {
  const filter = $("filter-difficulty").value;
  renderQuestionsTable($("questions-tbody"), filter, {
    onEdit: (q) => fillQuestionForm(q),
    onDelete: (q) => {
      if (confirm(`Delete this question?\n\n"${q.text}"`)) {
        deleteQuestion(q.id);
        refreshAdminTable();
      }
    },
  });
}

function fillQuestionForm(q) {
  $("question-id").value = q.id;
  $("q-text").value = q.text;
  $("q-opt-a").value = q.options[0];
  $("q-opt-b").value = q.options[1];
  $("q-opt-c").value = q.options[2];
  $("q-opt-d").value = q.options[3];
  $("q-correct").value = String(q.correct);
  $("q-difficulty").value = q.difficulty;
  $("btn-save-question").textContent = "Update Question";
  $("btn-cancel-edit").hidden = false;
  $("q-text").focus();
}

function resetQuestionForm() {
  $("question-form").reset();
  $("question-id").value = "";
  $("btn-save-question").textContent = "Add Question";
  $("btn-cancel-edit").hidden = true;
}

function onAdminLogin(event) {
  event.preventDefault();
  $("admin-email-error").textContent = "";
  $("admin-password-error").textContent = "";

  const email = $("admin-email").value;
  const password = $("admin-password").value;

  if (!loginAdmin(email, password)) {
    $("admin-password-error").textContent = "Invalid email or password.";
    return;
  }
  openAdminPanel();
}

function onSaveQuestion(event) {
  event.preventDefault();
  const data = {
    id: $("question-id").value || undefined,
    text: $("q-text").value.trim(),
    options: [
      $("q-opt-a").value.trim(),
      $("q-opt-b").value.trim(),
      $("q-opt-c").value.trim(),
      $("q-opt-d").value.trim(),
    ],
    correct: Number($("q-correct").value),
    difficulty: $("q-difficulty").value,
  };

  if (!data.text || data.options.some((o) => !o)) {
    alert("Please fill in the question and all four options.");
    return;
  }

  upsertQuestion(data);
  resetQuestionForm();
  refreshAdminTable();
}

/* ---------- Deep-link / secret routes ---------- */
function handleHashRoute() {
  const hash = (location.hash || "").toLowerCase();
  if (hash === "#admin") {
    openAdminLogin();
  }
}

function handleSharedResult() {
  const params = new URLSearchParams(location.search);
  if (params.get("result") !== "1") return false;

  const name = params.get("name") || "Student";
  const age = Number(params.get("age")) || 0;
  const score = Number(params.get("score")) || 0;
  const total = Number(params.get("total")) || 0;

  state.lastResult = { name, age, score, total };
  state.student = { name, age };
  fillCertificate(state.lastResult);
  renderLeaderboard($("final-leaderboard"), getLeaderboard(), name);
  showScreen("certificate");
  return true;
}

/* ---------- Wire events ---------- */
function init() {
  $("btn-enter").addEventListener("click", leaveWelcome);
  $("screen-welcome").addEventListener("click", (e) => {
    if (e.target.closest("#btn-enter")) return;
    if (e.target.closest("#admin-trigger")) return;
    leaveWelcome();
  });

  $("setup-form").addEventListener("submit", startQuizFromSetup);

  $("btn-save-cert").addEventListener("click", onSaveCertificate);
  $("btn-copy-link").addEventListener("click", onCopyLink);
  $("btn-share-parents").addEventListener("click", onShareParents);
  $("btn-continue").addEventListener("click", onContinue);

  $("admin-login-form").addEventListener("submit", onAdminLogin);
  $("btn-admin-back").addEventListener("click", () => goToSetup(true));
  $("btn-admin-logout").addEventListener("click", () => {
    logoutAdmin();
    goToSetup(true);
  });
  $("question-form").addEventListener("submit", onSaveQuestion);
  $("btn-cancel-edit").addEventListener("click", resetQuestionForm);
  $("filter-difficulty").addEventListener("change", refreshAdminTable);
  $("admin-trigger").addEventListener("click", openAdminLogin);

  // Triple-click brand mark also opens admin
  let brandClicks = 0;
  document.querySelector(".brand-mark")?.addEventListener("click", (e) => {
    e.stopPropagation();
    brandClicks += 1;
    setTimeout(() => {
      brandClicks = 0;
    }, 800);
    if (brandClicks >= 3) openAdminLogin();
  });

  window.addEventListener("hashchange", handleHashRoute);

  // Boot
  if (handleSharedResult()) return;
  if ((location.hash || "").toLowerCase() === "#admin") {
    openAdminLogin();
    return;
  }
  startWelcome();
  // Soft fireworks SFX after first user interaction only (autoplay policies)
  document.addEventListener(
    "pointerdown",
    () => {
      unlockAudio().then(() => {
        if ($("screen-welcome")?.classList.contains("active")) playFireworksSound();
      });
    },
    { once: true }
  );
}

init();
