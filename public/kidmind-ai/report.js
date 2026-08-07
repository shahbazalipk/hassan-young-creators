/** Quiz report and certificate generation */
var Report = (function () {
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return new Date().toLocaleDateString();
    }
  }

  function generateCertificateId() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    var rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return "CERT-" + y + m + day + "-" + rand;
  }

  function escapeHtml(str) {
    if (typeof Security !== "undefined") return Security.escapeHtml(str);
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function brandName() {
    return typeof Brand !== "undefined" ? Brand.name : "KidMind AI";
  }

  function brandCourse() {
    return typeof Brand !== "undefined" ? Brand.courseName : "KidMind AI Learning";
  }

  function brandQuiz() {
    return typeof Brand !== "undefined" ? Brand.quizName : "KidMind AI Quiz";
  }

  function brandLogo() {
    return typeof Brand !== "undefined" ? Brand.logoIcon : "assets/brand/logo-icon.svg";
  }

  function buildResultSummary(studentName, score, eligible, meta) {
    meta = meta || {};
    var pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    return {
      studentName: studentName,
      correct: score.correct,
      wrong: score.wrong,
      total: score.total,
      percentage: pct,
      certificateEligible: eligible,
      courseName: meta.courseName || brandCourse(),
      quizName: meta.quizName || brandQuiz(),
      certificateId: meta.certificateId || generateCertificateId()
    };
  }

  function renderCertificate(container, studentName, score, dateStr, meta) {
    if (!container) return;
    meta = meta || {};
    var pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
    var certId = meta.certificateId || generateCertificateId();
    container.innerHTML =
      '<div class="certificate">' +
        '<div class="certificate-inner">' +
          '<img src="' + brandLogo() + '" alt="KidMind AI" class="certificate-brand-logo" width="64" height="64">' +
          '<h2 class="certificate-title">Certificate of Achievement</h2>' +
          '<p class="certificate-subtitle">' + escapeHtml(brandName()) + '</p>' +
          '<p class="certificate-body">This certifies that</p>' +
          '<p class="certificate-name">' + escapeHtml(studentName) + '</p>' +
          '<p class="certificate-body">has successfully completed</p>' +
          '<p class="certificate-meta"><strong>Course:</strong> ' + escapeHtml(meta.courseName || brandCourse()) + '</p>' +
          '<p class="certificate-meta"><strong>Quiz:</strong> ' + escapeHtml(meta.quizName || brandQuiz()) + '</p>' +
          '<p class="certificate-score">' + score.correct + ' / ' + score.total + ' correct (' + pct + '%)</p>' +
          '<p class="certificate-date">' + escapeHtml(dateStr || formatDate(new Date().toISOString())) + '</p>' +
          '<p class="certificate-id">Certificate ID: ' + escapeHtml(certId) + '</p>' +
        '</div>' +
      '</div>';
    return certId;
  }

  function renderResultCard(container, summary) {
    if (!container) return;
    var eligible = summary.certificateEligible;
    var name = summary.studentName || "Student";
    var headline = eligible
      ? "Congratulations, " + name + "! 🎉"
      : "Great effort, " + name + "! 💪";
    container.innerHTML =
      '<div class="result-card ' + (eligible ? "result-pass" : "result-fail") + '">' +
        '<h3>' + headline + '</h3>' +
        '<p class="result-score">' + summary.correct + ' / ' + summary.total + ' correct (' + summary.percentage + '%)</p>' +
        '<p class="result-wrong">Wrong answers: ' + summary.wrong + '</p>' +
        (eligible
          ? '<p class="result-message">You earned a certificate! (max 1 wrong answer)</p>'
          : '<p class="result-message">Certificate requires at most 1 wrong answer.</p>') +
      '</div>';
  }

  function saveReport(report) {
    if (!report.certificateId && report.score && report.score.certificateEligible) {
      report.certificateId = report.score.certificateId || generateCertificateId();
    }
    var reports = DataStore.get("reports", []);
    reports.unshift(report);
    if (reports.length > 100) reports = reports.slice(0, 100);
    DataStore.set("reports", reports);
    return report;
  }

  function getReports() {
    return DataStore.get("reports", []);
  }

  function clearReports() {
    DataStore.set("reports", []);
  }

  return {
    formatDate: formatDate,
    generateCertificateId: generateCertificateId,
    buildResultSummary: buildResultSummary,
    renderCertificate: renderCertificate,
    renderResultCard: renderResultCard,
    saveReport: saveReport,
    getReports: getReports,
    clearReports: clearReports
  };
})();
