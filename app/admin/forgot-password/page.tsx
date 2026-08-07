"use client";

import { FormEvent, useEffect, useState } from "react";

export default function ForgotPasswordPage() {
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") || ""),
        csrfToken,
      }),
    });
    const json = await res.json();
    setMessage(json.message || json.error || "Request processed.");
  }

  return (
    <div className="admin-shell grid min-h-screen place-items-center p-4">
      <form onSubmit={onSubmit} className="admin-card w-full max-w-md space-y-4 p-6">
        <h1 className="text-3xl font-bold">Reset password</h1>
        <p className="text-sm text-slate-500">
          A reset link is sent only to the verified parent/guardian email via secure server settings.
        </p>
        <label className="block text-sm font-semibold">
          Parent email
          <input className="admin-input mt-1" name="email" type="email" required />
        </label>
        <button className="admin-btn w-full" type="submit">
          Send reset link
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        <a href="/admin/login" className="block text-center text-sm text-blue-700">
          Back to login
        </a>
      </form>
    </div>
  );
}
