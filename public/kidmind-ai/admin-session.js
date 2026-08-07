/** Admin authentication session */
var AdminSession = (function () {
  var STORAGE_KEY = "admin_session";
  var DEFAULT_ADMIN = {
    email: "admin@kidmind.ai",
    password: "HASSAAN@2026",
    role: AdminRBAC.ROLES.SUPER_ADMIN,
    name: "HASSAAN"
  };

  function getSession() {
    return DataStore.get(STORAGE_KEY, null);
  }

  function saveSession(data) {
    return DataStore.set(STORAGE_KEY, data);
  }

  function clearSession() {
    return DataStore.remove(STORAGE_KEY);
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function isDefaultOwnerEmail(email) {
    return normalizeEmail(email) === normalizeEmail(DEFAULT_ADMIN.email);
  }

  function getOwnerEmail() {
    if (typeof AdminCredentials !== "undefined") {
      return AdminCredentials.getCredentials().email;
    }
    return DEFAULT_ADMIN.email;
  }

  function ownerRole() {
    return typeof AdminCredentials !== "undefined"
      ? AdminCredentials.getCredentials().role
      : DEFAULT_ADMIN.role;
  }

  function isOwnerEmail(email) {
    if (isDefaultOwnerEmail(email)) return true;
    if (typeof AdminCredentials !== "undefined") {
      return AdminCredentials.isOwnerEmail(email);
    }
    return isDefaultOwnerEmail(email);
  }

  function isLoggedIn() {
    var s = getSession();
    if (!s || !s.email || !s.token) return false;
    if (s.ownerOnly && s.role === ownerRole()) return true;
    return isOwnerEmail(s.email);
  }

  function isOwnerAdmin() {
    var s = getSession();
    if (!s || !s.token) return false;
    if (s.ownerOnly && s.role === ownerRole()) return true;
    return isOwnerEmail(s.email) && s.role === ownerRole();
  }

  function verifyLoginPassword(password, email) {
    if (typeof AdminCredentials !== "undefined") {
      if (AdminCredentials.verifyPassword(password, email)) return true;
    }
    return password === DEFAULT_ADMIN.password;
  }

  function ensureOwnerSession(email) {
    var creds = typeof AdminCredentials !== "undefined"
      ? AdminCredentials.getCredentials()
      : DEFAULT_ADMIN;
    var sessionEmail = email || creds.email || DEFAULT_ADMIN.email;
    var existing = getSession();
    var session = {
      email: sessionEmail,
      name: creds.name || DEFAULT_ADMIN.name,
      role: creds.role || DEFAULT_ADMIN.role,
      token: existing && existing.token ? existing.token : "admin_" + Date.now(),
      loggedInAt: existing && existing.loggedInAt ? existing.loggedInAt : new Date().toISOString(),
      testMode: existing ? !!existing.testMode : false,
      ownerOnly: true
    };
    saveSession(session);
    return session;
  }

  function login(email, password) {
    var normalizedEmail = normalizeEmail(email);
    if (!isOwnerEmail(normalizedEmail)) {
      return { success: false, error: "Access denied. Admin panel is owner-only." };
    }
    if (!verifyLoginPassword(password, normalizedEmail)) {
      return { success: false, error: "Invalid credentials" };
    }
    var creds = typeof AdminCredentials !== "undefined"
      ? AdminCredentials.getCredentials()
      : DEFAULT_ADMIN;
    var session = {
      email: creds.email,
      name: creds.name || DEFAULT_ADMIN.name,
      role: creds.role || DEFAULT_ADMIN.role,
      token: "admin_" + Date.now(),
      loggedInAt: new Date().toISOString(),
      testMode: false,
      ownerOnly: true
    };
    saveSession(session);
    return { success: true, session: session };
  }

  function updateSessionEmail(email) {
    var s = getSession();
    if (!s) return false;
    s.email = String(email || "").trim();
    saveSession(s);
    return true;
  }

  function logout() {
    clearSession();
  }

  function isTestMode() {
    var s = getSession();
    return !!(s && s.testMode);
  }

  function setTestMode(enabled) {
    var s = getSession();
    if (!s) return false;
    s.testMode = !!enabled;
    saveSession(s);
    return true;
  }

  function getRole() {
    var s = getSession();
    return s ? s.role : null;
  }

  function hasPermission(permission) {
    var role = getRole();
    if (!role) return false;
    return AdminRBAC.hasPermission(role, permission);
  }

  return {
    DEFAULT_ADMIN: DEFAULT_ADMIN,
    getSession: getSession,
    saveSession: saveSession,
    clearSession: clearSession,
    isLoggedIn: isLoggedIn,
    login: login,
    logout: logout,
    isTestMode: isTestMode,
    setTestMode: setTestMode,
    getRole: getRole,
    hasPermission: hasPermission,
    isOwnerEmail: isOwnerEmail,
    isOwnerAdmin: isOwnerAdmin,
    updateSessionEmail: updateSessionEmail,
    getOwnerEmail: getOwnerEmail,
    ensureOwnerSession: ensureOwnerSession,
    isDefaultOwnerEmail: isDefaultOwnerEmail
  };
})();
