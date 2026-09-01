/** Student/parent session persistence */
var QuizSession = (function () {
  var STORAGE_KEY = "session";

  function getSession() {
    return DataStore.get(STORAGE_KEY, null);
  }

  function saveSession(data) {
    return DataStore.set(STORAGE_KEY, data);
  }

  function clearSession() {
    return DataStore.remove(STORAGE_KEY);
  }

  function isLoggedIn() {
    var s = getSession();
    return !!(s && s.studentName && s.parentEmail);
  }

  function getStudentName() {
    var s = getSession();
    return s ? s.studentName : "";
  }

  function getLanguage() {
    var s = getSession();
    return s ? (s.language || "en") : "en";
  }

  function resolveOriginalAge(session) {
    if (!session) return null;
    if (session.originalAge != null) return session.originalAge;
    return session.age != null ? session.age : null;
  }

  function resolveAgeRecordedAt(session) {
    if (!session) return null;
    return session.ageRecordedAt || session.loggedInAt || null;
  }

  function getCalculatedAge(session) {
    session = session || getSession();
    if (!session) return null;
    var original = resolveOriginalAge(session);
    if (original == null) return null;
    var recorded = resolveAgeRecordedAt(session);
    if (typeof AgeCalculator !== "undefined" && recorded) {
      return AgeCalculator.calculateCurrentAge(original, recorded);
    }
    return original;
  }

  function applyCalculatedAge(session) {
    if (!session) return null;
    var calculated = getCalculatedAge(session);
    session.calculatedCurrentAge = calculated;
    session.age = calculated;
    return session;
  }

  function syncSessionAge() {
    var s = getSession();
    if (!s) return null;
    applyCalculatedAge(s);
    saveSession(s);
    return s;
  }

  function getAge() {
    return getCalculatedAge();
  }

  function getOriginalAge() {
    var s = getSession();
    return s ? resolveOriginalAge(s) : null;
  }

  function getAgeRecordedAt() {
    var s = getSession();
    return s ? resolveAgeRecordedAt(s) : null;
  }

  function getParentEmail() {
    var s = getSession();
    return s ? s.parentEmail : "";
  }

  function getQuestionCount() {
    var s = getSession();
    return s && s.questionCount ? s.questionCount : 10;
  }

  function createSession(studentName, age, parentEmail, language, questionCount, ageMeta) {
    ageMeta = ageMeta || {};
    var originalAge = ageMeta.originalAge != null ? ageMeta.originalAge : age;
    var ageRecordedAt = ageMeta.ageRecordedAt || new Date().toISOString();
    if (typeof AgeCalculator !== "undefined") {
      originalAge = AgeCalculator.clampChildAge(originalAge);
    }
    var session = {
      studentName: typeof Security !== "undefined" ? Security.sanitizeName(studentName) : String(studentName || "").trim(),
      childName: typeof Security !== "undefined" ? Security.sanitizeName(studentName) : String(studentName || "").trim(),
      originalAge: originalAge,
      ageRecordedAt: ageRecordedAt,
      parentEmail: String(parentEmail || "").trim(),
      language: language || "en",
      questionCount: questionCount || 10,
      loggedInAt: new Date().toISOString()
    };
    applyCalculatedAge(session);
    saveSession(session);
    return session;
  }

  function updateLanguage(language) {
    var s = getSession();
    if (!s) return null;
    s.language = language;
    saveSession(s);
    return s;
  }

  function updateQuestionCount(count) {
    var s = getSession();
    if (!s) return null;
    s.questionCount = count;
    saveSession(s);
    return s;
  }

  function updateParentEmail(email) {
    var s = getSession();
    if (!s) return null;
    s.parentEmail = String(email || "").trim();
    saveSession(s);
    return s;
  }

  function updateAge(newOriginalAge, options) {
    options = options || {};
    var s = getSession();
    if (!s) return { success: false, error: "Not logged in." };
    var original = typeof AgeCalculator !== "undefined"
      ? AgeCalculator.clampChildAge(newOriginalAge)
      : parseInt(newOriginalAge, 10);
    if (original == null || (typeof Security !== "undefined" && !Security.isValidAge(original))) {
      return { success: false, error: "Please enter a valid age (4–18)." };
    }
    s.originalAge = original;
    s.ageRecordedAt = options.ageRecordedAt || new Date().toISOString();
    applyCalculatedAge(s);
    saveSession(s);
    return { success: true, session: s };
  }

  function migrateLegacySession() {
    var s = getSession();
    if (!s) return null;
    var changed = false;
    if (s.originalAge == null && s.age != null) {
      s.originalAge = s.age;
      changed = true;
    }
    if (!s.ageRecordedAt) {
      s.ageRecordedAt = s.loggedInAt || new Date().toISOString();
      changed = true;
    }
    if (!s.childName && s.studentName) {
      s.childName = s.studentName;
      changed = true;
    }
    applyCalculatedAge(s);
    if (changed) saveSession(s);
    return s;
  }

  return {
    getSession: getSession,
    saveSession: saveSession,
    clearSession: clearSession,
    isLoggedIn: isLoggedIn,
    getStudentName: getStudentName,
    getLanguage: getLanguage,
    getAge: getAge,
    getOriginalAge: getOriginalAge,
    getAgeRecordedAt: getAgeRecordedAt,
    getCalculatedAge: getCalculatedAge,
    syncSessionAge: syncSessionAge,
    migrateLegacySession: migrateLegacySession,
    getParentEmail: getParentEmail,
    getQuestionCount: getQuestionCount,
    createSession: createSession,
    updateLanguage: updateLanguage,
    updateQuestionCount: updateQuestionCount,
    updateParentEmail: updateParentEmail,
    updateAge: updateAge
  };
})();
