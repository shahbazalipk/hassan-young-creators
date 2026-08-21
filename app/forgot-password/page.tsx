"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function ForgotPasswordPage() {
  const [csrf, setCsrf] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/user/auth", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setCsrf(d.csrfToken || ""));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, csrfToken: csrf }),
      });
      const data = await res.json();
      setMessage(data.message || data.error || "Request sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">Forgot password</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
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
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white"
        >
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link href="/login" className="text-indigo-600 underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
