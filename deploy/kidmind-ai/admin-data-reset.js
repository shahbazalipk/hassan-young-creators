/** Admin panel — reset user data while preserving owner, courses & system config */
var AdminDataReset = (function () {
  var TEST_DATA_KEYS = [
    "reports",
    "quiz_progress",
    "saved_certificates",
    "session",
    "activity_logs",
    "notifications",
    "question_history"
  ];

  var PRESERVED_KEYS = [
    "admin_session",
    "admin_credentials",
    "theme",
    "accounts"
  ];

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function getOwnerEmails() {
    var emails = [];
    if (typeof AdminSession !== "undefined") {
      emails.push(AdminSession.DEFAULT_ADMIN.email);
      if (typeof AdminSession.getOwnerEmail === "function") {
        emails.push(AdminSession.getOwnerEmail());
      }
    }
    var seen = {};
    return emails.map(normalizeEmail).filter(function (e) {
      if (!e || seen[e]) return false;
      seen[e] = true;
      return true;
    });
  }

  function authorizeClearAllData() {
    if (typeof AdminSession === "undefined") {
      return { authorized: false, error: "Admin session unavailable." };
    }
    if (!AdminSession.isLoggedIn()) {
      return { authorized: false, error: "Not authenticated." };
    }
    var role = AdminSession.getRole();
    if (!role) {
      return { authorized: false, error: "No admin role assigned." };
    }
    if (typeof AdminRBAC !== "undefined") {
      var allowedRoles = [AdminRBAC.ROLES.SUPER_ADMIN, AdminRBAC.ROLES.ADMIN];
      if (allowedRoles.indexOf(role) === -1) {
        return { authorized: false, error: "Insufficient role for this action." };
      }
      if (!AdminSession.hasPermission(AdminRBAC.PERMISSIONS.CLEAR_ALL_DATA)) {
        return { authorized: false, error: "Clear all data permission denied." };
      }
    }
    if (!AdminSession.isOwnerAdmin()) {
      return { authorized: false, error: "Owner admin authorization required." };
    }
    return { authorized: true };
  }

  function clearReports() {
    var removed = 0;
    if (typeof Report !== "undefined" && Report.clearReports) {
      var before = Report.getReports().length;
      Report.clearReports();
      removed = before;
    } else {
      var reports = DataStore.get("reports", []);
      removed = reports.length;
      DataStore.set("reports", []);
    }
    return removed;
  }

  function clearStudentAccounts() {
    var ownerEmails = getOwnerEmails();
    var list = typeof AccountStore !== "undefined" ? AccountStore.getAccounts() : DataStore.get("accounts", []);
    var before = list.length;
    var kept = list.filter(function (account) {
      return ownerEmails.indexOf(normalizeEmail(account.email)) !== -1;
    });
    DataStore.set("accounts", kept);
    return before - kept.length;
  }

  function clearUserGeneratedData() {
    var summary = {
      reportsRemoved: 0,
      accountsRemoved: 0,
      keysCleared: []
    };

    summary.reportsRemoved = clearReports();

    if (typeof QuizProgressStore !== "undefined" && QuizProgressStore.clearProgress) {
      QuizProgressStore.clearProgress();
    } else {
      DataStore.remove("quiz_progress");
    }
    summary.keysCleared.push("quiz_progress");

    if (typeof CertificateSave !== "undefined" && CertificateSave.getSavedCertificates) {
      var certs = CertificateSave.getSavedCertificates().length;
      DataStore.set("saved_certificates", []);
      summary.keysCleared.push("saved_certificates (" + certs + ")");
    } else {
      DataStore.remove("saved_certificates");
      summary.keysCleared.push("saved_certificates");
    }

    if (typeof QuizSession !== "undefined" && QuizSession.clearSession) {
      QuizSession.clearSession();
    } else {
      DataStore.remove("session");
    }
    summary.keysCleared.push("session");

    DataStore.set("activity_logs", []);
    DataStore.set("notifications", []);
    DataStore.remove("question_history");
    summary.keysCleared.push("activity_logs", "notifications", "question_history");

    summary.accountsRemoved = clearStudentAccounts();

    return summary;
  }

  function clearAllUserData() {
    var auth = authorizeClearAllData();
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized." };
    }
    var summary = clearUserGeneratedData();
    return { success: true, summary: summary };
  }

  function resetTestData() {
    var auth = authorizeClearAllData();
    if (!auth.authorized) {
      return { success: false, error: auth.error || "Unauthorized." };
    }
    return { success: true, summary: clearUserGeneratedData() };
  }

  function getConfirmationMessage() {
    return "This will permanently delete all test quiz attempts, progress, certificates, reports, and student accounts.\n\n" +
      "Your admin account, courses, questions, branding, and settings will NOT be deleted.\n\n" +
      "Continue?";
  }

  return {
    authorizeClearAllData: authorizeClearAllData,
    clearAllUserData: clearAllUserData,
    resetTestData: resetTestData,
    getConfirmationMessage: getConfirmationMessage,
    getOwnerEmails: getOwnerEmails,
    TEST_DATA_KEYS: TEST_DATA_KEYS,
    PRESERVED_KEYS: PRESERVED_KEYS
  };
})();
