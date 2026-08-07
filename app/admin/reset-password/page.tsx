"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [csrfToken, setCsrfToken] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => setCsrfToken(data.csrfToken || ""));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: String(form.get("password") || ""),
        csrfToken,
      }),
    });
    const json = await res.json();
    setMessage(json.message || json.error || "Done.");
  }

  return (
    <form onSubmit={onSubmit} className="admin-card w-full max-w-md space-y-4 p-6">
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <label className="block text-sm font-semibold">
        New password (12+ characters)
        <input className="admin-input mt-1" name="password" type="password" minLength={12} required />
      </label>
      <button className="admin-btn w-full" type="submit">
        Update password
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      <a href="/admin/login" className="block text-center text-sm text-blue-700">
        Back to login
      </a>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="admin-shell grid min-h-screen place-items-center p-4">
      <Suspense fallback={<p>Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
