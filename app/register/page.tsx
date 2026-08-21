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
    return <p className="p-8 text-center">Checking your session…</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Password: at least 10 characters with a letter and a number. Signup always creates a
          regular user — never an administrator.
        </p>
      </header>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium">
          Display name
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            required
            minLength={2}
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            type="email"
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
            required
            minLength={10}
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
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link className="text-indigo-600 underline" href={`/login?next=${encodeURIComponent(next)}`}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
