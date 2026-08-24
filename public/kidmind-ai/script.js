/** KidMind AI — main application logic */
(function () {
  "use strict";

  /* CRITICAL: declare themeToggleBtn BEFORE applyTheme() is called */
  var themeToggleBtn = document.getElementById("theme-toggle-btn");

  var currentLanguage = "en";
  var pendingStudent = { name: "", age: null, questionCount: 10 };
  var currentStep = "splash";
  var questionCountModalCallback = null;

  var VALID_STEPS = ["splash", "language", "student", "signin", "login", "parent", "dashboard", "quiz", "result", "profile", "settings", "progress", "certificates"];

  var STEP_TO_SCREEN = {
    splash: "splash-screen",
    language: "language-screen",
    student: "student-screen",
    signin: "sign-in-screen",
    login: "login-screen",
    parent: "sign-in-screen",
    dashboard: "dashboard-screen",
    quiz: "quiz-screen",
    result: "result-screen",
    profile: "profile-screen",
    settings: "settings-screen",
    progress: "progress-screen",
    certificates: "certificates-screen"
  };

  var LOGGED_IN_STEPS = ["dashboard", "quiz", "result", "profile", "settings", "progress", "certificates"];

  /* Profile / topbar DOM */
  var appTopbar = document.getElementById("app-topbar");
  var profileBtn = document.getElementById("profile-btn");
  var profileDropdown = document.getElementById("profile-dropdown");
  var profileBtnLabel = document.getElementById("profile-btn-label");
  var profileAvatarInitials = document.getElementById("profile-avatar-initials");
  var profileDropdownName = document.getElementById("profile-dropdown-name");
  var menuAdminPanel = document.getElementById("menu-admin-panel");

  var screens = {
    splash: document.getElementById("splash-screen"),
    language: document.getElementById("language-screen"),
    student: document.getElementById("student-screen"),
    parent: document.getElementById("sign-in-screen"),
    dashboard: document.getElementById("dashboard-screen"),
    quiz: document.getElementById("quiz-screen"),
    result: document.getElementById("result-screen")
  };

  var i18n = {
    en: {
      selectLanguage: "Select Language",
      studentDetails: "Student Details",
      parentLogin: "Parent Login / Sign In",
      signInTitle: "Sign In",
      loginTitle: "Log In",
      logIn: "Log In",
      studentName: "Student Name",
      studentAge: "Age",
      parentEmail: "Parent Email",
      parentPassword: "Password",
      next: "Next",
      signIn: "Sign In",
      dashboard: "Dashboard",
      startQuiz: "Start Quiz",
      resumeQuiz: "Resume Quiz",
      logout: "Log Out",
      welcome: "Welcome",
      question: "Question",
      submit: "Submit Answer",
      finish: "Finish Quiz",
      backToDashboard: "Back to Dashboard",
      viewCertificate: "View Certificate",
      tryAgain: "Try Again",
      startAgain: "Start Again"
    },
    ur: {
      selectLanguage: "زبان منتخب کریں",
      studentDetails: "طالب علم کی تفصیلات",
      parentLogin: "والدین لاگ ان",
      studentName: "طالب علم کا نام",
      studentAge: "عمر",
      parentEmail: "والدین کا ای میل",
      parentPassword: "پاس ورڈ",
      next: "اگلا",
      signIn: "سائن ان",
      dashboard: "ڈیش بورڈ",
      startQuiz: "کوئز شروع کریں",
      resumeQuiz: "کوئز جاری رکھیں",
      logout: "لاگ آؤٹ",
      welcome: "خوش آمدید",
      question: "سوال",
      submit: "جواب جمع کریں",
      finish: "کوئز ختم کریں",
      backToDashboard: "ڈیش بورڈ پر واپس",
      viewCertificate: "سرٹیفکیٹ دیکھیں",
      tryAgain: "دوبارہ کوشش کریں"
    },
    ar: {
      selectLanguage: "اختر اللغة",
      studentDetails: "بيانات الطالب",
      parentLogin: "تسجيل دخول ولي الأمر",
      studentName: "اسم الطالب",
      studentAge: "العمر",
      parentEmail: "البريد الإلكتروني",
      parentPassword: "كلمة المرور",
      next: "التالي",
      signIn: "تسجيل الدخول",
      dashboard: "لوحة التحكم",
      startQuiz: "بدء الاختبار",
      resumeQuiz: "متابعة الاختبار",
      logout: "تسجيل الخروج",
      welcome: "مرحباً",
      question: "سؤال",
      submit: "إرسال الإجابة",
      finish: "إنهاء الاختبار",
      backToDashboard: "العودة للوحة",
      viewCertificate: "عرض الشهادة",
      tryAgain: "حاول مرة أخرى"
    }
  };

  function t(key) {
    var lang = i18n[currentLanguage] || i18n.en;
    return lang[key] || i18n.en[key] || key;
  }

  function applyTheme() {
    var theme = DataStore.get("theme", "light");
    document.documentElement.setAttribute("data-theme", theme);
    if (themeToggleBtn) {
      themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
      themeToggleBtn.setAttribute("aria-label", theme === "dark" ? "Light mode" : "Dark mode");
    }
  }

  function displayName(name) {
    return typeof Security !== "undefined" ? Security.sanitizeName(name) : (name || "");
  }

  function isAdminQuizMode() {
    return typeof AuthGuard !== "undefined" && AuthGuard.isAdminQuizMode();
  }

  function shouldShowAdminQuizControls() {
    return typeof AuthGuard !== "undefined" && AuthGuard.shouldShowAdminQuizControls();
  }

  function ensureAdminTestModeFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("adminTest") === "1" && typeof AdminSession !== "undefined" && AdminSession.isOwnerAdmin()) {
        AdminSession.setTestMode(true);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function initAdminTestFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("adminTest") !== "1" || typeof AdminSession === "undefined") return;
      var session = AdminSession.getSession();
      if (session && session.token) {
        AdminSession.setTestMode(true);
      }
    } catch (e) {
      /* ignore */
    }
  }

  function openQuestionCountModal(callback, defaultCount) {
    var modal = document.getElementById("question-count-modal");
    var select = document.getElementById("question-count-modal-select");
    if (!modal || !select) {
      if (callback) callback(defaultCount || 10);
      return;
    }
    var preset = defaultCount;
    if (preset == null && typeof Security !== "undefined" && Security.requireQuestionCount) {
      preset = Security.requireQuestionCount(QuizSession.getQuestionCount());
    }
    if (preset == null) preset = 10;
    select.value = String(preset);
    questionCountModalCallback = callback;
    modal.classList.remove("hidden");
  }

  function closeQuestionCountModal() {
    var modal = document.getElementById("question-count-modal");
    if (modal) modal.classList.add("hidden");
    questionCountModalCallback = null;
  }

  function isAdminEmail(email) {
    if (!email || typeof AdminSession === "undefined") return false;
    return AdminSession.isOwnerAdmin() && AdminSession.isOwnerEmail(email);
  }

  /** Escalation removed — admin role is server-assigned only. */
  function ensureOwnerAdminSession() {
    return;
  }

  function hasPersistedSession() {
    if (!QuizSession.isLoggedIn()) return false;
    var s = QuizSession.getSession();
    if (!s || !s.studentName || !s.parentEmail) return false;
    if (typeof Security !== "undefined" && !Security.isValidEmail(s.parentEmail)) return false;
    return true;
  }

  function recoverSessionFromProgress() {
    if (hasPersistedSession()) return true;
    if (typeof QuizProgressStore === "undefined") return false;
    var progress = QuizProgressStore.getProgress();
    if (!progress || !progress.studentName || !progress.parentEmail) return false;
    if (typeof Security !== "undefined" && !Security.isValidEmail(progress.parentEmail)) return false;
    QuizSession.createSession(
      progress.studentName,
      progress.age,
      progress.parentEmail,
      progress.language || "en",
      progress.questionCount || (progress.questions ? progress.questions.length : 10)
    );
    return true;
  }

  function hydrateFromStoredSession() {
    if (!recoverSessionFromProgress()) return false;
    if (typeof QuizSession.migrateLegacySession === "function") {
      QuizSession.migrateLegacySession();
    }
    if (typeof QuizSession.syncSessionAge === "function") {
      QuizSession.syncSessionAge();
    }
    var s = QuizSession.getSession();
    currentLanguage = s.language || currentLanguage || "en";
    pendingStudent = {
      name: displayName(s.studentName),
      age: QuizSession.getAge(),
      questionCount: s.questionCount || 10
    };
    ensureOwnerAdminSession();
    return true;
  }

  function canRestoreAppState() {
    if (typeof RouteGuard !== "undefined" && RouteGuard.shouldRedirectAdminFromStudentApp()) {
      return false;
    }
    if (typeof QuizProgressStore !== "undefined") {
      if (QuizProgressStore.hasActiveQuiz()) return true;
      if (QuizProgressStore.isComplete()) {
        var progress = QuizProgressStore.getProgress();
        if (progress && progress.studentName && progress.parentEmail) {
          if (typeof Security === "undefined" || Security.isValidEmail(progress.parentEmail)) {
            return true;
          }
        }
      }
    }
    if (hasPersistedSession()) return true;
    var storedProgress = typeof QuizProgressStore !== "undefined" ? QuizProgressStore.getProgress() : null;
    if (storedProgress && storedProgress.studentName && storedProgress.parentEmail) {
      return typeof Security === "undefined" || Security.isValidEmail(storedProgress.parentEmail);
    }
    return false;
  }

  function restoreAppState() {
    try {
      var hydrated = hydrateFromStoredSession();

      if (typeof QuizProgressStore !== "undefined") {
        if (QuizProgressStore.isComplete()) {
          if (hydrated) {
            finishQuiz();
            return true;
          }
        }
        if (QuizProgressStore.hasActiveQuiz()) {
          showQuizScreen();
          return true;
        }
      }

      if (hydrated || hasPersistedSession()) {
        showDashboardScreen();
        return true;
      }
    } catch (e) {
      console.error("restoreAppState failed:", e);
    }
    return false;
  }

  function updateTopbar() {
    var loggedIn = QuizSession.isLoggedIn();
    var showBar = loggedIn && LOGGED_IN_STEPS.indexOf(currentStep) !== -1;

    if (appTopbar) {
      appTopbar.classList.toggle("hidden", !showBar);
    }
    document.body.classList.toggle("has-topbar", showBar);

    if (!loggedIn) {
      closeProfileDropdown();
      return;
    }

    ensureOwnerAdminSession();

    var name = displayName(QuizSession.getStudentName());
    if (profileBtnLabel) profileBtnLabel.textContent = name || "My Account";
    if (profileDropdownName) profileDropdownName.textContent = name;
    if (profileAvatarInitials) {
      profileAvatarInitials.textContent = name ? name.charAt(0).toUpperCase() : "👤";
    }
    if (menuAdminPanel) {
      var showAdmin = typeof AuthGuard !== "undefined"
        ? AuthGuard.canAccessAdmin()
        : (typeof AdminSession !== "undefined" && AdminSession.isOwnerAdmin());
      menuAdminPanel.classList.toggle("hidden", !showAdmin);
    }
  }

  function closeProfileDropdown() {
    if (profileDropdown) profileDropdown.classList.add("hidden");
    if (profileBtn) profileBtn.setAttribute("aria-expanded", "false");
  }

  function toggleProfileDropdown() {
    if (!profileDropdown || !profileBtn) return;
    var open = profileDropdown.classList.contains("hidden");
    profileDropdown.classList.toggle("hidden", !open);
    profileBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function handleLogout() {
    QuizSession.clearSession();
    QuizProgressStore.clearProgress();
    if (typeof AdminSession !== "undefined") AdminSession.logout();
    pendingStudent = { name: "", age: null, questionCount: 10 };
    closeProfileDropdown();
    showLoginScreen();
  }

  function completeStudentAuth(email, password, profile, startQuizAfter) {
    var ageMeta = {
      originalAge: profile.originalAge != null ? profile.originalAge : profile.age,
      ageRecordedAt: profile.ageRecordedAt || new Date().toISOString()
    };
    var saveProfile = Object.assign({}, profile, ageMeta);
    if (typeof AccountStore !== "undefined") {
      AccountStore.saveAccount(email, password, saveProfile);
    }
    QuizSession.createSession(
      profile.studentName,
      profile.age,
      email,
      profile.language || currentLanguage,
      profile.questionCount || 10,
      ageMeta
    );
    AppFallback.hideError();
    updateTopbar();
    if (startQuizAfter) {
      startNewQuizWithCount(profile.questionCount || 10);
    } else {
      showDashboardScreen();
    }
  }

  function tryAdminLogin(email, password, startQuizAfter) {
    // Never compare admin passwords in the browser. Admins use /admin/login.
    void password;
    void startQuizAfter;
    if (typeof AdminSession !== "undefined" && AdminSession.isOwnerAdmin()) {
      window.location.href = "/admin";
      return true;
    }
    return false;
  }

  function applySharedUserSession(user, profile, startQuizAfter) {
    var studentName = (profile && profile.studentName) || user.displayName || "Student";
    var age = (profile && profile.age) || pendingStudent.age || 10;
    var language = (profile && profile.language) || currentLanguage;
    var questionCount = (profile && profile.questionCount) || pendingStudent.questionCount || 10;
    QuizSession.createSession(studentName, age, user.email, language, questionCount, {
      originalAge: age,
      ageRecordedAt: new Date().toISOString(),
      sharedUid: user.uid
    });
    AppFallback.hideError();
    updateTopbar();
    renderSharedAuthBar(user);
    if (startQuizAfter) {
      startNewQuizWithCount(questionCount);
    } else {
      showDashboardScreen();
    }
  }

  function renderSharedAuthBar(user) {
    var bar = document.getElementById("shared-auth-bar");
    if (!bar) return;
    bar.hidden = false;
    if (user) {
      bar.innerHTML =
        '<span>Signed in as <strong>' +
        (user.displayName || user.email) +
        "</strong></span> " +
        '<button type="button" id="btn-shared-logout" class="btn-ghost">Sign out (all sites)</button>';
      var btn = document.getElementById("btn-shared-logout");
      if (btn) {
        btn.addEventListener("click", function () {
          if (typeof HassanSharedAuth !== "undefined") {
            HassanSharedAuth.logout().then(function () {
              QuizSession.clearSession();
              window.location.href = "/kidmind-ai";
            });
          }
        });
      }
    } else {
      bar.innerHTML =
        '<a class="btn-ghost" href="/login?next=' +
        encodeURIComponent("/kidmind-ai") +
        '">Shared sign in</a> ' +
        '<a class="btn-ghost" href="/register?next=' +
        encodeURIComponent("/kidmind-ai") +
        '">Create account</a>';
    }
  }

  async function sharedRegisterOrLogin(email, password) {
    if (typeof HassanSharedAuth === "undefined") return null;
    var boot = await HassanSharedAuth.getSession();
    var csrf = boot.csrfToken;
    var reg = await HassanSharedAuth.register({
      email: email,
      password: password,
      displayName: pendingStudent.name || email.split("@")[0],
      csrfToken: csrf,
      next: "/kidmind-ai"
    });
    if (reg && reg.ok && reg.user) return reg;

    // Refresh CSRF, then try login (covers “email already registered”).
    boot = await HassanSharedAuth.getSession();
    var login = await HassanSharedAuth.login(
      email,
      password,
      boot.csrfToken || csrf,
      "/kidmind-ai"
    );
    if (login && login.ok && login.user) return login;

    // Prefer the clearer “already registered / sign in” message when useful.
    if (reg && reg.alreadyRegistered) return reg;
    return login || reg;
  }

  async function handleSignInSubmit(email, password) {
    if (tryAdminLogin(email, password, true)) return;

    var profile = {
      studentName: pendingStudent.name,
      age: pendingStudent.age,
      language: currentLanguage,
      questionCount: pendingStudent.questionCount || 10
    };

    if (!profile.studentName || !Security.isValidAge(profile.age)) {
      AppFallback.showError("Please complete Student Details first.");
      showStudentScreen();
      return;
    }

    if (!password || String(password).length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      AppFallback.showError(
        "Password must be at least 10 characters and include at least one letter and one number."
      );
      return;
    }

    try {
      var shared = await sharedRegisterOrLogin(email, password);
      if (shared && shared.ok && shared.user) {
        if (shared.user.isAdmin) {
          window.location.href = "/admin";
          return;
        }
        applySharedUserSession(shared.user, profile, true);
        return;
      }
      if (shared && shared.error) {
        AppFallback.showError(shared.error);
        return;
      }
      AppFallback.showError("Unable to sign in. Please check your email and password, then try again.");
      return;
    } catch (err) {
      AppFallback.showError("Unable to sign in right now. Please refresh the page and try again.");
      return;
    }
  }

  async function handleLoginSubmit(email, password) {
    if (tryAdminLogin(email, password, false)) return;

    try {
      if (typeof HassanSharedAuth !== "undefined") {
        var boot = await HassanSharedAuth.getSession();
        var shared = await HassanSharedAuth.login(email, password, boot.csrfToken, "/kidmind-ai");
        if (shared && shared.ok && shared.user) {
          if (shared.user.isAdmin) {
            window.location.href = "/admin";
            return;
          }
          applySharedUserSession(shared.user, {
            studentName: shared.user.displayName,
            age: pendingStudent.age || 10,
            language: currentLanguage,
            questionCount: 10
          }, false);
          return;
        }
        if (shared && shared.error) {
          AppFallback.showError(shared.error);
          return;
        }
        AppFallback.showError("Unable to sign in. Please check your email and password.");
        return;
      }
    } catch (err) {
      AppFallback.showError("Unable to sign in right now. Please refresh the page and try again.");
      return;
    }

    var account = typeof AccountStore !== "undefined"
      ? AccountStore.authenticate(email, password)
      : null;

    if (!account) {
      AppFallback.showError("Email or password is incorrect.");
      return;
    }

    completeStudentAuth(email, password, {
      studentName: account.studentName,
      age: typeof AccountStore.getCalculatedAge === "function"
        ? AccountStore.getCalculatedAge(account)
        : account.age,
      originalAge: account.originalAge != null ? account.originalAge : account.age,
      ageRecordedAt: account.ageRecordedAt || account.updatedAt || account.createdAt,
      language: account.language || currentLanguage,
      questionCount: account.questionCount || 10
    }, false);
  }

  function setCurrentStep(step) {
    if (VALID_STEPS.indexOf(step) === -1) {
      step = "language";
    }
    currentStep = step;
    updateTopbar();
  }

  function ensureValidStep() {
    if (VALID_STEPS.indexOf(currentStep) === -1 || !STEP_TO_SCREEN[currentStep]) {
      if (canRestoreAppState() && restoreAppState()) return false;
      setCurrentStep("language");
      showLanguageScreen();
      return false;
    }
    var expectedId = STEP_TO_SCREEN[currentStep];
    var active = document.querySelector(".screen.active");
    if (active && active.id !== expectedId) {
      showScreen(expectedId);
      return false;
    }
    if (!active) {
      showScreen(expectedId);
      return false;
    }
    return true;
  }

  function showScreen(screenId, step) {
    if (typeof AppFallback !== "undefined" && AppFallback.hideSplashScreen) {
      AppFallback.hideSplashScreen();
    }
    var allScreens = document.querySelectorAll(".screen");
    allScreens.forEach(function (s) { s.classList.remove("active"); });
    var target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
      if (step) setCurrentStep(step);
    } else if (typeof AppFallback !== "undefined") {
      setCurrentStep("language");
      AppFallback.ensureLanguageScreenVisible();
    }
    if (typeof AppFallback !== "undefined") {
      AppFallback.scheduleBlankScreenCheck();
    }
    updateTopbar();
  }

  function showLanguageScreen() {
    setCurrentStep("language");
    showScreen("language-screen", "language");
    updateI18nLabels();
  }

  function showStudentScreen() {
    setCurrentStep("student");
    showScreen("student-screen", "student");
    updateI18nLabels();
  }

  function showSignInScreen() {
    setCurrentStep("signin");
    showScreen("sign-in-screen", "signin");
    updateI18nLabels();
  }

  function showLoginScreen() {
    setCurrentStep("login");
    showScreen("login-screen", "login");
    updateI18nLabels();
  }

  function showParentScreen() {
    showSignInScreen();
  }

  function showDashboardScreen() {
    setCurrentStep("dashboard");
    showScreen("dashboard-screen", "dashboard");
    renderDashboard();
    updateI18nLabels();
  }

  function showQuizScreen() {
    setCurrentStep("quiz");
    showScreen("quiz-screen", "quiz");
    ensureAdminTestModeFromUrl();
    renderQuizQuestion();
    updateI18nLabels();
  }

  function showResultScreen(summary) {
    setCurrentStep("result");
    showScreen("result-screen", "result");
    renderResult(summary);
    updateI18nLabels();
  }

  function showProfileScreen() {
    closeProfileDropdown();
    setCurrentStep("profile");
    showScreen("profile-screen", "profile");
    renderProfilePanel();
  }

  function showSettingsScreen() {
    closeProfileDropdown();
    setCurrentStep("settings");
    showScreen("settings-screen", "settings");
    renderSettingsPanel();
  }

  function showProgressScreen() {
    closeProfileDropdown();
    setCurrentStep("progress");
    showScreen("progress-screen", "progress");
    renderProgressPanel();
  }

  function showCertificatesScreen() {
    closeProfileDropdown();
    setCurrentStep("certificates");
    showScreen("certificates-screen", "certificates");
    renderCertificatesPanel();
  }

  function renderProfilePanel() {
    var name = displayName(QuizSession.getStudentName());
    var nameEl = document.getElementById("profile-name-display");
    var ageEl = document.getElementById("profile-age-display");
    var emailEl = document.getElementById("profile-email-display");
    var langEl = document.getElementById("profile-lang-display");
    if (nameEl) nameEl.textContent = name;
    if (ageEl) ageEl.textContent = QuizSession.getAge() || "—";
    if (emailEl) emailEl.textContent = QuizSession.getParentEmail() || "—";
    if (langEl) langEl.textContent = QuizSession.getLanguage() || "en";
  }

  function renderSettingsPanel() {
    if (typeof AccountSettings !== "undefined") {
      AccountSettings.render();
    }
  }

  function renderProgressPanel() {
    var list = document.getElementById("progress-list");
    if (!list) return;
    var reports = Report.getReports().filter(function (r) {
      return displayName(r.studentName) === displayName(QuizSession.getStudentName());
    });
    if (!reports.length) {
      list.innerHTML = '<p class="empty-state">No quiz progress yet. Complete a quiz to see your results here.</p>';
      return;
    }
    list.innerHTML = reports.map(function (r) {
      var s = r.score || {};
      return '<div class="progress-item"><strong>' + (s.correct || 0) + '/' + (s.total || 0) +
        '</strong> correct · ' + Report.formatDate(r.completedAt) +
        (s.certificateEligible ? ' · 🎓 Certified' : '') + '</div>';
    }).join("");
  }

  function renderCertificatesPanel() {
    var list = document.getElementById("certificates-list");
    if (!list) return;

    var studentName = displayName(QuizSession.getStudentName());
    var saved = typeof CertificateSave !== "undefined"
      ? CertificateSave.getSavedForStudent(studentName)
      : [];
    var reports = Report.getReports().filter(function (r) {
      var s = r.score || {};
      return displayName(r.studentName) === studentName && s.certificateEligible;
    });

    if (!saved.length && !reports.length) {
      list.innerHTML = '<p class="empty-state">No certificates yet. Score with at most 1 wrong answer to earn one.</p>';
      return;
    }

    var html = "";

    saved.forEach(function (c) {
      html += '<div class="cert-item cert-item--saved">' +
        '<div><strong>🎓 ' + (typeof Security !== "undefined" ? Security.escapeHtml(c.studentName) : c.studentName) + '</strong>' +
        '<br><span class="cert-item-meta">' + (c.correct || 0) + '/' + (c.total || 0) +
        ' · ' + (c.dateStr || "") + '</span></div>' +
        '<button type="button" class="btn-secondary btn-sm cert-open-btn" data-cert-id="' +
        (typeof Security !== "undefined" ? Security.escapeHtml(c.id) : c.id) + '">Open</button></div>';
    });

    reports.forEach(function (r) {
      if (saved.some(function (c) { return c.id === r.certificateId; })) return;
      var s = r.score || {};
      html += '<div class="cert-item">🎓 ' + displayName(r.studentName) + ' — ' +
        (s.correct || 0) + '/' + (s.total || 0) + ' · ' + Report.formatDate(r.completedAt) + '</div>';
    });

    list.innerHTML = html;

    list.querySelectorAll(".cert-open-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var certId = btn.getAttribute("data-cert-id");
        var entry = saved.find(function (c) { return c.id === certId; });
        if (!entry) return;
        openSavedCertificate(entry);
      });
    });
  }

  function openSavedCertificate(entry) {
    var summary = {
      studentName: entry.studentName,
      correct: entry.correct,
      total: entry.total,
      percentage: entry.percentage,
      certificateEligible: true,
      courseName: entry.courseName,
      quizName: entry.quizName,
      certificateId: entry.id
    };
    window._lastSummary = summary;
    window._certificateDateStr = entry.dateStr;
    showResultScreen(summary);
    var certEl = document.getElementById("certificate-container");
    if (certEl) {
      Report.renderCertificate(certEl, displayName(summary.studentName), {
        correct: summary.correct,
        wrong: 0,
        total: summary.total
      }, entry.dateStr, {
        courseName: summary.courseName,
        quizName: summary.quizName,
        certificateId: summary.certificateId
      });
      if (typeof CertificateSave !== "undefined") {
        CertificateSave.showCertificateActions(true);
        CertificateSave.hideMessage();
      }
      certEl.scrollIntoView({ behavior: "smooth" });
    }
  }

  function showCertificateForSummary(summary) {
    var certEl = document.getElementById("certificate-container");
    if (!summary || !certEl) return;
    var dateStr = Report.formatDate(new Date().toISOString());
    window._certificateDateStr = dateStr;
    Report.renderCertificate(certEl, displayName(summary.studentName), {
      correct: summary.correct,
      wrong: summary.wrong,
      total: summary.total
    }, dateStr, {
      courseName: summary.courseName,
      quizName: summary.quizName,
      certificateId: summary.certificateId
    });
    if (typeof CertificateSave !== "undefined") {
      CertificateSave.showCertificateActions(true);
      CertificateSave.hideMessage();
    }
  }

  /* Expose for splash.js */
  window.showLanguageScreen = showLanguageScreen;
  window.showStudentScreen = showStudentScreen;
  window.showSignInScreen = showSignInScreen;
  window.showLoginScreen = showLoginScreen;
  window.showParentScreen = showParentScreen;
  window.showDashboardScreen = showDashboardScreen;
  window.showQuizScreen = showQuizScreen;
  window.updateTopbar = updateTopbar;
  window.showResultScreen = showResultScreen;
  window.showCertificatesScreen = showCertificatesScreen;
  window.setCurrentStep = setCurrentStep;
  window.getCurrentStep = function () { return currentStep; };
  window.restoreAppState = restoreAppState;
  window.canRestoreAppState = canRestoreAppState;
  window.hasPersistedSession = hasPersistedSession;

  function updateI18nLabels() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });
  }

  function renderDashboard() {
    var nameEl = document.getElementById("dashboard-student-name");
    var ageEl = document.getElementById("dashboard-student-age");
    var resumeBtn = document.getElementById("resume-quiz-btn");

    if (nameEl) nameEl.textContent = displayName(QuizSession.getStudentName());
    if (ageEl) ageEl.textContent = QuizSession.getAge() || "—";

    if (resumeBtn) {
      resumeBtn.style.display = QuizProgressStore.hasActiveQuiz() ? "inline-flex" : "none";
    }
  }

  function updateAdminQuizControls() {
    var controls = document.getElementById("admin-quiz-controls");
    var jumpSelect = document.getElementById("admin-jump-select");
    var testToggle = document.getElementById("admin-test-mode-toggle");
    if (!controls) return;

    var show = shouldShowAdminQuizControls();
    controls.classList.toggle("hidden", !show);

    if (testToggle && typeof AdminSession !== "undefined") {
      testToggle.checked = AdminSession.isTestMode();
    }

    if (show && jumpSelect) {
      var progress = QuizProgressStore.getProgress();
      if (progress && progress.questions) {
        jumpSelect.innerHTML = "";
        progress.questions.forEach(function (q, i) {
          var opt = document.createElement("option");
          opt.value = String(i);
          opt.textContent = "Q" + (i + 1) + ": " + q.category;
          if (i === progress.currentIndex) opt.selected = true;
          jumpSelect.appendChild(opt);
        });
      }
    }
  }

  function resetQuizStateForNewAttempt() {
    if (typeof QuizProgressStore !== "undefined" && QuizProgressStore.clearProgress) {
      QuizProgressStore.clearProgress();
    }
    window._selectedAnswer = null;
    window._lastSummary = null;
    window._certificateDateStr = null;
  }

  function resolveSelectedQuestionCount(count, options) {
    options = options || {};
    if (typeof Security !== "undefined" && Security.requireQuestionCount) {
      var required = Security.requireQuestionCount(count);
      if (required != null) return required;
      if (options.allowFallback === false) return null;
      return Security.normalizeQuestionCount(count, null);
    }
    var n = parseInt(count, 10);
    return isNaN(n) ? (options.allowFallback === false ? null : 10) : n;
  }

  function persistQuestionCount(count) {
    QuizSession.updateQuestionCount(count);
    pendingStudent.questionCount = count;
    if (typeof AccountStore !== "undefined" && QuizSession.isLoggedIn()) {
      var email = QuizSession.getParentEmail();
      if (email && AccountStore.updateQuestionCount) {
        AccountStore.updateQuestionCount(email, count);
      }
    }
  }

  function promptStartQuiz(onComplete) {
    resetQuizStateForNewAttempt();
    openQuestionCountModal(function (count) {
      if (onComplete) onComplete(count);
    }, QuizSession.getQuestionCount());
  }

  function getQuestionBank() {
    if (typeof QuestionBank !== "undefined") return QuestionBank.getAll();
    return typeof QUESTION_BANK !== "undefined" ? QUESTION_BANK : [];
  }

  function selectQuestionsForStudent(age, count) {
    var bank = getQuestionBank();
    var historyKey = typeof QuestionHistory !== "undefined" ? QuestionHistory.keyFromSession() : "";
    var recentIds = historyKey && typeof QuestionHistory !== "undefined"
      ? QuestionHistory.getRecentIdMap(historyKey)
      : {};
    var result = QuizCore.selectSmartQuestions(bank, age, count, { recentIds: recentIds });
    var questions = result.questions || [];
    if (historyKey && questions.length && typeof QuestionHistory !== "undefined") {
      QuestionHistory.recordFromQuestions(historyKey, questions);
    }
    return result;
  }

  function startNewQuizWithCount(count, options) {
    options = options || {};
    var age = QuizSession.getAge();
    var name = QuizSession.getStudentName();
    var lang = QuizSession.getLanguage();
    if (!age || !name) return;

    var selectedQuestionCount = resolveSelectedQuestionCount(count, {
      allowFallback: options.allowFallback !== false
    });
    if (selectedQuestionCount == null) {
      AppFallback.showError("Please select a valid number of questions.");
      return;
    }

    resetQuizStateForNewAttempt();
    persistQuestionCount(selectedQuestionCount);

    var bank = getQuestionBank();
    var availableQuestions = typeof QuizCore !== "undefined" && QuizCore.filterByAge
      ? QuizCore.filterByAge(bank, age)
      : bank;

    var selection = selectQuestionsForStudent(age, selectedQuestionCount);
    var quizQuestions = selection.questions || [];

    console.log("Selected question count:", selectedQuestionCount);
    console.log("Available questions:", availableQuestions.length);
    console.log("Generated quiz questions:", quizQuestions.length);

    if (!quizQuestions.length) {
      AppFallback.showError("No questions available for this age group.");
      return;
    }

    if (selection.requestedCount > quizQuestions.length) {
      AppFallback.showError(
        "Only " + quizQuestions.length + " questions are available for this age group."
      );
    } else {
      AppFallback.hideError();
    }

    QuizProgressStore.startQuiz(quizQuestions, name, age, lang, selectedQuestionCount);
    showQuizScreen();
  }

  function startNewQuiz() {
    promptStartQuiz(function (count) {
      startNewQuizWithCount(count, { allowFallback: false });
    });
  }

  function renderQuizQuestion() {
    var progress = QuizProgressStore.getProgress();
    if (!progress || !progress.questions.length) {
      showDashboardScreen();
      return;
    }

    if (QuizProgressStore.isComplete()) {
      finishQuiz();
      return;
    }

    var idx = progress.currentIndex;
    var q = progress.questions[idx];
    var total = progress.questions.length;

    var counterEl = document.getElementById("quiz-counter");
    var categoryEl = document.getElementById("quiz-category");
    var questionEl = document.getElementById("quiz-question-text");
    var optionsEl = document.getElementById("quiz-options");
    var feedbackEl = document.getElementById("quiz-feedback");

    if (counterEl) counterEl.textContent = t("question") + " " + (idx + 1) + " / " + total;
    if (categoryEl) categoryEl.textContent = q.category;
    if (questionEl) questionEl.textContent = q.question;
    if (feedbackEl) {
      feedbackEl.textContent = "";
      feedbackEl.className = "quiz-feedback";
    }

    if (optionsEl) {
      optionsEl.innerHTML = "";
      q.options.forEach(function (opt, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-option-btn";
        btn.textContent = opt;
        btn.dataset.index = String(i);
        btn.addEventListener("click", function () { selectAnswer(i); });
        optionsEl.appendChild(btn);
      });
    }

    var submitBtn = document.getElementById("quiz-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = idx === total - 1 ? t("finish") : t("submit");
    }

    window._selectedAnswer = null;
    updateAdminQuizControls();
  }

  function selectAnswer(index) {
    window._selectedAnswer = index;
    var optionsEl = document.getElementById("quiz-options");
    if (optionsEl) {
      optionsEl.querySelectorAll(".quiz-option-btn").forEach(function (btn) {
        btn.classList.toggle("selected", Number(btn.dataset.index) === index);
      });
    }
    var submitBtn = document.getElementById("quiz-submit-btn");
    if (submitBtn) submitBtn.disabled = false;
  }

  function submitAnswer() {
    var progress = QuizProgressStore.getProgress();
    var idx = progress.currentIndex;
    var q = progress.questions[idx];
    var selected = window._selectedAnswer;

    var autoPass = typeof AuthGuard !== "undefined" && AuthGuard.shouldAutoPassQuiz();

    if (!autoPass && (selected === null || selected === undefined)) return;

    if (autoPass) {
      selected = q.correctIndex;
    }

    var correct = QuizCore.isCorrect(q, selected);

    var feedbackEl = document.getElementById("quiz-feedback");
    if (feedbackEl) {
      feedbackEl.textContent = correct ? "✓ Correct! " + q.explanation : "✗ " + q.explanation;
      feedbackEl.className = "quiz-feedback " + (correct ? "feedback-correct" : "feedback-wrong");
    }

    var optionsEl = document.getElementById("quiz-options");
    if (optionsEl) {
      optionsEl.querySelectorAll(".quiz-option-btn").forEach(function (btn) {
        var i = Number(btn.dataset.index);
        btn.disabled = true;
        if (i === q.correctIndex) btn.classList.add("correct");
        if (i === selected && !correct) btn.classList.add("wrong");
      });
    }

    QuizProgressStore.recordAnswer(idx, selected);

    setTimeout(function () {
      if (QuizProgressStore.isComplete()) {
        finishQuiz();
      } else {
        renderQuizQuestion();
      }
    }, 1200);
  }

  function finishQuiz() {
    var progress = QuizProgressStore.getProgress();
    if (!progress) return;

    var score = QuizCore.calculateScore(progress.answers, progress.questions);

    if (isAdminQuizMode()) {
      score = { correct: progress.questions.length, wrong: 0, total: progress.questions.length };
    }

    var effectiveWrong = AuthGuard.getEffectiveWrongCount(score.wrong);
    var eligible = AuthGuard.isCertificateEligible(score.wrong);

    var summary = Report.buildResultSummary(progress.studentName, {
      correct: score.correct,
      wrong: effectiveWrong,
      total: score.total
    }, eligible, {
      courseName: progress.courseName,
      quizName: progress.quizName
    });

    Report.saveReport({
      studentName: progress.studentName,
      age: progress.age,
      language: progress.language,
      score: summary,
      certificateId: summary.certificateId,
      completedAt: new Date().toISOString()
    });

    QuizProgressStore.clearProgress();
    showResultScreen(summary);
  }

  function renderResult(summary) {
    var cardEl = document.getElementById("result-card-container");
    var certEl = document.getElementById("certificate-container");
    var certBtn = document.getElementById("view-certificate-btn");

    if (cardEl) Report.renderResultCard(cardEl, summary);

    if (certEl) certEl.innerHTML = "";
    if (certBtn) {
      certBtn.style.display = summary.certificateEligible ? "inline-flex" : "none";
    }
    if (typeof CertificateSave !== "undefined") {
      CertificateSave.showCertificateActions(false);
      CertificateSave.hideMessage();
    }

    window._lastSummary = summary;
    window._certificateDateStr = null;
  }

  function bindEvents() {
    /* Language selection */
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentLanguage = btn.dataset.lang || "en";
        if (QuizSession.isLoggedIn()) {
          QuizSession.updateLanguage(currentLanguage);
          showDashboardScreen();
          return;
        }
        showStudentScreen();
      });
    });

    /* Student details → Next */
    var studentForm = document.getElementById("student-form");
    if (studentForm) {
      studentForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var nameInput = document.getElementById("student-name-input");
        var ageInput = document.getElementById("student-age-input");
        var name = nameInput ? nameInput.value.trim() : "";
        var age = ageInput ? parseInt(ageInput.value, 10) : NaN;
        var countInput = document.getElementById("question-count-input");
        var questionCount = countInput ? parseInt(countInput.value, 10) : 10;

        if (!name || !Security.isValidAge(age)) {
          AppFallback.showError("Please enter a valid name and age (5–15).");
          return;
        }
        if (!Security.isValidQuestionCount(questionCount)) {
          AppFallback.showError("Please select a valid number of questions.");
          return;
        }

        pendingStudent.name = displayName(name);
        pendingStudent.age = age;
        pendingStudent.questionCount = questionCount;
        AppFallback.hideError();
        showSignInScreen();
      });
    }

    var signInBackBtn = document.getElementById("sign-in-back-btn");
    if (signInBackBtn) signInBackBtn.addEventListener("click", showStudentScreen);

    var goToLoginBtn = document.getElementById("go-to-login-btn");
    if (goToLoginBtn) goToLoginBtn.addEventListener("click", showLoginScreen);

    var goToStudentBtn = document.getElementById("go-to-student-btn");
    if (goToStudentBtn) goToStudentBtn.addEventListener("click", showStudentScreen);

    var signInForm = document.getElementById("sign-in-form");
    if (signInForm) {
      signInForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var emailInput = document.getElementById("sign-in-email-input");
        var passInput = document.getElementById("sign-in-password-input");
        var email = emailInput ? emailInput.value.trim() : "";
        var password = passInput ? passInput.value : "";

        if (!email || !password) {
          AppFallback.showError("Please enter email and password.");
          return;
        }
        if (!Security.isValidEmail(email)) {
          AppFallback.showError("Please enter a valid email address.");
          return;
        }

        handleSignInSubmit(email, password);
      });
    }

    var loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var emailInput = document.getElementById("login-email-input");
        var passInput = document.getElementById("login-password-input");
        var email = emailInput ? emailInput.value.trim() : "";
        var password = passInput ? passInput.value : "";

        if (!email || !password) {
          AppFallback.showError("Please enter email and password.");
          return;
        }
        if (!Security.isValidEmail(email)) {
          AppFallback.showError("Please enter a valid email address.");
          return;
        }

        handleLoginSubmit(email, password);
      });
    }

    /* Profile menu */
    if (profileBtn) {
      profileBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleProfileDropdown();
      });
    }

    document.addEventListener("click", function () {
      closeProfileDropdown();
    });

    if (profileDropdown) {
      profileDropdown.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }

    var menuMyProfile = document.getElementById("menu-my-profile");
    if (menuMyProfile) menuMyProfile.addEventListener("click", showProfileScreen);

    var menuAccountSettings = document.getElementById("menu-account-settings");
    if (menuAccountSettings) menuAccountSettings.addEventListener("click", showSettingsScreen);

    var menuMyProgress = document.getElementById("menu-my-progress");
    if (menuMyProgress) menuMyProgress.addEventListener("click", showProgressScreen);

    var menuMyCertificates = document.getElementById("menu-my-certificates");
    if (menuMyCertificates) menuMyCertificates.addEventListener("click", showCertificatesScreen);

    if (menuAdminPanel) {
      menuAdminPanel.addEventListener("click", function () {
        closeProfileDropdown();
        window.location.href = "admin.html";
      });
    }

    var menuLogout = document.getElementById("menu-logout");
    if (menuLogout) menuLogout.addEventListener("click", handleLogout);

    var profileBackBtn = document.getElementById("profile-back-btn");
    if (profileBackBtn) profileBackBtn.addEventListener("click", showDashboardScreen);

    var settingsBackBtn = document.getElementById("settings-back-btn");
    if (settingsBackBtn) settingsBackBtn.addEventListener("click", showDashboardScreen);

    var progressBackBtn = document.getElementById("progress-back-btn");
    if (progressBackBtn) progressBackBtn.addEventListener("click", showDashboardScreen);

    var certificatesBackBtn = document.getElementById("certificates-back-btn");
    if (certificatesBackBtn) certificatesBackBtn.addEventListener("click", showDashboardScreen);

    /* Dashboard actions */
    var startBtn = document.getElementById("start-quiz-btn");
    if (startBtn) startBtn.addEventListener("click", startNewQuiz);

    var resumeBtn = document.getElementById("resume-quiz-btn");
    if (resumeBtn) resumeBtn.addEventListener("click", showQuizScreen);

    /* Quiz submit */
    var submitBtn = document.getElementById("quiz-submit-btn");
    if (submitBtn) submitBtn.addEventListener("click", submitAnswer);

    /* Result actions */
    var certBtn = document.getElementById("view-certificate-btn");
    if (certBtn) {
      certBtn.addEventListener("click", function () {
        var summary = window._lastSummary;
        if (summary && summary.certificateEligible) {
          showCertificateForSummary(summary);
          var certEl = document.getElementById("certificate-container");
          if (certEl) certEl.scrollIntoView({ behavior: "smooth" });
        }
      });
    }

    if (typeof CertificateSave !== "undefined") {
      CertificateSave.bindEvents(function () { return window._lastSummary; });
    }

    var retryBtn = document.getElementById("try-again-btn");
    if (retryBtn) retryBtn.addEventListener("click", function () {
      startNewQuiz();
    });

    var qModalConfirm = document.getElementById("question-count-confirm");
    if (qModalConfirm) {
      qModalConfirm.addEventListener("click", function () {
        var select = document.getElementById("question-count-modal-select");
        var rawCount = select ? select.value : "";
        var count = typeof Security !== "undefined" && Security.requireQuestionCount
          ? Security.requireQuestionCount(rawCount)
          : parseInt(rawCount, 10);
        if (count == null || isNaN(count)) {
          AppFallback.showError("Please select a valid number of questions.");
          return;
        }
        var cb = questionCountModalCallback;
        closeQuestionCountModal();
        if (cb) cb(count);
      });
    }

    var qModalCancel = document.getElementById("question-count-cancel");
    if (qModalCancel) qModalCancel.addEventListener("click", closeQuestionCountModal);

    var qModalBackdrop = document.querySelector("#question-count-modal .modal-backdrop");
    if (qModalBackdrop) qModalBackdrop.addEventListener("click", closeQuestionCountModal);

    var adminSkipBtn = document.getElementById("admin-skip-btn");
    if (adminSkipBtn) {
      adminSkipBtn.addEventListener("click", function () {
        if (!shouldShowAdminQuizControls()) return;
        QuizProgressStore.skipQuestion();
        if (QuizProgressStore.isComplete()) finishQuiz();
        else renderQuizQuestion();
      });
    }

    var adminFinishBtn = document.getElementById("admin-finish-btn");
    if (adminFinishBtn) {
      adminFinishBtn.addEventListener("click", function () {
        if (!shouldShowAdminQuizControls()) return;
        QuizProgressStore.finishEarly();
        finishQuiz();
      });
    }

    var adminJumpSelect = document.getElementById("admin-jump-select");
    if (adminJumpSelect) {
      adminJumpSelect.addEventListener("change", function () {
        if (!shouldShowAdminQuizControls()) return;
        QuizProgressStore.jumpToQuestion(parseInt(adminJumpSelect.value, 10));
        renderQuizQuestion();
      });
    }

    var adminTestToggle = document.getElementById("admin-test-mode-toggle");
    if (adminTestToggle) {
      adminTestToggle.addEventListener("change", function () {
        if (!shouldShowAdminQuizControls() || typeof AdminSession === "undefined") return;
        AdminSession.setTestMode(adminTestToggle.checked);
      });
    }

    var adminBackPanelBtn = document.getElementById("admin-back-panel-btn");
    if (adminBackPanelBtn) {
      adminBackPanelBtn.addEventListener("click", function () {
        if (!shouldShowAdminQuizControls()) return;
        window.location.href = "admin.html";
      });
    }

    var backBtn = document.getElementById("back-dashboard-btn");
    if (backBtn) backBtn.addEventListener("click", showDashboardScreen);

    /* Theme toggle */
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme") || "light";
        var next = current === "dark" ? "light" : "dark";
        DataStore.set("theme", next);
        applyTheme();
      });
    }
  }

  function init() {
    if (typeof RouteGuard !== "undefined" && RouteGuard.runStudentAppAdminRedirect(
      "Student app init — admin belongs on Admin Panel"
    )) {
      return;
    }

    initAdminTestFromUrl();
    applyTheme();
    bindEvents();

    // Shared SSO restore (same cookie as portfolio + Flash Cards)
    var bootShared = Promise.resolve();
    if (typeof AdminSession !== "undefined" && AdminSession.refreshFromServer) {
      bootShared = AdminSession.refreshFromServer();
    }
    bootShared
      .then(function () {
        if (typeof HassanSharedAuth === "undefined") return null;
        return HassanSharedAuth.getSession();
      })
      .then(function (shared) {
        if (shared && shared.ok && shared.isLoggedIn && shared.user) {
          renderSharedAuthBar(shared.user);
          if (!hasPersistedSession()) {
            applySharedUserSession(shared.user, {
              studentName: shared.user.displayName,
              age: 10,
              language: currentLanguage,
              questionCount: 10
            }, false);
          }
        } else {
          renderSharedAuthBar(null);
        }
      })
      .catch(function () {
        renderSharedAuthBar(null);
      });

    if (hasPersistedSession()) {
      hydrateFromStoredSession();
    } else if (QuizSession.isLoggedIn() && typeof QuizSession.migrateLegacySession === "function") {
      QuizSession.migrateLegacySession();
      QuizSession.syncSessionAge();
    }
    ensureOwnerAdminSession();
    updateTopbar();
    if (typeof AccountSettings !== "undefined") {
      AccountSettings.init();
    }

    document.addEventListener("splashComplete", function () {
      if (typeof RouteGuard !== "undefined" && RouteGuard.runStudentAppAdminRedirect(
        "splashComplete — admin must not enter student onboarding"
      )) {
        return;
      }
      if (typeof AppFallback !== "undefined") {
        AppFallback.hideSplashScreen();
        AppFallback.clearSplashSafetyNet();
      }
      var splashEl = document.getElementById("splash-screen");
      var splashStillActive = splashEl && splashEl.classList.contains("active");
      if (!document.querySelector(".screen.active") || splashStillActive) {
        if (restoreAppState()) {
          ensureValidStep();
          return;
        }
        if (typeof AppFallback !== "undefined" && !AppFallback.hasActiveScreen()) {
          showLanguageScreen();
          return;
        }
      }
      updateTopbar();
      ensureValidStep();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if (typeof RouteGuard !== "undefined") {
    RouteGuard.runStudentAppAdminRedirect("Immediate load — admin session on student app");
  }
})();
