/** Parent/student account persistence for returning logins */
var AccountStore = (function () {
  var STORAGE_KEY = "accounts";

  function getAccounts() {
    return DataStore.get(STORAGE_KEY, []);
  }

  function saveAccounts(list) {
    DataStore.set(STORAGE_KEY, list);
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function findByEmail(email) {
    var key = normalizeEmail(email);
    return getAccounts().find(function (a) {
      return normalizeEmail(a.email) === key;
    }) || null;
  }

  function emailExists(email, exceptEmail) {
    var key = normalizeEmail(email);
    var except = exceptEmail ? normalizeEmail(exceptEmail) : "";
    return getAccounts().some(function (a) {
      var accountKey = normalizeEmail(a.email);
      if (except && accountKey === except) return false;
      return accountKey === key;
    });
  }

  function storePassword(password) {
    if (typeof Security !== "undefined" && Security.isHashed(password)) {
      return password;
    }
    return typeof Security !== "undefined"
      ? Security.hashPasswordSync(password)
      : String(password || "");
  }

  function getCalculatedAge(account) {
    if (!account) return null;
    var original = account.originalAge != null ? account.originalAge : account.age;
    var recorded = account.ageRecordedAt || account.updatedAt || account.createdAt;
    if (typeof AgeCalculator !== "undefined" && recorded != null) {
      return AgeCalculator.calculateCurrentAge(original, recorded);
    }
    return original;
  }

  function saveAccount(email, password, profile) {
    var list = getAccounts();
    var key = normalizeEmail(email);
    var existing = list.findIndex(function (a) {
      return normalizeEmail(a.email) === key;
    });
    var now = new Date().toISOString();
    var originalAge = profile.originalAge != null ? profile.originalAge : profile.age;
    var ageRecordedAt = profile.ageRecordedAt || now;
    if (typeof AgeCalculator !== "undefined") {
      originalAge = AgeCalculator.clampChildAge(originalAge);
    }
    var calculatedAge = typeof AgeCalculator !== "undefined"
      ? AgeCalculator.calculateCurrentAge(originalAge, ageRecordedAt)
      : originalAge;
    var record = {
      email: String(email || "").trim(),
      password: storePassword(password),
      studentName: profile.studentName,
      childName: profile.studentName,
      originalAge: originalAge,
      ageRecordedAt: ageRecordedAt,
      age: calculatedAge,
      calculatedCurrentAge: calculatedAge,
      language: profile.language || "en",
      questionCount: profile.questionCount || 10,
      createdAt: existing >= 0 ? (list[existing].createdAt || now) : now,
      updatedAt: now
    };
    if (existing >= 0) list[existing] = record;
    else list.push(record);
    saveAccounts(list);
    return record;
  }

  function verifyAccountPassword(account, password) {
    if (!account) return false;
    if (typeof Security !== "undefined") {
      return Security.verifyPasswordSync(password, account.password);
    }
    return account.password === String(password || "");
  }

  function authenticate(email, password) {
    var account = findByEmail(email);
    if (!account) return null;
    if (!verifyAccountPassword(account, password)) return null;

    if (typeof Security !== "undefined" && !Security.isHashed(account.password)) {
      account.password = Security.hashPasswordSync(password);
      var list = getAccounts();
      var idx = list.findIndex(function (a) {
        return normalizeEmail(a.email) === normalizeEmail(email);
      });
      if (idx >= 0) {
        list[idx] = account;
        saveAccounts(list);
      }
    }
    return account;
  }

  function updateAccount(currentEmail, currentPassword, updates) {
    var account = findByEmail(currentEmail);
    if (!account) {
      return { success: false, error: "Account not found." };
    }
    if (!verifyAccountPassword(account, currentPassword)) {
      return { success: false, error: "Current password is incorrect." };
    }

    var nextEmail = updates.email != null
      ? String(updates.email).trim()
      : account.email;
    var nextPassword = updates.password != null
      ? String(updates.password)
      : null;

    if (typeof Security !== "undefined" && !Security.isValidEmail(nextEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (emailExists(nextEmail, currentEmail)) {
      return { success: false, error: "This email is already registered to another account." };
    }

    if (nextPassword != null) {
      if (typeof Security !== "undefined" && !Security.isValidPassword(nextPassword)) {
        return { success: false, error: "Password must be at least 8 characters." };
      }
    }

    var list = getAccounts();
    var idx = list.findIndex(function (a) {
      return normalizeEmail(a.email) === normalizeEmail(currentEmail);
    });
    if (idx < 0) {
      return { success: false, error: "Account not found." };
    }

    var updated = Object.assign({}, account, {
      email: nextEmail,
      updatedAt: new Date().toISOString()
    });

    if (updates.originalAge != null) {
      var nextOriginal = updates.originalAge;
      if (typeof AgeCalculator !== "undefined") {
        nextOriginal = AgeCalculator.clampChildAge(nextOriginal);
      }
      if (nextOriginal == null || (typeof Security !== "undefined" && !Security.isValidAge(nextOriginal))) {
        return { success: false, error: "Please enter a valid age (5–15)." };
      }
      updated.originalAge = nextOriginal;
      updated.ageRecordedAt = updates.ageRecordedAt || new Date().toISOString();
      updated.calculatedCurrentAge = typeof AgeCalculator !== "undefined"
        ? AgeCalculator.calculateCurrentAge(updated.originalAge, updated.ageRecordedAt)
        : updated.originalAge;
      updated.age = updated.calculatedCurrentAge;
    }

    if (nextPassword != null) {
      updated.password = storePassword(nextPassword);
    }

    list[idx] = updated;
    saveAccounts(list);

    return { success: true, account: updated };
  }

  function updateQuestionCount(email, count) {
    var n = parseInt(count, 10);
    if (isNaN(n)) return false;
    var list = getAccounts();
    var idx = list.findIndex(function (a) {
      return normalizeEmail(a.email) === normalizeEmail(email);
    });
    if (idx < 0) return false;
    list[idx] = Object.assign({}, list[idx], {
      questionCount: n,
      updatedAt: new Date().toISOString()
    });
    saveAccounts(list);
    return true;
  }

  return {
    saveAccount: saveAccount,
    authenticate: authenticate,
    getAccounts: getAccounts,
    findByEmail: findByEmail,
    emailExists: emailExists,
    updateAccount: updateAccount,
    updateQuestionCount: updateQuestionCount,
    verifyAccountPassword: verifyAccountPassword,
    getCalculatedAge: getCalculatedAge
  };
})();
