"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { welcomeRedirect } from "@/lib/welcome-redirect";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [checking, setChecking] = useState(true);
  const [csrf, setCsrf] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [publicNickname, setPublicNickname] = useState("");
  const [parentalConsent, setParentalConsent] = useState(false);
  const [leaderboardConsent, setLeaderboardConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetch("/api/user/auth", { credentials: "same-origin" }).then((r) => r.json());
        if (cancelled) return;
        setCsrf(data.csrfToken || "");
        if (data.ok && data.isLoggedIn) {
          router.replace(welcomeRedirect(next, Boolean(data.user?.isAdmin)));
          return;
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      // Always refresh CSRF right before submit (avoids expired tokens on phones).
      const boot = await fetch("/api/user/auth", {
        credentials: "same-origin",
        cache: "no-store",
      }).then((r) => r.json());
      const token = boot.csrfToken || csrf;
      setCsrf(token);

      const res = await fetch("/api/user/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "register",
          displayName: displayName.trim(),
          email: email.trim(),
          password,
          dateOfBirth,
          parentalConsent: true,
          leaderboardConsent,
          publicNickname: publicNickname.trim(),
          csrfToken: token,
          next,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Could not create account.");
        if (data.csrfToken) setCsrf(data.csrfToken);
        return;
      }
      router.replace(welcomeRedirect(data.next || next || "/", Boolean(data.user?.isAdmin)));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="auth-register-page">
        <p className="p-8 text-center text-slate-700">Checking your session…</p>
      </div>
    );
  }

  return (
    <div className="auth-register-page">
      <div className="auth-register-inner mx-auto w-full max-w-md space-y-6 p-4 sm:p-6">
        <header>
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">Create account</h1>
          <p className="mt-1 text-sm text-slate-600">
            Password: at least 10 characters with a letter and a number. A parent/guardian must
            confirm consent. We store date of birth securely to calculate age automatically — never
            invent a birthday.
          </p>
        </header>
        <form
          onSubmit={(e) => {
            if (!parentalConsent) {
              e.preventDefault();
              setError("A parent or guardian must confirm consent to create this account.");
              return;
            }
            onSubmit(e);
          }}
          className="auth-register-card space-y-4 rounded-2xl border border-sky-200 bg-white/90 p-5 shadow-sm"
        >
          <label className="block text-sm font-medium text-slate-700">
            Display name
            <input
              className="auth-register-input mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-base"
              required
              minLength={2}
              maxLength={60}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="nickname"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="auth-register-input mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-base"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Student date of birth
            <input
              className="auth-register-input mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-base"
              type="date"
              required
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              autoComplete="bday"
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Used only to keep questions age-appropriate. Age updates automatically on birthdays.
            </span>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="auth-register-input mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-base"
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Leaderboard nickname (optional)
            <input
              className="auth-register-input mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2.5 text-base"
              maxLength={24}
              value={publicNickname}
              onChange={(e) => setPublicNickname(e.target.value)}
              placeholder="e.g. StarCoder"
            />
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={leaderboardConsent}
              onChange={(e) => setLeaderboardConsent(e.target.checked)}
            />
            <span>
              Parent/guardian agrees a safe nickname may appear on the public Flash Cards
              leaderboard (never email or birth date).
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              className="mt-1"
              required
              checked={parentalConsent}
              onChange={(e) => setParentalConsent(e.target.checked)}
            />
            <span>
              I am a parent/guardian (or have parental permission) and consent to creating this
              child-safe learning account.
            </span>
          </label>
          {error ? (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">{error}</p>
              {/already registered|sign in/i.test(error) ? (
                <Link
                  className="inline-block text-sm font-semibold text-sky-700 underline"
                  href={`/login?next=${encodeURIComponent(next)}`}
                >
                  Go to Sign in
                </Link>
              ) : null}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-sky-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-700">
          Already have an account?{" "}
          <Link className="font-semibold text-sky-700 underline" href={`/login?next=${encodeURIComponent(next)}`}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-register-page">
          <p className="p-8 text-center text-slate-700">Loading…</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
