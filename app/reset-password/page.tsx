"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [csrf, setCsrf] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/user/auth", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setCsrf(d.csrfToken || ""));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/user/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "reset", token, password, csrfToken: csrf }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Reset failed.");
        return;
      }
      setMessage(data.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">Reset password</h1>
      {!token ? (
        <p className="text-red-600">Missing reset token.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <label className="block text-sm font-medium">
            New password
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
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
      <p className="text-center text-sm">
        <Link href="/login" className="text-indigo-600 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <ResetForm />
    </Suspense>
  );
}
