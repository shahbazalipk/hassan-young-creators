"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { welcomeRedirect } from "@/lib/welcome-redirect";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [checking, setChecking] = useState(true);
  const [csrf, setCsrf] = useState("");
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
        if (data.ok && data.isLoggedIn && data.user) {
          router.replace(welcomeRedirect(next, Boolean(data.user.isAdmin)));
          return;
        }
      } catch {
        // show login
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
          action: "login",
          email: email.trim(),
          password,
          csrfToken: token,
          next,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!data || !data.ok) {
        setError((data && data.error) || "Unable to sign in. Please check your email and password.");
        if (data?.csrfToken) setCsrf(data.csrfToken);
        return;
      }
      router.replace(welcomeRedirect(data.next || next || "/", Boolean(data.user?.isAdmin)));
    } catch {
      setError("Unable to sign in right now. Please refresh and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-semibold">Checking your session…</p>
        <p className="mt-2 text-sm text-slate-500">Please wait.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          One account works on Hassan’s website, KidMind AI, and Flash Cards.
        </p>
      </header>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm" noValidate>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link className="text-indigo-600 underline" href={`/register?next=${encodeURIComponent(next)}`}>
          Create an account
        </Link>
        {" · "}
        <Link className="text-indigo-600 underline" href="/forgot-password">
          Forgot password?
        </Link>
      </p>
      <p className="text-center text-xs text-slate-500">
        Administrators: use{" "}
        <Link href="/admin/login" className="underline">
          admin login
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
