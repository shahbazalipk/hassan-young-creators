/**
 * Server-side age helpers — age is always derived from date of birth, never trusted from the client alone.
 */

export type DobParts = { year: number; month: number; day: number };

const MIN_DOB_AGE = 4;
const MAX_DOB_AGE = 18;

export function parseDobInput(raw: unknown): Date | null {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return startOfUtcDay(raw);
  }
  if (typeof raw !== "string" || !raw.trim()) return null;
  const s = raw.trim();
  // Expect YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null; // invalid calendar date (e.g. Feb 30)
  }
  return dt;
}

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Age in whole years as of `asOf` (defaults to now UTC). Handles leap-day birthdays safely. */
export function ageFromDob(dob: Date, asOf: Date = new Date()): number {
  const birth = startOfUtcDay(dob);
  const today = startOfUtcDay(asOf);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = today.getUTCDate() - birth.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

export function isPlausibleStudentDob(dob: Date, asOf: Date = new Date()): boolean {
  const age = ageFromDob(dob, asOf);
  if (age < MIN_DOB_AGE || age > MAX_DOB_AGE) return false;
  if (dob.getTime() > startOfUtcDay(asOf).getTime()) return false;
  return true;
}

/**
 * Smooth difficulty bias within an age band (0 = just entered band, 1 = near top of band).
 * Used to gradually prefer slightly harder items without jumping bands overnight.
 */
export function smoothDifficultyProgress(options: {
  age: number;
  dob?: Date | null;
  recentAccuracy?: number | null; // 0–1
}): number {
  const { age, dob, recentAccuracy } = options;
  let progress = 0.35; // baseline mid-soft

  if (dob) {
    const asOf = new Date();
    const years = ageFromDob(dob, asOf);
    // Days since last birthday (0–364-ish)
    const lastBirthday = new Date(Date.UTC(asOf.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
    if (lastBirthday.getTime() > asOf.getTime()) {
      lastBirthday.setUTCFullYear(lastBirthday.getUTCFullYear() - 1);
    }
    // Leap-day: if DOB is Feb 29 and this year has no Feb 29, JS Date rolls — normalize via ageFromDob already.
    const days = Math.max(0, Math.floor((asOf.getTime() - lastBirthday.getTime()) / (24 * 60 * 60 * 1000)));
    const yearFrac = Math.min(1, days / 365);
    progress = 0.15 + yearFrac * 0.55;
    void years;
  }

  if (typeof recentAccuracy === "number" && Number.isFinite(recentAccuracy)) {
    const a = Math.max(0, Math.min(1, recentAccuracy));
    // Strong performance gently raises difficulty; weak performance softens it.
    progress = progress * 0.7 + a * 0.3;
  }

  // Age itself nudges upward slightly for older students in the same band.
  progress = Math.max(0, Math.min(1, progress + (age % 3) * 0.02));
  return progress;
}

export function clampStudentAge(age: number): number {
  if (!Number.isFinite(age)) return MIN_DOB_AGE;
  return Math.max(MIN_DOB_AGE, Math.min(MAX_DOB_AGE, Math.floor(age)));
}

export function formatDobIso(dob: Date): string {
  const y = dob.getUTCFullYear();
  const m = String(dob.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dob.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Safe public leaderboard name — never email. */
export function publicLeaderboardName(user: {
  publicNickname?: string | null;
  displayName?: string | null;
  leaderboardConsent?: boolean | null;
}): string {
  if (user.leaderboardConsent && user.publicNickname?.trim()) {
    return user.publicNickname.trim().slice(0, 24);
  }
  if (user.leaderboardConsent && user.displayName?.trim()) {
    // First name / short display only
    return user.displayName.trim().split(/\s+/)[0].slice(0, 18);
  }
  return "Young Creator";
}
