/** Platform analytics and export helpers */
var Analytics = (function () {
  function getReports() {
    return typeof Report !== "undefined" ? Report.getReports() : [];
  }

  function uniqueStudents(reports) {
    var names = {};
    reports.forEach(function (r) {
      if (r.studentName) names[r.studentName] = true;
    });
    return Object.keys(names).length;
  }

  function getDashboardStats() {
    var reports = getReports();
    var passed = 0;
    var failed = 0;
    var certs = 0;
    reports.forEach(function (r) {
      var s = r.score || {};
      if (s.certificateEligible) {
        passed++;
        certs++;
      } else {
        failed++;
      }
    });
    return {
      totalStudents: uniqueStudents(reports),
      totalCourses: 1,
      totalQuizzes: reports.length,
      totalAttempts: reports.length,
      passedStudents: passed,
      failedStudents: failed,
      certificatesIssued: certs,
      totalQuestions: typeof QUESTION_BANK !== "undefined" ? QUESTION_BANK.length : 0
    };
  }

  function filterByPeriod(reports, days) {
    var cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return reports.filter(function (r) {
      return new Date(r.completedAt).getTime() >= cutoff;
    });
  }

  function getActivityStats() {
    var reports = getReports();
    return {
      daily: filterByPeriod(reports, 1).length,
      weekly: filterByPeriod(reports, 7).length,
      monthly: filterByPeriod(reports, 30).length
    };
  }

  function escapeCsv(val) {
    var s = String(val == null ? "" : val);
    if (s.indexOf(",") !== -1 || s.indexOf('"') !== -1 || s.indexOf("\n") !== -1) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function downloadCsv(filename, rows) {
    var csv = rows.map(function (row) {
      return row.map(escapeCsv).join(",");
    }).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportStudentReport() {
    var reports = getReports();
    var rows = [["Student Name", "Age", "Date", "Correct", "Wrong", "Total", "Percentage", "Certificate"]];
    reports.forEach(function (r) {
      var s = r.score || {};
      rows.push([
        r.studentName || "",
        r.age || "",
        r.completedAt || "",
        s.correct || 0,
        s.wrong || 0,
        s.total || 0,
        s.percentage || 0,
        s.certificateEligible ? "Yes" : "No"
      ]);
    });
    downloadCsv("student-report.csv", rows);
  }

  function exportQuizReport() {
    var reports = getReports();
    var rows = [["Quiz Date", "Student", "Score", "Passed", "Language"]];
    reports.forEach(function (r) {
      var s = r.score || {};
      rows.push([
        r.completedAt || "",
        r.studentName || "",
        (s.correct || 0) + "/" + (s.total || 0),
        s.certificateEligible ? "Yes" : "No",
        r.language || ""
      ]);
    });
    downloadCsv("quiz-report.csv", rows);
  }

  function exportCertificateReport() {
    var reports = getReports().filter(function (r) {
      return r.score && r.score.certificateEligible;
    });
    var rows = [["Student", "Certificate ID", "Score", "Percentage", "Date"]];
    reports.forEach(function (r) {
      var s = r.score || {};
      rows.push([
        r.studentName || "",
        r.certificateId || "",
        (s.correct || 0) + "/" + (s.total || 0),
        s.percentage || 0,
        r.completedAt || ""
      ]);
    });
    downloadCsv("certificate-report.csv", rows);
  }

  function exportCourseReport() {
    var rows = [["Course", "Quiz Name", "Total Questions in Bank"]];
    rows.push([
      typeof Brand !== "undefined" ? Brand.courseName : "KidMind AI Learning",
      typeof Brand !== "undefined" ? Brand.quizName : "KidMind AI Quiz",
      String(typeof QUESTION_BANK !== "undefined" ? QUESTION_BANK.length : 0)
    ]);
    downloadCsv("course-report.csv", rows);
  }

  return {
    getDashboardStats: getDashboardStats,
    getActivityStats: getActivityStats,
    exportStudentReport: exportStudentReport,
    exportQuizReport: exportQuizReport,
    exportCertificateReport: exportCertificateReport,
    exportCourseReport: exportCourseReport
  };
})();
