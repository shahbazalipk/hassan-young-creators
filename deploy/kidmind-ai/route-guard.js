/** Route guards — separate Admin Panel from student app flows */
var RouteGuard = (function () {
  function getCurrentPath() {
    return window.location.pathname || "";
  }

  function currentFile() {
    var path = getCurrentPath().toLowerCase();
    var parts = path.split("/");
    return parts[parts.length - 1] || "";
  }

  function isAdminRoute() {
    var file = currentFile();
    if (file === "admin.html") return true;
    var path = getCurrentPath().toLowerCase();
    return /\/admin(\/|$)/.test(path);
  }

  function isStudentAppRoute() {
    if (isAdminRoute()) return false;
    var file = currentFile();
    return file === "" || file === "index.html";
  }

  function isAdminQuizTestEntry() {
    try {
      return new URLSearchParams(window.location.search).get("adminTest") === "1";
    } catch (e) {
      return false;
    }
  }

  function getAdminUser() {
    if (typeof AdminSession === "undefined") return null;
    if (!AdminSession.isLoggedIn()) return null;
    return AdminSession.getSession();
  }

  function isAdminUser() {
    if (typeof AdminSession === "undefined") return false;
    return AdminSession.isOwnerAdmin();
  }

  function adminDashboardUrl() {
    var path = getCurrentPath();
    var base = path.replace(/[^/]*$/, "");
    return base + "admin.html";
  }

  function logRouteGuard(reason, detail) {
    console.log("Current route:", getCurrentPath());
    console.log("User:", getAdminUser());
    console.log("Is admin:", isAdminUser());
    console.log("Redirect reason:", reason || "(none)");
    if (detail !== undefined) {
      console.log("Route guard detail:", detail);
    }
  }

  function shouldRedirectAdminFromStudentApp() {
    if (!isStudentAppRoute()) return false;
    if (isAdminQuizTestEntry()) return false;
    return isAdminUser();
  }

  function redirectToAdminDashboard(reason) {
    logRouteGuard(reason || "Redirecting admin to panel");
    window.location.replace(adminDashboardUrl());
  }

  function guardAdminRoute() {
    var guard = {
      isAdminRoute: isAdminRoute(),
      isAdmin: isAdminUser(),
      allowed: false,
      showDashboard: false,
      showLogin: false
    };
    if (!guard.isAdminRoute) {
      return guard;
    }
    guard.allowed = true;
    if (guard.isAdmin) {
      guard.showDashboard = true;
    } else {
      guard.showLogin = true;
    }
    return guard;
  }

  function guardStudentRoute() {
    if (!isStudentAppRoute()) {
      return { allowed: false, isStudentRoute: false };
    }
    if (shouldRedirectAdminFromStudentApp()) {
      return {
        allowed: false,
        isStudentRoute: true,
        redirectAdmin: true,
        reason: "Authenticated admin must use Admin Panel"
      };
    }
    return { allowed: true, isStudentRoute: true };
  }

  function runStudentAppAdminRedirect(reason) {
    if (!shouldRedirectAdminFromStudentApp()) return false;
    redirectToAdminDashboard(reason);
    return true;
  }

  return {
    getCurrentPath: getCurrentPath,
    isAdminRoute: isAdminRoute,
    isStudentAppRoute: isStudentAppRoute,
    isAdminQuizTestEntry: isAdminQuizTestEntry,
    isAdminUser: isAdminUser,
    getAdminUser: getAdminUser,
    adminDashboardUrl: adminDashboardUrl,
    logRouteGuard: logRouteGuard,
    shouldRedirectAdminFromStudentApp: shouldRedirectAdminFromStudentApp,
    redirectToAdminDashboard: redirectToAdminDashboard,
    guardAdminRoute: guardAdminRoute,
    guardStudentRoute: guardStudentRoute,
    runStudentAppAdminRedirect: runStudentAppAdminRedirect
  };
})();
