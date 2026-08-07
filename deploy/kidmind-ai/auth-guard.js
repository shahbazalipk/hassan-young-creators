/** Auth guard — admin test mode auto-pass for quiz scoring */
var AuthGuard = (function () {
  function isAdminTestMode() {
    try {
      return typeof AdminSession !== "undefined" && AdminSession.isOwnerAdmin() && AdminSession.isTestMode();
    } catch (e) {
      return false;
    }
  }

  function isAdminQuizMode() {
    try {
      if (typeof AdminSession === "undefined") return false;
      if (!AdminSession.isOwnerAdmin() || !AdminSession.isTestMode()) return false;
      var params = typeof window !== "undefined" && window.location
        ? new URLSearchParams(window.location.search) : null;
      return params ? params.get("adminTest") === "1" : false;
    } catch (e) {
      return false;
    }
  }

  function canAccessAdmin() {
    try {
      return typeof AdminSession !== "undefined" && AdminSession.isOwnerAdmin();
    } catch (e) {
      return false;
    }
  }

  function shouldShowAdminQuizControls() {
    return canAccessAdmin();
  }

  function shouldAutoPassQuiz() {
    return isAdminQuizMode() || isAdminTestMode();
  }

  function getEffectiveWrongCount(actualWrong) {
    if (shouldAutoPassQuiz()) return 0;
    return actualWrong;
  }

  function isCertificateEligible(actualWrong) {
    var effective = getEffectiveWrongCount(actualWrong);
    return QuizCore.isCertificateEligible(effective);
  }

  return {
    isAdminTestMode: isAdminTestMode,
    isAdminQuizMode: isAdminQuizMode,
    shouldAutoPassQuiz: shouldAutoPassQuiz,
    getEffectiveWrongCount: getEffectiveWrongCount,
    isCertificateEligible: isCertificateEligible,
    canAccessAdmin: canAccessAdmin,
    shouldShowAdminQuizControls: shouldShowAdminQuizControls
  };
})();
