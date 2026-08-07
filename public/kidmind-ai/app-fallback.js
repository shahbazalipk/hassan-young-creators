/** Error-only fallback — never leave the page without a visible screen */
var AppFallback = (function () {
  var splashSafetyTimer = null;
  var blankCheckTimer = null;
  var SPLASH_TIMEOUT_MS = 5000;
  var BLANK_CHECK_MS = 100;

  function showError(message) {
    var el = document.getElementById("app-error-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "app-error-banner";
      el.className = "app-error-banner";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
  }

  function hideError() {
    var el = document.getElementById("app-error-banner");
    if (el) el.hidden = true;
  }

  function isSplashActive() {
    var splash = document.getElementById("splash-screen");
    return !!(splash && splash.classList.contains("active"));
  }

  function hideSplashScreen() {
    var splash = document.getElementById("splash-screen");
    if (splash) splash.classList.remove("active");
  }

  function hasActiveScreen() {
    var active = document.querySelector(".screen.active");
    if (!active) return false;
    if (active.id === "splash-screen") return false;
    return true;
  }

  function ensureLanguageScreenVisible() {
    try {
      if (typeof RouteGuard !== "undefined" && RouteGuard.runStudentAppAdminRedirect(
        "Blocked language screen for authenticated admin"
      )) {
        return false;
      }
      hideSplashScreen();
      var languageScreen = document.getElementById("language-screen");
      if (!languageScreen) return false;

      document.querySelectorAll(".screen").forEach(function (s) {
        s.classList.remove("active");
      });
      languageScreen.classList.add("active");
      return true;
    } catch (e) {
      return false;
    }
  }

  function hasPersistedAppState() {
    if (typeof window.canRestoreAppState === "function") {
      try {
        return window.canRestoreAppState();
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function tryRestoreAppState() {
    if (typeof window.restoreAppState !== "function") return false;
    try {
      return window.restoreAppState();
    } catch (e) {
      return false;
    }
  }

  function tryRestoreOrLanguage() {
    hideSplashScreen();
    if (typeof RouteGuard !== "undefined" && RouteGuard.runStudentAppAdminRedirect(
      "Blocked student restore for authenticated admin"
    )) {
      return true;
    }
    if (tryRestoreAppState()) return true;
    return ensureLanguageScreenVisible();
  }

  function ensureVisibleScreen() {
    if (hasActiveScreen()) return true;
    if (hasPersistedAppState() && tryRestoreAppState()) {
      return hasActiveScreen();
    }
    if (typeof window.showLanguageScreen === "function") {
      try {
        window.showLanguageScreen();
        return hasActiveScreen();
      } catch (e) {
        /* fall through */
      }
    }
    return ensureLanguageScreenVisible();
  }

  function scheduleBlankScreenCheck() {
    if (blankCheckTimer) clearTimeout(blankCheckTimer);
    blankCheckTimer = setTimeout(function () {
      blankCheckTimer = null;
      if (isSplashActive() || !hasActiveScreen()) {
        if (hasPersistedAppState() && tryRestoreAppState()) return;
        hideSplashScreen();
        ensureLanguageScreenVisible();
      }
    }, BLANK_CHECK_MS);
  }

  function registerSplashSafetyNet() {
    if (splashSafetyTimer) clearTimeout(splashSafetyTimer);
    splashSafetyTimer = setTimeout(function () {
      splashSafetyTimer = null;
      if (isSplashActive() || !hasActiveScreen()) {
        if (hasPersistedAppState() && tryRestoreAppState()) return;
        hideSplashScreen();
        ensureLanguageScreenVisible();
        if (typeof window.showLanguageScreen === "function") {
          try { window.showLanguageScreen(); } catch (e) { /* ignore */ }
        }
      }
    }, SPLASH_TIMEOUT_MS);
  }

  function clearSplashSafetyNet() {
    if (splashSafetyTimer) {
      clearTimeout(splashSafetyTimer);
      splashSafetyTimer = null;
    }
  }

  function registerGlobalErrorHandlers() {
    window.addEventListener("error", function () {
      ensureVisibleScreen();
    });
    window.addEventListener("unhandledrejection", function () {
      ensureVisibleScreen();
    });
  }

  function handleGlobalError(message) {
    showError(message || "Something went wrong.");
    if (hasPersistedAppState() && tryRestoreAppState()) return;
    ensureLanguageScreenVisible();
  }

  return {
    showError: showError,
    hideError: hideError,
    isSplashActive: isSplashActive,
    hideSplashScreen: hideSplashScreen,
    hasActiveScreen: hasActiveScreen,
    hasPersistedAppState: hasPersistedAppState,
    tryRestoreAppState: tryRestoreAppState,
    tryRestoreOrLanguage: tryRestoreOrLanguage,
    ensureLanguageScreenVisible: ensureLanguageScreenVisible,
    ensureVisibleScreen: ensureVisibleScreen,
    scheduleBlankScreenCheck: scheduleBlankScreenCheck,
    registerSplashSafetyNet: registerSplashSafetyNet,
    clearSplashSafetyNet: clearSplashSafetyNet,
    registerGlobalErrorHandlers: registerGlobalErrorHandlers,
    handleGlobalError: handleGlobalError
  };
})();
