/** Input validation, password hashing, and XSS helpers */
var Security = (function () {
  var PASSWORD_SALT = "kidmind_ai_v1";

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function sanitizeName(name) {
    return String(name || "").trim().replace(/[<>]/g, "").slice(0, 80);
  }

  function isValidAge(age) {
    var n = parseInt(age, 10);
    return !isNaN(n) && n >= 4 && n <= 18;
  }

  function isValidQuestionCount(count) {
    var n = parseInt(count, 10);
    return [10, 15, 30, 60, 90].indexOf(n) !== -1;
  }

  function normalizeQuestionCount(count, fallback) {
    var n = parseInt(count, 10);
    if (isValidQuestionCount(n)) return n;
    if (fallback != null && isValidQuestionCount(fallback)) return fallback;
    return 10;
  }

  function requireQuestionCount(count) {
    var n = parseInt(count, 10);
    return isValidQuestionCount(n) ? n : null;
  }

  function isValidPassword(password) {
    return String(password || "").length >= 8;
  }

  function isHashed(value) {
    return String(value || "").indexOf("sha256:") === 0;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function fallbackHash(password) {
    var input = PASSWORD_SALT + String(password || "");
    var h = 5381;
    for (var i = 0; i < input.length; i++) {
      h = ((h << 5) + h) + input.charCodeAt(i);
      h = h & h;
    }
    for (var r = 0; r < 1000; r++) {
      var s = PASSWORD_SALT + r + ":" + (h >>> 0).toString(36) + input;
      h = 5381;
      for (var j = 0; j < s.length; j++) {
        h = ((h << 5) + h) + s.charCodeAt(j);
        h = h & h;
      }
    }
    return "sha256:fallback:" + (h >>> 0).toString(16);
  }

  function hashPasswordSync(password) {
    return fallbackHash(password);
  }

  function hashPassword(password) {
    var salted = PASSWORD_SALT + String(password || "");
    if (typeof crypto !== "undefined" && crypto.subtle && typeof TextEncoder !== "undefined") {
      var enc = new TextEncoder().encode(salted);
      return crypto.subtle.digest("SHA-256", enc).then(function (buf) {
        return "sha256:" + bytesToHex(new Uint8Array(buf));
      }).catch(function () {
        return hashPasswordSync(password);
      });
    }
    return Promise.resolve(hashPasswordSync(password));
  }

  function verifyPasswordSync(plain, stored) {
    if (!stored) return false;
    if (!isHashed(stored)) {
      return stored === String(plain || "");
    }
    var expected = hashPasswordSync(plain);
    if (stored === expected) return true;
    if (stored.indexOf("sha256:fallback:") === 0) {
      return stored === fallbackHash(plain);
    }
    return false;
  }

  function verifyPassword(plain, stored) {
    if (!stored) return Promise.resolve(false);
    if (!isHashed(stored)) {
      return Promise.resolve(stored === String(plain || ""));
    }
    if (stored.indexOf("sha256:fallback:") === 0) {
      return Promise.resolve(stored === fallbackHash(plain));
    }
    var salted = PASSWORD_SALT + String(plain || "");
    if (typeof crypto !== "undefined" && crypto.subtle && typeof TextEncoder !== "undefined") {
      var enc = new TextEncoder().encode(salted);
      return crypto.subtle.digest("SHA-256", enc).then(function (buf) {
        return stored === "sha256:" + bytesToHex(new Uint8Array(buf));
      }).catch(function () {
        return verifyPasswordSync(plain, stored);
      });
    }
    return Promise.resolve(verifyPasswordSync(plain, stored));
  }

  return {
    escapeHtml: escapeHtml,
    isValidEmail: isValidEmail,
    sanitizeName: sanitizeName,
    isValidAge: isValidAge,
    isValidQuestionCount: isValidQuestionCount,
    normalizeQuestionCount: normalizeQuestionCount,
    requireQuestionCount: requireQuestionCount,
    isValidPassword: isValidPassword,
    isHashed: isHashed,
    hashPassword: hashPassword,
    hashPasswordSync: hashPasswordSync,
    verifyPassword: verifyPassword,
    verifyPasswordSync: verifyPasswordSync
  };
})();
