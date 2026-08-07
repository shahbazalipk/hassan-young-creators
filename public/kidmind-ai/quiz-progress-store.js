/** Active quiz progress for resume */
var QuizProgressStore = (function () {
  var STORAGE_KEY = "quiz_progress";

  function getProgress() {
    return DataStore.get(STORAGE_KEY, null);
  }

  function saveProgress(data) {
    return DataStore.set(STORAGE_KEY, data);
  }

  function clearProgress() {
    return DataStore.remove(STORAGE_KEY);
  }

  function hasActiveQuiz() {
    var p = getProgress();
    return !!(p && p.questions && p.questions.length > 0 && p.currentIndex < p.questions.length);
  }

  function startQuiz(questions, studentName, age, language, questionCount) {
    var parentEmail = "";
    if (typeof QuizSession !== "undefined" && QuizSession.isLoggedIn()) {
      parentEmail = QuizSession.getParentEmail();
    }
    var requestedCount = parseInt(questionCount, 10);
    if (isNaN(requestedCount) || requestedCount < 1) {
      requestedCount = questions.length;
    }
    var progress = {
      questions: questions,
      answers: [],
      currentIndex: 0,
      studentName: studentName,
      age: age,
      language: language,
      questionCount: requestedCount,
      requestedQuestionCount: requestedCount,
      parentEmail: parentEmail,
      courseName: typeof Brand !== "undefined" ? Brand.courseName : "KidMind AI Learning",
      quizName: typeof Brand !== "undefined" ? Brand.quizName : "KidMind AI Quiz",
      startedAt: new Date().toISOString(),
      liveScore: { correct: 0, wrong: 0, answered: 0, total: questions.length },
      completed: false
    };
    saveProgress(progress);
    return progress;
  }

  function recordAnswer(index, selectedIndex) {
    var p = getProgress();
    if (!p) return null;
    p.answers[index] = selectedIndex;
    p.currentIndex = index + 1;
    p.liveScore = computeLiveScore(p);
    saveProgress(p);
    return p;
  }

  function computeLiveScore(p) {
    if (!p || !p.questions) {
      return { correct: 0, wrong: 0, answered: 0, total: 0 };
    }
    var correct = 0;
    var wrong = 0;
    var answered = 0;
    for (var i = 0; i < p.questions.length; i++) {
      if (p.answers[i] === undefined) continue;
      answered++;
      if (typeof QuizCore !== "undefined" && QuizCore.isCorrect(p.questions[i], p.answers[i])) {
        correct++;
      } else {
        wrong++;
      }
    }
    return {
      correct: correct,
      wrong: wrong,
      answered: answered,
      total: p.questions.length
    };
  }

  function jumpToQuestion(index) {
    var p = getProgress();
    if (!p || !p.questions) return null;
    p.currentIndex = Math.max(0, Math.min(index, p.questions.length - 1));
    saveProgress(p);
    return p;
  }

  function skipQuestion() {
    var p = getProgress();
    if (!p) return null;
    var idx = p.currentIndex;
    if (p.answers[idx] === undefined) {
      p.answers[idx] = p.questions[idx].correctIndex;
    }
    p.currentIndex = idx + 1;
    saveProgress(p);
    return p;
  }

  function finishEarly() {
    var p = getProgress();
    if (!p) return null;
    for (var i = 0; i < p.questions.length; i++) {
      if (p.answers[i] === undefined) {
        p.answers[i] = p.questions[i].correctIndex;
      }
    }
    p.currentIndex = p.questions.length;
    saveProgress(p);
    return p;
  }

  function getCurrentQuestion() {
    var p = getProgress();
    if (!p || !p.questions) return null;
    return p.questions[p.currentIndex] || null;
  }

  function isComplete() {
    var p = getProgress();
    if (!p || !p.questions) return false;
    return p.currentIndex >= p.questions.length;
  }

  return {
    getProgress: getProgress,
    saveProgress: saveProgress,
    clearProgress: clearProgress,
    hasActiveQuiz: hasActiveQuiz,
    startQuiz: startQuiz,
    recordAnswer: recordAnswer,
    jumpToQuestion: jumpToQuestion,
    skipQuestion: skipQuestion,
    finishEarly: finishEarly,
    getCurrentQuestion: getCurrentQuestion,
    isComplete: isComplete,
    computeLiveScore: computeLiveScore
  };
})();
