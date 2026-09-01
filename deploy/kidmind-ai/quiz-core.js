/** Core quiz logic — age-based selection, scoring, certificate eligibility */
var QuizCore = (function () {
  var QUESTIONS_PER_QUIZ = 10;
  var MAX_WRONG_FOR_CERTIFICATE = 1;
  var VALID_QUESTION_COUNTS = [10, 15, 30, 60, 90];

  var AGE_TIERS = [
    { id: "4-6", label: "4–6 years", min: 4, max: 6, difficulty: "very_easy", difficulties: ["very_easy"] },
    { id: "7-9", label: "7–9 years", min: 7, max: 9, difficulty: "easy", difficulties: ["easy"] },
    { id: "10-12", label: "10–12 years", min: 10, max: 12, difficulty: "moderate", difficulties: ["medium", "moderate", "medium_hard"] },
    { id: "13-15", label: "13–15 years", min: 13, max: 15, difficulty: "intermediate", difficulties: ["advanced", "intermediate"] },
    { id: "16+", label: "16+ years", min: 16, max: 120, difficulty: "advanced", difficulties: ["advanced"] }
  ];

  function getAgeTier(age) {
    var n = parseInt(age, 10);
    for (var i = 0; i < AGE_TIERS.length; i++) {
      if (n >= AGE_TIERS[i].min && n <= AGE_TIERS[i].max) return AGE_TIERS[i];
    }
    return null;
  }

  function getQuestionKey(q) {
    if (!q) return "";
    if (q.id) return String(q.id);
    return String(q.question || "") + "|" + String(q.category || q.subject || "");
  }

  function normalizeQuestionText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function filterByAge(questions, age) {
    if (!questions || !questions.length) return [];
    var tier = getAgeTier(age);
    if (!tier) return [];
    var allowed = {};
    (tier.difficulties || [tier.difficulty]).forEach(function (d) {
      allowed[d] = true;
    });
    return questions.filter(function (q) {
      if (!q) return false;
      if (q.difficulty && !allowed[q.difficulty]) return false;
      // Never serve questions written for older children than the learner.
      if (typeof q.ageMin === "number" && age < q.ageMin) return false;
      return true;
    });
  }

  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function dedupeQuestions(questions) {
    var seen = {};
    var out = [];
    questions.forEach(function (q) {
      var key = getQuestionKey(q);
      if (!key || seen[key]) return;
      seen[key] = true;
      out.push(q);
    });
    return out;
  }

  function partitionPool(pool, recentIds) {
    var fresh = [];
    var stale = [];
    pool.forEach(function (q) {
      if (recentIds && recentIds[q.id]) stale.push(q);
      else fresh.push(q);
    });
    return { fresh: fresh, stale: stale };
  }

  function pickFromPools(fresh, stale, count, excludeKeys) {
    var selected = [];
    var usedKeys = {};

    function takeFrom(list) {
      var shuffled = shuffle(list);
      for (var i = 0; i < shuffled.length && selected.length < count; i++) {
        var q = shuffled[i];
        var key = getQuestionKey(q);
        if (excludeKeys[key] || usedKeys[key]) continue;
        usedKeys[key] = true;
        selected.push(q);
      }
    }

    takeFrom(fresh);
    if (selected.length < count) takeFrom(stale);
    return selected;
  }

  function normalizeCount(count) {
    var n = parseInt(count, 10);
    if (isNaN(n) || n < 1) return QUESTIONS_PER_QUIZ;
    return n;
  }

  function selectSmartQuestions(questionBank, age, count, options) {
    options = options || {};
    count = normalizeCount(count || QUESTIONS_PER_QUIZ);
    var excludeKeys = options.excludeKeys || {};
    var recentIds = options.recentIds || {};
    var pool = dedupeQuestions(filterByAge(questionBank, age)).filter(function (q) {
      return !excludeKeys[getQuestionKey(q)];
    });
    if (pool.length === 0) {
      return { questions: [], requestedCount: count, availableCount: 0 };
    }

    var parts = partitionPool(pool, recentIds);
    var selected = pickFromPools(parts.fresh, parts.stale, count, excludeKeys);
    if (selected.length > count) {
      selected = selected.slice(0, count);
    }
    return {
      questions: shuffle(selected),
      requestedCount: count,
      availableCount: pool.length
    };
  }

  function selectQuestions(questionBank, age, count, options) {
    if (options && (options.recentIds || options.excludeKeys)) {
      return selectSmartQuestions(questionBank, age, count, options);
    }
    return selectSmartQuestions(questionBank, age, count, {
      excludeKeys: typeof options === "object" && options ? options : {},
      recentIds: {}
    });
  }

  function selectUniqueQuestions(questionBank, age, count, excludeKeys) {
    var result = selectSmartQuestions(questionBank, age, count, {
      excludeKeys: excludeKeys || {},
      recentIds: {}
    });
    return result.questions;
  }

  function isCorrect(question, selectedIndex) {
    return selectedIndex === question.correctIndex;
  }

  function calculateScore(answers, questions) {
    var correct = 0;
    var wrong = 0;
    for (var i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIndex) {
        correct++;
      } else if (answers[i] !== undefined && answers[i] !== null) {
        wrong++;
      }
    }
    return { correct: correct, wrong: wrong, total: questions.length };
  }

  function isCertificateEligible(wrongAnswers) {
    return wrongAnswers <= MAX_WRONG_FOR_CERTIFICATE;
  }

  function getPassingMarks(total) {
    return Math.max(0, total - MAX_WRONG_FOR_CERTIFICATE);
  }

  function getCategories(questionBank, age) {
    var pool = filterByAge(questionBank, age);
    var cats = {};
    pool.forEach(function (q) { cats[q.category || q.subject] = true; });
    return Object.keys(cats).sort();
  }

  function getSubjects(questionBank, age) {
    var pool = filterByAge(questionBank, age);
    var subs = {};
    pool.forEach(function (q) { subs[q.subject || q.category] = true; });
    return Object.keys(subs).sort();
  }

  function getAgeGroups() {
    return AGE_TIERS.map(function (t) {
      return { label: t.label, min: t.min, max: t.max, difficulty: t.difficulty };
    });
  }

  function hasDuplicateQuestions(questions) {
    var seen = {};
    for (var i = 0; i < questions.length; i++) {
      var key = getQuestionKey(questions[i]);
      if (seen[key]) return true;
      seen[key] = true;
    }
    return false;
  }

  return {
    QUESTIONS_PER_QUIZ: QUESTIONS_PER_QUIZ,
    MAX_WRONG_FOR_CERTIFICATE: MAX_WRONG_FOR_CERTIFICATE,
    VALID_QUESTION_COUNTS: VALID_QUESTION_COUNTS,
    AGE_TIERS: AGE_TIERS,
    getAgeTier: getAgeTier,
    getQuestionKey: getQuestionKey,
    filterByAge: filterByAge,
    normalizeCount: normalizeCount,
    selectQuestions: selectQuestions,
    selectSmartQuestions: selectSmartQuestions,
    selectUniqueQuestions: selectUniqueQuestions,
    isCorrect: isCorrect,
    calculateScore: calculateScore,
    isCertificateEligible: isCertificateEligible,
    getPassingMarks: getPassingMarks,
    getCategories: getCategories,
    getSubjects: getSubjects,
    getAgeGroups: getAgeGroups,
    hasDuplicateQuestions: hasDuplicateQuestions,
    shuffle: shuffle,
    dedupeQuestions: dedupeQuestions
  };
})();
