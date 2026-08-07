"use client";

import { useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";

export default function AdminSecurityPage() {
  return (
    <AdminGuardedClient>
      <SecurityManager />
    </AdminGuardedClient>
  );
}

function SecurityManager() {
  const [csrfToken, setCsrfToken] = useState("");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/csrf")
      .then((r) => r.json())
      .then((data) => setCsrfToken(data.csrfToken || ""));
  }, []);

  async function start2FA() {
    const res = await fetch("/api/admin/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken }),
    });
    const json = await res.json();
    if (!json.ok) {
      setToast(json.error || "Failed");
      return;
    }
    setSecret(json.secret);
    setOtpauthUrl(json.otpauthUrl);
    setToast(json.message);
  }

  async function confirm2FA() {
    const res = await fetch("/api/admin/2fa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken, totpCode: code }),
    });
    const json = await res.json();
    setToast(json.ok ? json.message : json.error || "Failed");
  }

  async function disable2FA() {
    if (!window.confirm("Disable two-factor authentication?")) return;
    const res = await fetch("/api/admin/2fa", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken }),
    });
    const json = await res.json();
    setToast(json.ok ? json.message : json.error || "Failed");
    setSecret("");
    setOtpauthUrl("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Security</h2>
        <p className="text-slate-500">
          Optional two-factor authentication for the parent/guardian account. Passwords are hashed
          and never stored in plain text.
        </p>
      </div>
      <div className="admin-card space-y-3 p-5">
        <button className="admin-btn" type="button" onClick={start2FA}>
          Start 2FA setup
        </button>
        {secret ? (
          <>
            <p className="text-sm">
              Secret: <code>{secret}</code>
            </p>
            <p className="break-all text-sm text-slate-500">{otpauthUrl}</p>
            <label className="block text-sm font-semibold">
              Enter 6-digit code to confirm
              <input
                className="admin-input mt-1 max-w-xs"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
              />
            </label>
            <button className="admin-btn" type="button" onClick={confirm2FA}>
              Enable 2FA
            </button>
          </>
        ) : null}
        <button className="admin-btn danger" type="button" onClick={disable2FA}>
          Disable 2FA
        </button>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
