"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [message, setMessage] = useState("Verifying…");

  useEffect(() => {
    if (!token) {
      setMessage("Missing verification token.");
      return;
    }
    fetch("/api/user/auth", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "verify-email", token }),
    })
      .then((r) => r.json())
      .then((d) => setMessage(d.message || d.error || "Done."))
      .catch(() => setMessage("Verification failed."));
  }, [token]);

  return (
    <div className="mx-auto max-w-md space-y-4 p-6 text-center">
      <h1 className="text-2xl font-bold">Email verification</h1>
      <p>{message}</p>
      <Link href="/login" className="text-indigo-600 underline">
        Continue to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <VerifyInner />
    </Suspense>
  );
}
