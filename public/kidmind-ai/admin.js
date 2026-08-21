/** KidMind AI Admin panel logic */
(function () {
  "use strict";

  var loginSection = document.getElementById("admin-login");
  var dashboardSection = document.getElementById("admin-dashboard");
  var loginForm = document.getElementById("admin-login-form");
  var loginError = document.getElementById("admin-login-error");
  var exitBtn = document.getElementById("admin-exit-btn");
  var testModeCheckbox = document.getElementById("test-mode-checkbox");
  var adminUserName = document.getElementById("admin-user-name");

  function escapeHtml(str) {
    if (typeof Security !== "undefined") return Security.escapeHtml(str);
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function guardAdminAccess() {
    if (typeof AdminSession === "undefined" || !AdminSession.isOwnerAdmin()) {
      return false;
    }
    if (typeof AdminRBAC !== "undefined" && !AdminSession.hasPermission(AdminRBAC.PERMISSIONS.VIEW_DASHBOARD)) {
      return false;
    }
    return true;
  }

  function showLogin() {
    loginSection.classList.add("active");
    dashboardSection.classList.remove("active");
    renderAdminCredentials(document.getElementById("admin-login-credentials"));
  }

  function showDashboard() {
    if (!guardAdminAccess()) {
      showLogin();
      if (loginError) {
        loginError.textContent = "Access denied. Please sign in as admin.";
        loginError.hidden = false;
      }
      return;
    }
    loginSection.classList.remove("active");
    dashboardSection.classList.add("active");
    refreshOverview();
    renderQuestions();
    renderReports();
    renderProgressList();
    renderHistoryList();
    renderCertificatesList();
    renderCoursesList();
    updateTestModeUI();
    updateClearAllDataButton();
    renderAdminCredentials(document.getElementById("admin-credentials-display"));
  }

  function updateClearAllDataButton() {
    var btn = document.getElementById("clear-all-data-btn");
    if (!btn || typeof AdminDataReset === "undefined") return;
    var auth = AdminDataReset.authorizeClearAllData();
    btn.classList.toggle("hidden", !auth.authorized);
  }

  function showClearAllModal() {
    var modal = document.getElementById("clear-all-data-modal");
    if (modal) modal.classList.remove("hidden");
  }

  function hideClearAllModal() {
    var modal = document.getElementById("clear-all-data-modal");
    if (modal) modal.classList.add("hidden");
  }

  function showClearAllSuccess(text) {
    var el = document.getElementById("clear-all-success-message");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("hidden", !text);
  }

  function refreshAllPanels() {
    refreshOverview();
    renderProgressList();
    renderHistoryList();
    renderCertificatesList();
    renderReports();
    renderCoursesList();
  }

  function showResetMessage(text, isError) {
    var el = document.getElementById("reset-test-data-message");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("hidden", !text);
    el.classList.toggle("admin-reset-message--error", !!isError);
    el.classList.toggle("admin-reset-message--success", !isError && !!text);
  }

  function showError(msg) {
    if (loginError) {
      loginError.textContent = msg;
      loginError.hidden = !msg;
    }
  }

  function switchPanel(panelId) {
    document.querySelectorAll(".admin-panel").forEach(function (p) {
      p.classList.remove("active");
    });
    document.querySelectorAll(".nav-item").forEach(function (n) {
      n.classList.toggle("active", n.dataset.panel === panelId);
    });
    var panel = document.getElementById("panel-" + panelId);
    if (panel) panel.classList.add("active");

    var titles = {
      overview: "Dashboard Overview",
      progress: "Student Progress",
      history: "Quiz History",
      certificates: "Certificate Records",
      courses: "Course Management",
      questions: "Question Management",
      reports: "Reports & Exports",
      settings: "Settings"
    };
    var titleEl = document.getElementById("panel-title");
    if (titleEl) titleEl.textContent = titles[panelId] || panelId;

    if (panelId === "progress") renderProgressList();
    if (panelId === "history") renderHistoryList();
    if (panelId === "certificates") renderCertificatesList();
    if (panelId === "courses") renderCoursesList();
    if (panelId === "questions") renderQuestions();
    if (panelId === "reports") renderReports();
    if (panelId === "overview") refreshOverview();
  }

  function renderReportRows(list, reports, emptyMsg, rowBuilder) {
    if (!list) return;
    list.innerHTML = "";
    if (!reports.length) {
      list.innerHTML = '<p class="empty-state">' + emptyMsg + '</p>';
      return;
    }
    reports.forEach(function (r) {
      var item = document.createElement("div");
      item.className = "report-item";
      item.innerHTML = rowBuilder(r);
      list.appendChild(item);
    });
  }

  function renderProgressList() {
    var reports = Report.getReports();
    var byStudent = {};
    reports.forEach(function (r) {
      var name = r.studentName || "Unknown";
      if (!byStudent[name]) {
        byStudent[name] = { name: name, attempts: 0, best: 0, certs: 0, lastDate: r.completedAt };
      }
      byStudent[name].attempts++;
      var s = r.score || {};
      var pct = s.percentage || 0;
      if (pct > byStudent[name].best) byStudent[name].best = pct;
      if (s.certificateEligible) byStudent[name].certs++;
      if (new Date(r.completedAt) > new Date(byStudent[name].lastDate)) {
        byStudent[name].lastDate = r.completedAt;
      }
    });
    var rows = Object.keys(byStudent).map(function (k) { return byStudent[k]; });
    renderReportRows(
      document.getElementById("progress-list"),
      rows,
      "No student progress yet.",
      function (r) {
        return '<strong>' + escapeHtml(r.name) + '</strong>' +
          '<span>' + r.attempts + ' attempt(s)</span>' +
          '<span>Best: ' + r.best + '%</span>' +
          '<span>' + r.certs + ' cert(s)</span>' +
          '<span class="report-date">Last: ' + Report.formatDate(r.lastDate) + '</span>';
      }
    );
  }

  function renderHistoryList() {
    var reports = Report.getReports().slice().sort(function (a, b) {
      return new Date(b.completedAt) - new Date(a.completedAt);
    });
    renderReportRows(
      document.getElementById("history-list"),
      reports,
      "No quiz history yet.",
      function (r) {
        var s = r.score || {};
        return '<strong>' + escapeHtml(r.studentName || "Unknown") + '</strong>' +
          '<span>' + (s.correct || 0) + '/' + (s.total || 0) + ' (' + (s.percentage || 0) + '%)</span>' +
          '<span class="report-date">' + Report.formatDate(r.completedAt) + '</span>' +
          (s.certificateEligible ? '<span class="badge-pass">Passed</span>' : '<span class="badge-fail">Failed</span>');
      }
    );
  }

  function renderCertificatesList() {
    var reports = Report.getReports().filter(function (r) {
      return r.score && r.score.certificateEligible;
    });
    renderReportRows(
      document.getElementById("certificates-admin-list"),
      reports,
      "No certificates issued yet.",
      function (r) {
        var s = r.score || {};
        return '<strong>' + escapeHtml(r.studentName || "Unknown") + '</strong>' +
          '<span>' + (s.correct || 0) + '/' + (s.total || 0) + '</span>' +
          '<span class="report-date">' + Report.formatDate(r.completedAt) + '</span>' +
          '<span class="badge-pass">' + escapeHtml(r.certificateId || "CERT") + '</span>';
      }
    );
  }

  function renderCoursesList() {
    var list = document.getElementById("courses-list");
    if (!list) return;
    var courseName = typeof Brand !== "undefined" ? Brand.courseName : "KidMind AI Learning";
    var quizName = typeof Brand !== "undefined" ? Brand.quizName : "KidMind AI Quiz";
    var qCount = typeof QUESTION_BANK !== "undefined" ? QUESTION_BANK.length : 0;
    list.innerHTML =
      '<div class="report-item">' +
        '<strong>' + escapeHtml(courseName) + '</strong>' +
        '<span>Quiz: ' + escapeHtml(quizName) + '</span>' +
        '<span>' + qCount + ' questions in bank</span>' +
        '<span class="badge-pass">Active</span>' +
      '</div>';
  }

  function refreshOverview() {
    var stats = typeof Analytics !== "undefined" ? Analytics.getDashboardStats() : {};
    var activity = typeof Analytics !== "undefined" ? Analytics.getActivityStats() : {};

    var map = {
      "stat-students": stats.totalStudents,
      "stat-courses": stats.totalCourses,
      "stat-quizzes": stats.totalQuizzes,
      "stat-attempts": stats.totalAttempts,
      "stat-passed": stats.passedStudents,
      "stat-failed": stats.failedStudents,
      "stat-certificates": stats.certificatesIssued,
      "stat-questions": stats.totalQuestions,
      "stat-daily": activity.daily,
      "stat-weekly": activity.weekly,
      "stat-monthly": activity.monthly
    };

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = String(map[id] != null ? map[id] : 0);
    });
  }

  function renderQuestions() {
    var list = document.getElementById("questions-list");
    var bank = typeof QuestionBank !== "undefined" ? QuestionBank.getAll() : QUESTION_BANK;
    if (!list || !bank) return;

    var searchInput = document.getElementById("question-search");
    var query = searchInput ? searchInput.value.toLowerCase() : "";

    list.innerHTML = "";
    bank.filter(function (q) {
      if (!query) return true;
      var hay = [
        q.question,
        q.category,
        q.subject,
        q.topic,
        q.difficulty,
        q.id
      ].join(" ").toLowerCase();
      return hay.indexOf(query) !== -1;
    }).slice(0, 100).forEach(function (q, i) {
      var item = document.createElement("div");
      item.className = "question-item";
      var meta = (q.subject || q.category) + " · " + (q.topic || "") +
        " · " + (q.difficulty || "") + " · Age " + q.ageMin + "–" + q.ageMax;
      item.innerHTML =
        '<span class="q-num">' + (i + 1) + '</span>' +
        '<div class="q-body">' +
          '<p class="q-text">' + escapeHtml(q.question) + '</p>' +
          '<span class="q-meta">' + escapeHtml(meta) + '</span>' +
        '</div>';
      list.appendChild(item);
    });
  }

  function renderReports() {
    var list = document.getElementById("reports-list");
    if (!list) return;

    var reports = Report.getReports();
    list.innerHTML = "";

    if (!reports.length) {
      list.innerHTML = '<p class="empty-state">No quiz reports yet.</p>';
      return;
    }

    reports.forEach(function (r) {
      var item = document.createElement("div");
      item.className = "report-item";
      var score = r.score || {};
      item.innerHTML =
        '<strong>' + escapeHtml(r.studentName || "Unknown") + '</strong>' +
        '<span>' + (score.correct || 0) + '/' + (score.total || 0) + '</span>' +
        '<span class="report-date">' + Report.formatDate(r.completedAt) + '</span>' +
        (score.certificateEligible ? '<span class="badge-pass">Certified</span>' : '<span class="badge-fail">No cert</span>');
      list.appendChild(item);
    });
  }

  function updateTestModeUI() {
    var session = AdminSession.getSession();
    if (adminUserName && session) adminUserName.textContent = session.name || session.email;
    if (testModeCheckbox) testModeCheckbox.checked = AdminSession.isTestMode();
  }

  function renderAdminCredentials(el) {
    if (!el) return;
    if (typeof AdminCredentials !== "undefined" && AdminCredentials.renderDisplay) {
      AdminCredentials.renderDisplay(el);
      return;
    }
    el.innerHTML =
      '<p>Admin passwords are never shown in the browser.</p>' +
      '<p><a href="/admin/login?next=/admin">Open secure Hassan admin login</a></p>';
  }

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      window.location.href = "/admin/login?next=" + encodeURIComponent("/admin");
    });
  }

  if (exitBtn) {
    exitBtn.addEventListener("click", function () {
      if (!guardAdminAccess()) return;
      AdminSession.setTestMode(true);
      window.location.href = "index.html?adminTest=1";
    });
  }

  if (testModeCheckbox) {
    testModeCheckbox.addEventListener("change", function () {
      if (AdminSession.hasPermission(AdminRBAC.PERMISSIONS.TEST_MODE)) {
        AdminSession.setTestMode(testModeCheckbox.checked);
      } else {
        testModeCheckbox.checked = false;
      }
    });
  }

  document.querySelectorAll(".nav-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!guardAdminAccess()) return;
      switchPanel(btn.dataset.panel);
    });
  });

  var searchInput = document.getElementById("question-search");
  if (searchInput) searchInput.addEventListener("input", renderQuestions);

  var exportStudentBtn = document.getElementById("export-student-btn");
  if (exportStudentBtn) exportStudentBtn.addEventListener("click", function () {
    if (typeof Analytics !== "undefined") Analytics.exportStudentReport();
  });

  var exportQuizBtn = document.getElementById("export-quiz-btn");
  if (exportQuizBtn) exportQuizBtn.addEventListener("click", function () {
    if (typeof Analytics !== "undefined") Analytics.exportQuizReport();
  });

  var exportCourseBtn = document.getElementById("export-course-btn");
  if (exportCourseBtn) exportCourseBtn.addEventListener("click", function () {
    if (typeof Analytics !== "undefined") Analytics.exportCourseReport();
  });

  var exportCertBtn = document.getElementById("export-cert-btn");
  if (exportCertBtn) exportCertBtn.addEventListener("click", function () {
    if (typeof Analytics !== "undefined") Analytics.exportCertificateReport();
  });

  if (exportCertBtn) exportCertBtn.addEventListener("click", function () {
    if (typeof Analytics !== "undefined") Analytics.exportCertificateReport();
  });

  var ownerOpenQuizBtn = document.getElementById("owner-open-quiz-btn");
  if (ownerOpenQuizBtn) {
    ownerOpenQuizBtn.addEventListener("click", function () {
      if (!guardAdminAccess()) return;
      AdminSession.setTestMode(true);
      window.location.href = "index.html?adminTest=1";
    });
  }

  var ownerRefreshBtn = document.getElementById("owner-refresh-stats-btn");
  if (ownerRefreshBtn) {
    ownerRefreshBtn.addEventListener("click", function () {
      if (!guardAdminAccess()) return;
      refreshAllPanels();
    });
  }

  var resetTestDataBtn = document.getElementById("reset-test-data-btn");
  if (resetTestDataBtn) {
    resetTestDataBtn.addEventListener("click", function () {
      if (!guardAdminAccess()) return;
      if (typeof AdminDataReset === "undefined") {
        showResetMessage("Reset module not available.", true);
        return;
      }
      if (!AdminDataReset.authorizeClearAllData().authorized) {
        showResetMessage("You do not have permission to reset data.", true);
        return;
      }
      if (!window.confirm(AdminDataReset.getConfirmationMessage())) return;

      var result = AdminDataReset.resetTestData();
      if (!result.success) {
        showResetMessage(result.error || "Could not reset test data.", true);
        return;
      }

      var s = result.summary;
      showResetMessage(
        "Test data reset complete. Removed " + s.reportsRemoved + " quiz records and " +
        s.accountsRemoved + " test student account(s). Dashboard refreshed.",
        false
      );
      refreshAllPanels();
      switchPanel("overview");
    });
  }

  var clearAllDataBtn = document.getElementById("clear-all-data-btn");
  if (clearAllDataBtn) {
    clearAllDataBtn.addEventListener("click", function () {
      if (!guardAdminAccess()) return;
      if (typeof AdminDataReset === "undefined") return;
      if (!AdminDataReset.authorizeClearAllData().authorized) return;
      showClearAllSuccess("");
      showClearAllModal();
    });
  }

  var clearAllCancelBtn = document.getElementById("clear-all-cancel-btn");
  if (clearAllCancelBtn) {
    clearAllCancelBtn.addEventListener("click", hideClearAllModal);
  }

  var clearAllBackdrop = document.getElementById("clear-all-modal-backdrop");
  if (clearAllBackdrop) {
    clearAllBackdrop.addEventListener("click", hideClearAllModal);
  }

  var clearAllConfirmBtn = document.getElementById("clear-all-confirm-btn");
  if (clearAllConfirmBtn) {
    clearAllConfirmBtn.addEventListener("click", function () {
      if (typeof AdminDataReset === "undefined") return;
      var result = AdminDataReset.clearAllUserData();
      hideClearAllModal();
      if (!result.success) {
        showClearAllSuccess(result.error || "Could not clear data.");
        return;
      }
      showClearAllSuccess("All user data has been cleared successfully.");
      refreshAllPanels();
      switchPanel("overview");
    });
  }

  async function bootAdminUi() {
    if (typeof AdminSession !== "undefined" && AdminSession.refreshFromServer) {
      await AdminSession.refreshFromServer();
    }
    if (AdminSession.isOwnerAdmin()) {
      if (typeof RouteGuard !== "undefined") {
        RouteGuard.logRouteGuard("Admin panel init — restoring dashboard");
      }
      showDashboard();
    } else {
      if (typeof RouteGuard !== "undefined") {
        RouteGuard.logRouteGuard("Admin panel init — show login");
      }
      showLogin();
    }
  }
  bootAdminUi();
})();
