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
  logoutAdmin,
  refreshAdminAccess,
  getAdminUser,
  getAllQuestions,
  upsertQuestion,
  deleteQuestion,
  renderQuestionsTable,
} from "./admin.js";
import {
  pingVisitor,
  fetchLeaderboard,
  startCloudQuiz,
  submitCloudQuiz,
} from "./cloud.js";

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
  playerKey: null,
  leaderboard: [],
  leaderboardError: "",
  leaderboardLoading: false,
  googleCredential: null,
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
async function refreshCloudLeaderboard(highlightName = null) {
  state.leaderboardLoading = true;
  state.leaderboardError = "";
  const targets = ["setup-leaderboard", "quiz-leaderboard", "final-leaderboard"]
    .map((id) => $(id))
    .filter(Boolean);
  targets.forEach((el) => {
    el.innerHTML = `<p class="leaderboard-empty">Loading global leaderboard…</p>`;
  });
  try {
    const entries = await fetchLeaderboard(20);
    state.leaderboard = entries;
    targets.forEach((el) => renderLeaderboard(el, entries, highlightName));
  } catch (err) {
    state.leaderboardError = err?.message || "Could not load global leaderboard.";
    // Local fallback snapshot so the UI is never blank.
    const local = getLeaderboard();
    targets.forEach((el) => {
      renderLeaderboard(el, local, highlightName);
      const note = document.createElement("p");
      note.className = "leaderboard-empty";
      note.textContent = "Showing local scores — global board temporarily unavailable.";
      el.appendChild(note);
    });
  } finally {
    state.leaderboardLoading = false;
  }
}

function goToSetup(keepStudent = false) {
  showScreen("setup");
  fireworks.stop();
  refreshCloudLeaderboard(keepStudent ? state.student.name : null);

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
  if (!Number.isFinite(age) || age < 4 || age > 18) {
    $("age-error").textContent = "Age must be between 4 and 18.";
    ok = false;
  }
  return ok ? { name, age } : null;
}

async function startQuizFromSetup(event) {
  event.preventDefault();
  const student = validateSetup();
  if (!student) return;

  const selected = document.querySelector('input[name="cardCount"]:checked');
  const cardCount = Number(selected?.value || 10);

  state.student = student;
  state.cardCount = cardCount;

  playClick();
  showScreen("quiz");
  refreshCloudLeaderboard(student.name);

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

  try {
    const cloud = await startCloudQuiz({
      displayName: student.name,
      age: student.age,
      count: cardCount,
      playerKey: state.playerKey,
    });
    state.playerKey = cloud.playerKey || state.playerKey;
    const questions = (cloud.questions || []).map((q) => ({
      id: q.id,
      publicId: q.publicId,
      text: q.text,
      options: q.options,
      // correct omitted on purpose — graded on server
    }));
    if (!questions.length) throw new Error("No age-appropriate questions returned.");
    quiz.start(student, questions, { cloudMode: true, sessionId: cloud.sessionId });
  } catch (err) {
    // Offline/local fallback with age-safe selector (no harder spill).
    const bank = getAllQuestions();
    const questions = selectQuestions(bank, student.age, cardCount);
    if (!questions.length) {
      alert(err?.message || "No questions available. Ask an admin to add some!");
      goToSetup(true);
      return;
    }
    showToast("Playing offline mode — scores stay on this device until cloud is back.");
    quiz.start(student, questions, { cloudMode: false });
  }
}

