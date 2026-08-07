/** Certificate save, download, print, and view-later */
var CertificateSave = (function () {
  var STORAGE_KEY = "saved_certificates";
  var RENDER_SCALE = 3;
  var CANVAS_W = 1100;
  var CANVAS_H = 780;

  function safeFileName(name) {
    var cleaned = String(name || "Student").trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return cleaned || "Student";
  }

  function getFilename(ext, studentName) {
    return "KidMind-AI-Certificate-" + safeFileName(studentName) + "." + ext;
  }

  function wrapText(ctx, text, maxWidth) {
    var words = String(text || "").split(" ");
    var lines = [];
    var line = "";
    words.forEach(function (word) {
      var test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawCenteredText(ctx, text, x, y, font, color) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(text, x, y);
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("Could not load image")); };
      img.src = src;
    });
  }

  function getLogoSrc() {
    if (typeof Brand !== "undefined" && Brand.appIcon) return Brand.appIcon;
    return "assets/brand/app-icon.svg";
  }

  function buildMeta(summary, dateStr) {
    summary = summary || {};
    return {
      studentName: summary.studentName || "Student",
      correct: summary.correct || 0,
      total: summary.total || 0,
      percentage: summary.percentage || 0,
      courseName: summary.courseName || (typeof Brand !== "undefined" ? Brand.courseName : "KidMind AI Learning"),
      quizName: summary.quizName || (typeof Brand !== "undefined" ? Brand.quizName : "KidMind AI Quiz"),
      certificateId: summary.certificateId || (typeof Report !== "undefined" ? Report.generateCertificateId() : "CERT"),
      dateStr: dateStr || (typeof Report !== "undefined" ? Report.formatDate(new Date().toISOString()) : ""),
      brandName: typeof Brand !== "undefined" ? Brand.name : "KidMind AI"
    };
  }

  async function renderToCanvas(meta) {
    meta = meta || {};
    var canvas = document.createElement("canvas");
    canvas.width = CANVAS_W * RENDER_SCALE;
    canvas.height = CANVAS_H * RENDER_SCALE;
    var ctx = canvas.getContext("2d");
    ctx.scale(RENDER_SCALE, RENDER_SCALE);

    var grad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    grad.addColorStop(0, "#8b5cf6");
    grad.addColorStop(0.5, "#6d28d9");
    grad.addColorStop(1, "#f59e0b");
    ctx.fillStyle = grad;
    roundRect(ctx, 20, 20, CANVAS_W - 40, CANVAS_H - 40, 18);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 36, 36, CANVAS_W - 72, CANVAS_H - 72, 14);
    ctx.fill();

    var cx = CANVAS_W / 2;
    var y = 70;

    try {
      var logo = await loadImage(getLogoSrc());
      var logoSize = 72;
      ctx.drawImage(logo, cx - logoSize / 2, y, logoSize, logoSize);
      y += logoSize + 18;
    } catch (e) {
      y += 10;
    }

    drawCenteredText(ctx, "Certificate of Achievement", cx, y, "bold 42px 'Plus Jakarta Sans', Arial, sans-serif", "#6d28d9");
    y += 52;
    drawCenteredText(ctx, String(meta.brandName || "KidMind AI").toUpperCase(), cx, y, "600 18px 'Plus Jakarta Sans', Arial, sans-serif", "#5a5a7a");
    y += 44;
    drawCenteredText(ctx, "This certifies that", cx, y, "18px 'Plus Jakarta Sans', Arial, sans-serif", "#5a5a7a");
    y += 34;
    drawCenteredText(ctx, String(meta.studentName || "Student"), cx, y, "italic bold 48px 'Plus Jakarta Sans', Georgia, serif", "#1a1a2e");
    y += 62;
    drawCenteredText(ctx, "has successfully completed", cx, y, "18px 'Plus Jakarta Sans', Arial, sans-serif", "#5a5a7a");
    y += 36;
    drawCenteredText(ctx, "Course: " + String(meta.courseName || ""), cx, y, "600 20px 'Plus Jakarta Sans', Arial, sans-serif", "#5a5a7a");
    y += 30;
    drawCenteredText(ctx, "Quiz: " + String(meta.quizName || ""), cx, y, "600 20px 'Plus Jakarta Sans', Arial, sans-serif", "#5a5a7a");
    y += 40;
    var scoreText = meta.correct + " / " + meta.total + " correct (" + (meta.percentage || 0) + "%)";
    drawCenteredText(ctx, scoreText, cx, y, "bold 26px 'Plus Jakarta Sans', Arial, sans-serif", "#6d28d9");
    y += 50;

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 220, y);
    ctx.lineTo(cx + 220, y);
    ctx.stroke();
    y += 22;

    drawCenteredText(ctx, String(meta.dateStr || ""), cx, y, "16px 'Plus Jakarta Sans', Arial, sans-serif", "#5a5a7a");
    y += 28;
    drawCenteredText(ctx, "Certificate ID: " + String(meta.certificateId || ""), cx, y, "600 15px 'Plus Jakarta Sans', Arial, sans-serif", "#6d28d9");

    return canvas;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) { resolve(blob); }, "image/png", 1);
    });
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function canShareFiles() {
    if (typeof navigator === "undefined" || !navigator.canShare || !navigator.share) return false;
    try {
      var testFile = new File(["x"], "test.png", { type: "image/png" });
      return navigator.canShare({ files: [testFile] });
    } catch (e) {
      return false;
    }
  }

  function showMessage(text, isError) {
    if (typeof document === "undefined" || !document.getElementById) return;
    var el = document.getElementById("certificate-save-message");
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("hidden", !text);
    el.classList.toggle("certificate-save-message--error", !!isError);
    el.classList.toggle("certificate-save-message--success", !isError && !!text);
  }

  function hideMessage() {
    showMessage("", false);
  }

  function showCertificateActions(show) {
    if (typeof document === "undefined" || !document.getElementById) return;
    var actions = document.getElementById("certificate-actions");
    if (actions) actions.classList.toggle("hidden", !show);
  }

  async function getBlobFromSummary(summary, dateStr) {
    var meta = buildMeta(summary, dateStr);
    var canvas = await renderToCanvas(meta);
    return canvasToBlob(canvas);
  }

  async function saveCertificate(summary, dateStr) {
    hideMessage();
    var meta = buildMeta(summary, dateStr);
    var blob = await getBlobFromSummary(summary, dateStr);
    if (!blob) {
      showMessage("Could not create certificate image.", true);
      return { success: false };
    }

    var filename = getFilename("png", meta.studentName);

    if (canShareFiles()) {
      try {
        var file = new File([blob], filename, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: "KidMind AI Certificate",
          text: "Certificate for " + meta.studentName
        });
        showMessage("Certificate saved successfully.");
        return { success: true, method: "share" };
      } catch (e) {
        if (e && e.name === "AbortError") {
          return { success: false, cancelled: true };
        }
      }
    }

    downloadBlob(blob, filename);
    showMessage("Your browser does not support direct gallery saving, so the certificate has been downloaded.");
    return { success: true, method: "download" };
  }

  async function downloadCertificate(summary, dateStr) {
    hideMessage();
    var meta = buildMeta(summary, dateStr);
    var blob = await getBlobFromSummary(summary, dateStr);
    if (!blob) {
      showMessage("Could not create certificate file.", true);
      return { success: false };
    }
    downloadBlob(blob, getFilename("png", meta.studentName));
    return { success: true };
  }

  function printCertificate() {
    hideMessage();
    document.body.classList.add("printing-certificate");
    window.print();
    setTimeout(function () {
      document.body.classList.remove("printing-certificate");
    }, 500);
    return { success: true };
  }

  function saveForLater(summary, dateStr) {
    hideMessage();
    var meta = buildMeta(summary, dateStr);
    var list = DataStore.get(STORAGE_KEY, []);
    var entry = {
      id: meta.certificateId,
      studentName: meta.studentName,
      correct: meta.correct,
      total: meta.total,
      percentage: meta.percentage,
      courseName: meta.courseName,
      quizName: meta.quizName,
      dateStr: meta.dateStr,
      savedAt: new Date().toISOString()
    };

    var existing = list.findIndex(function (c) { return c.id === entry.id; });
    if (existing >= 0) list[existing] = entry;
    else list.unshift(entry);
    if (list.length > 50) list = list.slice(0, 50);
    DataStore.set(STORAGE_KEY, list);

    showMessage("Certificate saved to My Certificates.");
    return { success: true, entry: entry };
  }

  function getSavedCertificates() {
    return DataStore.get(STORAGE_KEY, []);
  }

  function getSavedForStudent(studentName) {
    var key = safeFileName(studentName).toLowerCase();
    return getSavedCertificates().filter(function (c) {
      return safeFileName(c.studentName).toLowerCase() === key;
    });
  }

  function bindEvents(getSummaryFn) {
    var saveBtn = document.getElementById("cert-save-btn");
    var downloadBtn = document.getElementById("cert-download-btn");
    var printBtn = document.getElementById("cert-print-btn");
    var viewLaterBtn = document.getElementById("cert-view-later-btn");

    function getCtx() {
      var summary = getSummaryFn ? getSummaryFn() : window._lastSummary;
      var dateStr = window._certificateDateStr || (typeof Report !== "undefined"
        ? Report.formatDate(new Date().toISOString()) : "");
      return { summary: summary, dateStr: dateStr };
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var ctx = getCtx();
        if (!ctx.summary || !ctx.summary.certificateEligible) return;
        saveCertificate(ctx.summary, ctx.dateStr);
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener("click", function () {
        var ctx = getCtx();
        if (!ctx.summary || !ctx.summary.certificateEligible) return;
        downloadCertificate(ctx.summary, ctx.dateStr);
      });
    }

    if (printBtn) {
      printBtn.addEventListener("click", function () {
        var ctx = getCtx();
        if (!ctx.summary || !ctx.summary.certificateEligible) return;
        printCertificate();
      });
    }

    if (viewLaterBtn) {
      viewLaterBtn.addEventListener("click", function () {
        var ctx = getCtx();
        if (!ctx.summary || !ctx.summary.certificateEligible) return;
        saveForLater(ctx.summary, ctx.dateStr);
        if (typeof window.showCertificatesScreen === "function") {
          setTimeout(function () { window.showCertificatesScreen(); }, 600);
        }
      });
    }
  }

  return {
    safeFileName: safeFileName,
    getFilename: getFilename,
    buildMeta: buildMeta,
    renderToCanvas: renderToCanvas,
    saveCertificate: saveCertificate,
    downloadCertificate: downloadCertificate,
    printCertificate: printCertificate,
    saveForLater: saveForLater,
    getSavedCertificates: getSavedCertificates,
    getSavedForStudent: getSavedForStudent,
    showCertificateActions: showCertificateActions,
    showMessage: showMessage,
    hideMessage: hideMessage,
    bindEvents: bindEvents,
    canShareFiles: canShareFiles
  };
})();
