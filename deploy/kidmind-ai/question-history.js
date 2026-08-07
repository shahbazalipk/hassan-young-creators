/** Tracks recently used questions per student to reduce repetition across attempts */
var QuestionHistory = (function () {
  var STORAGE_KEY = "question_history";
  var MAX_HISTORY = 300;

  function studentKey(name, email) {
    return String(email || "").trim().toLowerCase() + "|" + String(name || "").trim().toLowerCase();
  }

  function keyFromSession() {
    if (typeof QuizSession === "undefined" || !QuizSession.isLoggedIn()) return "";
    return studentKey(QuizSession.getStudentName(), QuizSession.getParentEmail());
  }

  function getAllHistory() {
    if (typeof DataStore === "undefined") return {};
    return DataStore.get(STORAGE_KEY, {});
  }

  function getHistory(key) {
    if (!key) return [];
    var all = getAllHistory();
    return Array.isArray(all[key]) ? all[key] : [];
  }

  function saveHistory(key, ids) {
    if (!key || typeof DataStore === "undefined") return;
    var all = getAllHistory();
    all[key] = ids.slice(-MAX_HISTORY);
    DataStore.set(STORAGE_KEY, all);
  }

  function recordUsed(key, questionIds) {
    if (!key || !questionIds || !questionIds.length) return;
    var hist = getHistory(key);
    questionIds.forEach(function (id) {
      if (id && hist.indexOf(id) === -1) hist.push(id);
    });
    if (hist.length > MAX_HISTORY) hist = hist.slice(-MAX_HISTORY);
    saveHistory(key, hist);
  }

  function recordFromQuestions(key, questions) {
    if (!questions || !questions.length) return;
    recordUsed(key, questions.map(function (q) { return q.id; }).filter(Boolean));
  }

  function getRecentIdMap(key) {
    var map = {};
    getHistory(key).forEach(function (id) { map[id] = true; });
    return map;
  }

  function clearHistory(key) {
    if (!key || typeof DataStore === "undefined") return;
    var all = getAllHistory();
    delete all[key];
    DataStore.set(STORAGE_KEY, all);
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    MAX_HISTORY: MAX_HISTORY,
    studentKey: studentKey,
    keyFromSession: keyFromSession,
    getHistory: getHistory,
    recordUsed: recordUsed,
    recordFromQuestions: recordFromQuestions,
    getRecentIdMap: getRecentIdMap,
    clearHistory: clearHistory
  };
})();