/* ---------- Certificate ---------- */
async function finishQuiz(result) {
  const { score, total, student, answers, durationMs, sessionId, cloudMode } = result;
  let finalScore = score;
  let finalTotal = total;

  if (cloudMode && sessionId) {
    try {
      const safeAnswers = (answers || []).map((a) => ({
        questionId: a.questionId,
        selectedIndex: Number.isInteger(a.selectedIndex) ? a.selectedIndex : -1,
      }));
      const submitted = await submitCloudQuiz(sessionId, safeAnswers, durationMs);
      finalScore = submitted.score;
      finalTotal = submitted.total;
    } catch (err) {
      showToast(err?.message || "Could not sync score to global leaderboard.");
      // Keep local score from partial client tracking (0 in cloud mode) — prefer failure message.
    }
  } else {
    saveScore({ name: student.name, age: student.age, score: finalScore, total: finalTotal });
  }

  state.lastResult = { name: student.name, age: student.age, score: finalScore, total: finalTotal };
  fillCertificate(state.lastResult);
  await refreshCloudLeaderboard(student.name);

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

async function setupGoogleAuth() {
  const box = $("google-auth-box");
  const status = $("auth-status");
  const signOutBtn = $("btn-google-signout");
  if (!box) return;

  try {
    const cfg = await fetch("/api/public-config").then((r) => r.json());
    const clientId = cfg?.googleClientId;
    if (!cfg?.ok || !clientId) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (cfg.privacyNote && status) status.textContent = cfg.privacyNote;

    await new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Google script failed"));
      document.head.appendChild(s);
    });

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        state.googleCredential = response.credential;
        // Shared account session (same UID across all three sites)
        const csrfData = await fetch("/api/user/auth", {
          credentials: "same-origin",
        }).then((r) => r.json());
        const auth = await fetch("/api/user/auth", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "google",
            googleIdToken: response.credential,
            csrfToken: csrfData.csrfToken,
            next: "/flash-cards",
          }),
        }).then((r) => r.json());
        if (auth?.ok && auth.user) {
          state.playerKey = `user:${auth.user.uid}`;
          state.authUser = auth.user;
          if (status) status.textContent = `Signed in as ${auth.user.displayName}.`;
          if (signOutBtn) signOutBtn.hidden = false;
          if ($("student-name") && !$("student-name").value) {
            $("student-name").value = auth.user.displayName.slice(0, 40);
          }
          return;
        }
        // Fallback: visitor analytics only
        const ping = await pingVisitor(response.credential);
        if (ping?.ok) {
          state.playerKey = ping.visitor?.playerKey || state.playerKey;
          if (status) {
            status.textContent = `Signed in as ${ping.visitor?.displayName || "Google user"}.`;
          }
          if (signOutBtn) signOutBtn.hidden = false;
        }
      },
    });

    window.google.accounts.id.renderButton($("google-signin-btn"), {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
    });

    signOutBtn?.addEventListener("click", () => {
      state.googleCredential = null;
      window.google?.accounts?.id?.disableAutoSelect?.();
      if (signOutBtn) signOutBtn.hidden = true;
      if (status) status.textContent = "Signed out. Playing as guest (anonymous visitor ID).";
      pingVisitor().then((data) => {
        if (data?.ok) state.playerKey = data.visitor?.playerKey || state.playerKey;
      });
    });
  } catch {
    if (box) box.hidden = true;
  }
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
  refreshCloudLeaderboard(state.student.name);
  showToast("Choose how many Slash Cards to play next!");
}

/* ---------- Admin ---------- */
async function openAdminLogin() {
  quiz.stop();
  fireworks.stop();
  const ok = await refreshAdminAccess();
  if (ok) {
    openAdminPanel();
    return;
  }
  // No client-side admin passwords — use shared Hassan admin login.
  window.location.href = "/admin/login?next=" + encodeURIComponent("/flash-cards/#admin");
}

function openAdminPanel() {
  showScreen("admin");
  refreshAdminTable();
  resetQuestionForm();
  const note = $("admin-auth-note");
  if (note) {
    const u = getAdminUser();
    note.textContent = u
      ? `Signed in as ${u.displayName} (server-verified administrator).`
      : "Administrator access verified.";
  }
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
  // Legacy form — redirect to secure shared admin login.
  window.location.href = "/admin/login?next=" + encodeURIComponent("/flash-cards/#admin");
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
  refreshCloudLeaderboard(name);
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

  // Boot — restore shared session first (same cookie as portfolio + KidMind).
  setupGoogleAuth();
  (async () => {
    const session = await fetch("/api/user/auth", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((r) => r.json())
      .catch(() => null);

    if (session?.ok && session.isLoggedIn && session.user) {
      state.playerKey = `user:${session.user.uid}`;
      state.authUser = session.user;
      const bar = $("shared-auth-bar");
      if (bar) {
        bar.hidden = false;
        bar.innerHTML = `<span>Signed in as <strong>${session.user.displayName}</strong></span>
          <button type="button" id="btn-shared-logout" class="btn btn-ghost">Sign out</button>`;
        $("btn-shared-logout")?.addEventListener("click", async () => {
          await fetch("/api/user/auth", { method: "DELETE", credentials: "same-origin" });
          window.location.reload();
        });
      }
      if ($("student-name") && !$("student-name").value) {
        $("student-name").value = session.user.displayName.slice(0, 40);
      }
    } else {
      const bar = $("shared-auth-bar");
      if (bar) {
        bar.hidden = false;
        bar.innerHTML = `<a class="btn btn-ghost" href="/login?next=${encodeURIComponent("/flash-cards")}">Sign in</a>
          <a class="btn btn-ghost" href="/register?next=${encodeURIComponent("/flash-cards")}">Create account</a>`;
      }
      const ping = await pingVisitor(state.googleCredential);
      if (ping?.ok && ping.visitor?.playerKey) {
        state.playerKey = ping.visitor.playerKey;
      }
    }

    await refreshAdminAccess();

    if (handleSharedResult()) return;
    if ((location.hash || "").toLowerCase() === "#admin") {
      openAdminLogin();
      return;
    }
    startWelcome();
  })();

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
