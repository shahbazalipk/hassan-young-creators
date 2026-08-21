/** Admin credentials UI — passwords are never stored or shown in the browser. */
var AdminCredentials = (function () {
  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function getCredentials() {
    var session = typeof AdminSession !== "undefined" ? AdminSession.getSession() : null;
    return {
      email: session && session.email ? session.email : "",
      password: "",
      name: session && session.name ? session.name : "Administrator",
      role: "ADMIN",
    };
  }

  function isOwnerEmail(email) {
    if (typeof AdminSession !== "undefined" && AdminSession.isOwnerEmail) {
      return AdminSession.isOwnerEmail(email);
    }
    return false;
  }

  function verifyPassword() {
    return false;
  }

  function renderLogin(container) {
    if (!container) return;
    container.innerHTML =
      '<p class="admin-credentials-safe">Admin access uses Hassan’s secure shared login. Passwords are never stored in this page.</p>' +
      '<p><a class="btn" href="/admin/login?next=' +
      encodeURIComponent("/admin") +
      '">Open secure admin login</a></p>' +
      '<p class="hint">KidMind’s old local admin password has been removed.</p>';
  }

  function renderDisplay(container) {
    if (!container) return;
    var creds = getCredentials();
    if (!creds.email) {
      container.innerHTML =
        '<p>Not signed in as administrator. <a href="/admin/login?next=/admin">Sign in</a></p>';
      return;
    }
    container.innerHTML =
      "<p><strong>Admin email:</strong> " +
      creds.email +
      "</p><p>Password is managed securely on the server and is never shown here.</p>";
  }

  return {
    getCredentials: getCredentials,
    isOwnerEmail: isOwnerEmail,
    verifyPassword: verifyPassword,
    renderLogin: renderLogin,
    renderDisplay: renderDisplay,
    normalizeEmail: normalizeEmail,
  };
})();
