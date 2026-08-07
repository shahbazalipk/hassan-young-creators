"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadAuthBootstrap() {
    const res = await fetch("/api/auth", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Could not initialize secure login.");
    }
    const data = await res.json();
    if (!data?.csrfToken) {
      throw new Error("Could not initialize secure login.");
    }
    setCsrfToken(data.csrfToken);
    if (data.isLoggedIn) router.replace("/admin");
    if (data.pending2FA) setRequires2FA(true);
    return data.csrfToken as string;
  }

  useEffect(() => {
    loadAuthBootstrap().catch(() => setError("Could not initialize secure login. Please refresh the page."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      // Always ensure a fresh CSRF token (important after proxy/API fixes).
      const token = csrfToken || (await loadAuthBootstrap());
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          password: String(form.get("password") || ""),
          totpCode: String(form.get("totpCode") || "") || undefined,
          csrfToken: token,
        }),
      });
      const data = await res.json();
      if (data.requires2FA) {
        setRequires2FA(true);
        setCsrfToken(data.csrfToken || token);
        setLoading(false);
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed.");
        // Refresh CSRF after failed attempt so the next try is valid.
        loadAuthBootstrap().catch(() => undefined);
        setLoading(false);
        return;
      }
      // Hard navigation refreshes server components (including public nav auth state).
      window.location.assign(params.get("next") || "/admin");
    } catch {
      setError("Network error. Please refresh and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} method="post" className="admin-card w-full max-w-md space-y-4 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.14em] text-blue-600">Parent / Guardian</p>
        <h1 className="mt-2 text-3xl font-bold">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-500">
          This area is only for Hassan’s parent or guardian. Children should not sign in here.
        </p>
      </div>
      <label className="block text-sm font-semibold">
        Email
        <input className="admin-input mt-1" name="email" type="email" required autoComplete="username" />
      </label>
      <label className="block text-sm font-semibold">
        Password
        <input
          className="admin-input mt-1"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
        />
      </label>
      {requires2FA ? (
        <label className="block text-sm font-semibold">
          Authenticator code
          <input className="admin-input mt-1" name="totpCode" inputMode="numeric" pattern="\d{6}" />
        </label>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="admin-btn w-full" type="submit" disabled={loading}>
        {loading ? "Checking…" : "Sign in securely"}
      </button>
      <a className="block text-center text-sm text-blue-700" href="/admin/forgot-password">
        Forgot password?
      </a>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="admin-shell grid min-h-screen place-items-center p-4">
      <Suspense fallback={<p>Loading secure login…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
