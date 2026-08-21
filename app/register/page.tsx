"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [checking, setChecking] = useState(true);
  const [csrf, setCsrf] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          router.replace(next.startsWith("/") ? next : "/");
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
      const res = await fetch("/api/user/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "register",
          displayName,
          email,
          password,
          csrfToken: csrf,
          next,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Could not create account.");
        if (data.csrfToken) setCsrf(data.csrfToken);
        return;
      }
      router.replace(data.next || next || "/");
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
            Password: at least 10 characters with a letter and a number. Signup always creates a
            regular user — never an administrator.
          </p>
        </header>
        <form onSubmit={onSubmit} className="auth-register-card space-y-4 rounded-2xl border border-sky-200 bg-white/90 p-5 shadow-sm">
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
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
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
