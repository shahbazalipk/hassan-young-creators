/** Splash intro — "Made by HASSAAN" then language or resume */
(function () {
  var SPLASH_DURATION_MS = 2500;

  function hideSplash() {
    if (typeof SplashFireworks !== "undefined") {
      SplashFireworks.stop();
    }
    var splash = document.getElementById("splash-screen");
    if (splash) splash.classList.remove("active");
    if (typeof AppFallback !== "undefined" && AppFallback.hideSplashScreen) {
      AppFallback.hideSplashScreen();
    }
  }

  function isValidSession() {
    try {
      if (typeof window.canRestoreAppState === "function") {
        return window.canRestoreAppState();
      }
      if (typeof QuizSession === "undefined") return false;
      if (!QuizSession.isLoggedIn()) return false;
      var s = QuizSession.getSession();
      if (!s || !s.studentName || !s.parentEmail) return false;
      if (typeof Security !== "undefined" && !Security.isValidEmail(s.parentEmail)) return false;
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasResumeState() {
    try {
      if (typeof RouteGuard !== "undefined" && RouteGuard.shouldRedirectAdminFromStudentApp()) {
        return false;
      }
      if (typeof window.canRestoreAppState === "function" && window.canRestoreAppState()) {
        return true;
      }
      if (typeof QuizProgressStore !== "undefined" && QuizProgressStore.hasActiveQuiz()) {
        return true;
      }
      if (isValidSession()) return true;
    } catch (e) {
      /* fall through */
    }
    return false;
  }

  function clearInvalidSession() {
    try {
      if (typeof QuizSession !== "undefined" && QuizSession.isLoggedIn() && !isValidSession()) {
        QuizSession.clearSession();
      }
      if (typeof QuizProgressStore !== "undefined") {
        var p = QuizProgressStore.getProgress();
        if (p && (!p.questions || !p.questions.length)) {
          QuizProgressStore.clearProgress();
        }
      }
    } catch (e) {
      /* ignore */
    }
  }

  function dispatchSplashComplete() {
    document.dispatchEvent(new CustomEvent("splashComplete"));
  }

  function showLanguageEntry() {
    hideSplash();
    if (typeof window.setCurrentStep === "function") {
      window.setCurrentStep("language");
    }
    if (typeof window.showLanguageScreen === "function") {
      window.showLanguageScreen();
    } else if (typeof AppFallback !== "undefined") {
      AppFallback.ensureLanguageScreenVisible();
    }
    if (typeof AppFallback !== "undefined") {
      AppFallback.scheduleBlankScreenCheck();
    }
  }

  function showLoginEntry() {
    hideSplash();
    if (typeof window.setCurrentStep === "function") {
      window.setCurrentStep("login");
    }
    if (typeof window.showLoginScreen === "function") {
      window.showLoginScreen();
    } else {
      showLanguageEntry();
    }
    if (typeof AppFallback !== "undefined") {
      AppFallback.scheduleBlankScreenCheck();
    }
  }

  function showResumeEntry() {
    hideSplash();
    try {
      if (typeof window.restoreAppState === "function" && window.restoreAppState()) {
        return;
      }
      if (typeof QuizProgressStore !== "undefined" && QuizProgressStore.hasActiveQuiz()) {
        if (typeof window.setCurrentStep === "function") window.setCurrentStep("quiz");
        if (typeof window.showQuizScreen === "function") {
          window.showQuizScreen();
          return;
        }
      }
      if (isValidSession()) {
        if (typeof window.setCurrentStep === "function") window.setCurrentStep("dashboard");
        if (typeof window.showDashboardScreen === "function") {
          window.showDashboardScreen();
          return;
        }
      }
    } catch (e) {
      console.error("resume entry failed:", e);
    }
    showLanguageEntry();
  }

  function handleAppEntry() {
    try {
      if (typeof RouteGuard !== "undefined" && RouteGuard.runStudentAppAdminRedirect(
        "Admin session on student app — skip language/quiz onboarding"
      )) {
        return;
      }

      clearInvalidSession();

      if (typeof AppFallback !== "undefined") {
        AppFallback.clearSplashSafetyNet();
      }

      if (hasResumeState()) {
        showResumeEntry();
      } else {
        showLanguageEntry();
      }

      hideSplash();

      if (typeof AppFallback !== "undefined" && !AppFallback.hasActiveScreen()) {
        if (typeof AppFallback.tryRestoreOrLanguage === "function") {
          AppFallback.tryRestoreOrLanguage();
        } else {
          AppFallback.ensureLanguageScreenVisible();
        }
      }
    } catch (e) {
      console.error("handleAppEntry failed:", e);
      hideSplash();
      if (typeof AppFallback !== "undefined") {
        AppFallback.ensureLanguageScreenVisible();
        AppFallback.showError("Could not start app — please select a language.");
      }
    }
  }

  function runIntro() {
    var splash = document.getElementById("splash-screen");
    if (!splash) {
      handleAppEntry();
      dispatchSplashComplete();
      return;
    }

    if (!splash.classList.contains("active")) {
      splash.classList.add("active");
    }

    if (typeof SplashFireworks !== "undefined") {
      SplashFireworks.start();
    }

    setTimeout(function () {
      handleAppEntry();
      dispatchSplashComplete();
      hideSplash();
      if (typeof AppFallback !== "undefined" && !AppFallback.hasActiveScreen()) {
        if (typeof AppFallback.tryRestoreOrLanguage === "function") {
          AppFallback.tryRestoreOrLanguage();
        } else {
          AppFallback.ensureLanguageScreenVisible();
        }
      }
    }, SPLASH_DURATION_MS);
  }

  function scheduleIntro() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runIntro);
    } else {
      runIntro();
    }
  }

  scheduleIntro();
})();
