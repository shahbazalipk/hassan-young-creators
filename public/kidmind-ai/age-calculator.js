/** Automatic child age calculation from original age + recorded date */
var AgeCalculator = (function () {
  function parseDate(value) {
    if (!value) return null;
    var d = new Date(value);
    if (!isNaN(d.getTime())) return d;
    var parts = String(value).trim().split("-");
    if (parts.length === 3) {
      d = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  function toDateString(value) {
    var d = parseDate(value);
    if (!d) return "";
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function formatDisplayDate(value) {
    var d = parseDate(value);
    if (!d) return "—";
    try {
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      return toDateString(value);
    }
  }

  function calculateCurrentAge(originalAge, ageRecordedAt, now) {
    var baseAge = parseInt(originalAge, 10);
    if (isNaN(baseAge)) return null;

    var recordedDate = parseDate(ageRecordedAt);
    if (!recordedDate) return baseAge;

    var today = now ? parseDate(now) : new Date();
    if (!today) today = new Date();

    var yearsPassed = today.getFullYear() - recordedDate.getFullYear();
    var hasAnniversaryPassed =
      today.getMonth() > recordedDate.getMonth() ||
      (today.getMonth() === recordedDate.getMonth() &&
        today.getDate() >= recordedDate.getDate());

    if (!hasAnniversaryPassed) {
      yearsPassed--;
    }

    return baseAge + Math.max(yearsPassed, 0);
  }

  function clampChildAge(age) {
    var n = parseInt(age, 10);
    if (isNaN(n)) return null;
    if (typeof Security !== "undefined" && Security.isValidAge(n)) return n;
    if (n >= 5 && n <= 15) return n;
    return null;
  }

  function buildAgeProfile(originalAge, ageRecordedAt, now) {
    var original = clampChildAge(originalAge);
    if (original == null) return null;
    var recorded = ageRecordedAt || new Date().toISOString();
    var calculated = calculateCurrentAge(original, recorded, now);
    return {
      childName: null,
      originalAge: original,
      ageRecordedAt: recorded,
      calculatedCurrentAge: calculated
    };
  }

  return {
    parseDate: parseDate,
    toDateString: toDateString,
    formatDisplayDate: formatDisplayDate,
    calculateCurrentAge: calculateCurrentAge,
    clampChildAge: clampChildAge,
    buildAgeProfile: buildAgeProfile
  };
})();
