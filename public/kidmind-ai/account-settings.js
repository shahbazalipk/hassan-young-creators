/** Account Settings — view/edit parent email and password */
var AccountSettings = (function () {
  var editing = false;

  function $(id) {
    return document.getElementById(id);
  }

  function isAdminUser() {
    return typeof AdminSession !== "undefined" && AdminSession.isOwnerAdmin();
  }

  function showError(msg) {
    var el = $("settings-error");
    var ok = $("settings-success");
    if (ok) ok.classList.add("hidden");
    if (el) {
      el.textContent = msg || "";
      el.classList.toggle("hidden", !msg);
    }
  }

  function showSuccess(msg) {
    var el = $("settings-success");
    var err = $("settings-error");
    if (err) err.classList.add("hidden");
    if (el) {
      el.textContent = msg || "Account updated successfully.";
      el.classList.remove("hidden");
    }
  }

  function hideMessages() {
    var err = $("settings-error");
    var ok = $("settings-success");
    if (err) err.classList.add("hidden");
    if (ok) ok.classList.add("hidden");
  }

  function setEditMode(on) {
    editing = !!on;
    var view = $("settings-view-mode");
    var form = $("settings-edit-form");
    if (view) view.classList.toggle("hidden", editing);
    if (form) form.classList.toggle("hidden", !editing);
    if (editing) {
      hideMessages();
      populateEditForm();
    }
  }

  function populateEditForm() {
    var emailInput = $("settings-email-input");
    var ageInput = $("settings-age-input");
    var newPass = $("settings-new-password");
    var confirmPass = $("settings-confirm-password");
    var currentPass = $("settings-current-password");
    if (emailInput) emailInput.value = QuizSession.getParentEmail() || "";
    if (ageInput) ageInput.value = "";
    if (newPass) newPass.value = "";
    if (confirmPass) confirmPass.value = "";
    if (currentPass) currentPass.value = "";
  }

  function renderViewMode() {
    var nameEl = $("settings-name-display");
    var originalAgeEl = $("settings-original-age-display");
    var currentAgeEl = $("settings-current-age-display");
    var ageDateEl = $("settings-age-date-display");
    var emailEl = $("settings-email-display");
    if (nameEl) nameEl.textContent = QuizSession.getStudentName() || "—";
    if (originalAgeEl) {
      originalAgeEl.textContent = QuizSession.getOriginalAge() != null ? QuizSession.getOriginalAge() : "—";
    }
    if (currentAgeEl) {
      currentAgeEl.textContent = QuizSession.getAge() != null ? QuizSession.getAge() : "—";
    }
    if (ageDateEl) {
      var recorded = QuizSession.getAgeRecordedAt();
      ageDateEl.textContent = typeof AgeCalculator !== "undefined"
        ? AgeCalculator.formatDisplayDate(recorded)
        : (recorded || "—");
    }
    if (emailEl) emailEl.textContent = QuizSession.getParentEmail() || "—";
    setEditMode(false);
  }

  function togglePasswordVisibility(btn) {
    if (!btn) return;
    var wrap = btn.closest(".password-field");
    if (!wrap) return;
    var input = wrap.querySelector("input");
    if (!input) return;
    var show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "Hide" : "Show";
    btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
  }

  function validateForm(email, newPassword, confirmPassword, currentPassword) {
    if (!Security.isValidEmail(email)) {
      return "Please enter a valid email address.";
    }
    if (!currentPassword) {
      return "Please enter your current password.";
    }
    if (newPassword) {
      if (!Security.isValidPassword(newPassword)) {
        return "Password must be at least 8 characters.";
      }
      if (newPassword !== confirmPassword) {
        return "Confirm password does not match.";
      }
    } else if (confirmPassword) {
      return "Please enter a new password or clear the confirm field.";
    }
    return null;
  }

  function updateStudentAccount(currentEmail, currentPassword, email, newPassword, newAge) {
    var updates = { email: email };
    if (newPassword) updates.password = newPassword;
    if (newAge != null && newAge !== "") {
      updates.originalAge = parseInt(newAge, 10);
      updates.ageRecordedAt = new Date().toISOString();
    }

    var result = AccountStore.updateAccount(currentEmail, currentPassword, updates);
    if (!result.success) return result;

    QuizSession.updateParentEmail(result.account.email);
    if (newAge != null && newAge !== "") {
      QuizSession.updateAge(parseInt(newAge, 10), {
        ageRecordedAt: result.account.ageRecordedAt
      });
    } else if (typeof QuizSession.syncSessionAge === "function") {
      QuizSession.syncSessionAge();
    }
    return result;
  }

  function updateAdminAccount(currentEmail, currentPassword, email, newPassword, newAge) {
    var adminUpdates = { email: email };
    if (newPassword) adminUpdates.password = newPassword;

    var adminResult = AdminCredentials.updateCredentials(currentPassword, adminUpdates);
    if (!adminResult.success) return adminResult;

    var updates = { email: email };
    if (newPassword) updates.password = newPassword;
    if (newAge != null && newAge !== "") {
      updates.originalAge = parseInt(newAge, 10);
      updates.ageRecordedAt = new Date().toISOString();
    }

    var studentResult = AccountStore.updateAccount(currentEmail, currentPassword, updates);
    if (!studentResult.success) return studentResult;

    QuizSession.updateParentEmail(email);
    if (newAge != null && newAge !== "") {
      QuizSession.updateAge(parseInt(newAge, 10), {
        ageRecordedAt: studentResult.account.ageRecordedAt
      });
    } else if (typeof QuizSession.syncSessionAge === "function") {
      QuizSession.syncSessionAge();
    }

    if (typeof AdminSession !== "undefined") {
      var adminSession = AdminSession.getSession();
      if (adminSession && adminSession.token) {
        AdminSession.updateSessionEmail(email);
      }
    }

    return { success: true, account: studentResult.account };
  }

  function handleSave(event) {
    if (event) event.preventDefault();
    hideMessages();

    var currentEmail = QuizSession.getParentEmail();
    var emailInput = $("settings-email-input");
    var ageInput = $("settings-age-input");
    var newPassInput = $("settings-new-password");
    var confirmInput = $("settings-confirm-password");
    var currentPassInput = $("settings-current-password");

    var email = emailInput ? emailInput.value.trim() : "";
    var newAgeRaw = ageInput ? ageInput.value.trim() : "";
    var newAge = newAgeRaw ? parseInt(newAgeRaw, 10) : null;
    var newPassword = newPassInput ? newPassInput.value : "";
    var confirmPassword = confirmInput ? confirmInput.value : "";
    var currentPassword = currentPassInput ? currentPassInput.value : "";

    var validationError = validateForm(email, newPassword, confirmPassword, currentPassword);
    if (validationError) {
      showError(validationError);
      return;
    }

    if (newAgeRaw && (isNaN(newAge) || !Security.isValidAge(newAge))) {
      showError("Please enter a valid age between 4 and 18.");
      return;
    }

    var emailChanged = email.toLowerCase() !== String(currentEmail || "").toLowerCase();
    var passwordChanged = !!newPassword;
    var ageChanged = newAgeRaw !== "";

    if (!emailChanged && !passwordChanged && !ageChanged) {
      showError("No changes to save.");
      return;
    }

    if (passwordChanged && !currentPassword) {
      showError("Please enter your current password to change your password.");
      return;
    }

    var result;
    if (isAdminUser()) {
      result = updateAdminAccount(currentEmail, currentPassword, email, newPassword || null, newAge);
    } else {
      result = updateStudentAccount(
        currentEmail,
        currentPassword,
        email,
        newPassword || null,
        newAge
      );
    }

    if (!result.success) {
      showError(result.error || "Could not update account.");
      return;
    }

    showSuccess("Account updated successfully.");
    renderViewMode();
    if (typeof window.updateTopbar === "function") {
      window.updateTopbar();
    }
  }

  function bindEvents() {
    var editBtn = $("settings-edit-btn");
    var cancelBtn = $("settings-cancel-btn");
    var form = $("settings-edit-form");

    if (editBtn) {
      editBtn.addEventListener("click", function () {
        hideMessages();
        setEditMode(true);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        renderViewMode();
      });
    }

    if (form) {
      form.addEventListener("submit", handleSave);
    }

    document.querySelectorAll(".btn-toggle-password").forEach(function (btn) {
      btn.addEventListener("click", function () {
        togglePasswordVisibility(btn);
      });
    });
  }

  function init() {
    bindEvents();
  }

  return {
    init: init,
    render: renderViewMode,
    setEditMode: setEditMode
  };
})();
