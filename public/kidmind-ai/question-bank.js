/** Question bank registry — built-in + admin-added questions (no code changes needed) */
var QuestionBank = (function () {
  var CUSTOM_KEY = "custom_questions";

  var DIFFICULTY_BY_AGE = {
    5: "very_easy", 6: "very_easy",
    7: "easy", 8: "easy",
    9: "medium", 10: "medium",
    11: "medium_hard", 12: "medium_hard",
    13: "advanced", 14: "advanced", 15: "advanced"
  };

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40);
  }

  function inferDifficulty(ageMin, ageMax) {
    var mid = Math.round((ageMin + ageMax) / 2);
    return DIFFICULTY_BY_AGE[mid] || "medium";
  }

  function normalize(question) {
    if (!question || !question.question) return null;
    var subject = question.subject || question.category || "General Knowledge";
    var topic = question.topic || subject;
    var ageMin = question.ageMin;
    var ageMax = question.ageMax;
    var normalized = {
      id: question.id || ("q_" + ageMin + "_" + ageMax + "_" + slugify(subject) + "_" + slugify(question.question)),
      ageMin: ageMin,
      ageMax: ageMax,
      difficulty: question.difficulty || inferDifficulty(ageMin, ageMax),
      subject: subject,
      topic: topic,
      category: question.category || subject,
      question: question.question,
      options: question.options || [],
      correctIndex: question.correctIndex,
      explanation: question.explanation || ""
    };
    return normalized;
  }

  function dedupeById(questions) {
    var seen = {};
    var out = [];
    questions.forEach(function (q) {
      if (!q || seen[q.id]) return;
      seen[q.id] = true;
      out.push(q);
    });
    return out;
  }

  function getBuiltIn() {
    var raw = typeof QUESTION_BANK_RAW !== "undefined" ? QUESTION_BANK_RAW : [];
    return dedupeById(raw.map(normalize).filter(Boolean));
  }

  function getCustom() {
    if (typeof DataStore === "undefined") return [];
    return dedupeById(DataStore.get(CUSTOM_KEY, []).map(normalize).filter(Boolean));
  }

  function getAll() {
    return dedupeById(getBuiltIn().concat(getCustom()));
  }

  function addCustom(question) {
    if (typeof DataStore === "undefined") return { success: false, error: "Storage unavailable." };
    var normalized = normalize(question);
    if (!normalized) return { success: false, error: "Invalid question." };
    if (!normalized.options || normalized.options.length < 2) {
      return { success: false, error: "At least two options required." };
    }
    if (normalized.correctIndex < 0 || normalized.correctIndex >= normalized.options.length) {
      return { success: false, error: "Invalid correct answer index." };
    }
    var list = getCustom();
    if (list.some(function (q) { return q.id === normalized.id; })) {
      return { success: false, error: "Question ID already exists." };
    }
    list.push(normalized);
    DataStore.set(CUSTOM_KEY, list);
    return { success: true, question: normalized };
  }

  function removeCustom(id) {
    if (typeof DataStore === "undefined") return false;
    var list = getCustom().filter(function (q) { return q.id !== id; });
    DataStore.set(CUSTOM_KEY, list);
    return true;
  }

  function getByAge(age) {
    if (typeof QuizCore !== "undefined" && QuizCore.filterByAge) {
      return QuizCore.filterByAge(getAll(), age);
    }
    return getAll().filter(function (q) {
      return age >= q.ageMin && age <= q.ageMax;
    });
  }

  function getStats() {
    var all = getAll();
    var byDifficulty = {};
    var bySubject = {};
    all.forEach(function (q) {
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
      bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
    });
    return {
      total: all.length,
      builtIn: getBuiltIn().length,
      custom: getCustom().length,
      byDifficulty: byDifficulty,
      bySubject: bySubject
    };
  }

  function getAgeTier(age) {
    var n = parseInt(age, 10);
    if (n >= 5 && n <= 6) return { label: "5–6 years", min: 5, max: 6, difficulty: "very_easy" };
    if (n >= 7 && n <= 8) return { label: "7–8 years", min: 7, max: 8, difficulty: "easy" };
    if (n >= 9 && n <= 10) return { label: "9–10 years", min: 9, max: 10, difficulty: "medium" };
    if (n >= 11 && n <= 12) return { label: "11–12 years", min: 11, max: 12, difficulty: "medium_hard" };
    if (n >= 13 && n <= 15) return { label: "13–15 years", min: 13, max: 15, difficulty: "advanced" };
    return null;
  }

  return {
    CUSTOM_KEY: CUSTOM_KEY,
    normalize: normalize,
    getBuiltIn: getBuiltIn,
    getCustom: getCustom,
    getAll: getAll,
    addCustom: addCustom,
    removeCustom: removeCustom,
    getByAge: getByAge,
    getStats: getStats,
    getAgeTier: getAgeTier,
    inferDifficulty: inferDifficulty
  };
})();
