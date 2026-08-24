/**
 * Shared same-origin auth client for portfolio / KidMind / Flash Cards.
 * Uses HTTP-only cookie session via /api/user/auth — never stores passwords or tokens in localStorage.
 */
(function (global) {
  const API = "/api/user/auth";

  async function getSession() {
    const res = await fetch(API, { credentials: "same-origin", cache: "no-store" });
    return res.json();
  }

  async function ensureCsrf(csrfToken) {
    if (csrfToken && String(csrfToken).length >= 10) return csrfToken;
    const boot = await getSession();
    return boot.csrfToken || "";
  }

  async function login(email, password, csrfToken, next) {
    const token = await ensureCsrf(csrfToken);
    const res = await fetch(API, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password, csrfToken: token, next }),
    });
    return res.json().catch(function () {
      return { ok: false, error: "Unable to sign in right now. Please refresh and try again." };
    });
  }

  async function register(payload) {
    const token = await ensureCsrf(payload && payload.csrfToken);
    const res = await fetch(API, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", ...payload, csrfToken: token }),
    });
    return res.json().catch(function () {
      return {
        ok: false,
        error: "Unable to create the account right now. Please refresh and try again.",
      };
    });
  }

  async function loginWithGoogle(googleIdToken, csrfToken, next) {
    const res = await fetch(API, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "google", googleIdToken, csrfToken, next }),
    });
    return res.json();
  }

  async function logout() {
    const res = await fetch(API, { method: "DELETE", credentials: "same-origin" });
    return res.json();
  }

  /**
   * Wait for session restore before showing login UI.
   * Returns { isLoggedIn, user, csrfToken }.
   */
  async function waitForSession(options) {
    const el = options && options.loadingEl;
    if (el) {
      el.hidden = false;
      el.textContent = options.loadingText || "Checking your session…";
    }
    try {
      const data = await getSession();
      return data;
    } finally {
      if (el) el.hidden = true;
    }
  }

  function loginUrl(nextPath) {
    const next = nextPath || global.location.pathname + global.location.search;
    return "/login?next=" + encodeURIComponent(next);
  }

  global.HassanSharedAuth = {
    getSession,
    login,
    register,
    loginWithGoogle,
    logout,
    waitForSession,
    loginUrl,
  };
})(typeof window !== "undefined" ? window : globalThis);
