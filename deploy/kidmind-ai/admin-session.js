/** Admin authentication — shared Hassan server session (no hardcoded passwords). */
var AdminSession = (function () {
  var cached = {
    ready: false,
    isAdmin: false,
    user: null,
    csrfToken: null,
  };

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  async function refreshFromServer() {
    try {
      var data = await fetch("/api/user/auth", {
        credentials: "same-origin",
        cache: "no-store",
      }).then(function (r) {
        return r.json();
      });
      cached.ready = true;
      cached.csrfToken = data.csrfToken || null;
      cached.user = data.user || null;
      cached.isAdmin = !!(data.ok && data.isLoggedIn && data.user && data.user.isAdmin);
      return cached.isAdmin;
    } catch (e) {
      cached.ready = true;
      cached.isAdmin = false;
      cached.user = null;
      return false;
    }
  }

  function isLoggedIn() {
    return cached.isAdmin;
  }

  function isOwnerAdmin() {
    return cached.isAdmin;
  }

  /** Removed: never escalate parent email to admin in the browser. */
  function ensureOwnerSession() {
    return false;
  }

  function verifyLoginPassword() {
    return false;
  }

  function login() {
    // Client-side password login removed. Use portfolio admin login.
    window.location.href = "/admin/login?next=" + encodeURIComponent("/admin");
    return false;
  }

  async function logout() {
    try {
      await fetch("/api/user/auth", { method: "DELETE", credentials: "same-origin" });
    } catch (e) {
      /* ignore */
    }
    cached.isAdmin = false;
    cached.user = null;
    return true;
  }

  function getSession() {
    if (!cached.isAdmin || !cached.user) return null;
    return {
      email: cached.user.email,
      name: cached.user.displayName,
      role: "ADMIN",
      token: "server-session",
      ownerOnly: true,
    };
  }

  function getOwnerEmail() {
    return cached.user && cached.user.email ? cached.user.email : "";
  }

  function isOwnerEmail(email) {
    if (!cached.user) return false;
    return normalizeEmail(email) === normalizeEmail(cached.user.email);
  }

  function hasPermission() {
    return cached.isAdmin;
  }

  function setTestMode() {
    return false;
  }

  function isTestMode() {
    return false;
  }

  // Compatibility stubs (no secrets).
  var DEFAULT_ADMIN = {
    email: "",
    password: "",
    name: "Administrator",
    role: "ADMIN",
  };

  // Kick off session restore immediately so sync checks work after await points.
  refreshFromServer();

  return {
    DEFAULT_ADMIN: DEFAULT_ADMIN,
    refreshFromServer: refreshFromServer,
    isLoggedIn: isLoggedIn,
    isOwnerAdmin: isOwnerAdmin,
    ensureOwnerSession: ensureOwnerSession,
    verifyLoginPassword: verifyLoginPassword,
    login: login,
    logout: logout,
    getSession: getSession,
    getOwnerEmail: getOwnerEmail,
    isOwnerEmail: isOwnerEmail,
    isTestMode: isTestMode,
    hasPermission: hasPermission,
    setTestMode: setTestMode,
    isReady: function () {
      return cached.ready;
    },
  };
})();
