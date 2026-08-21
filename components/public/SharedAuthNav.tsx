"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthUser = {
  uid: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
};

/** Shared auth status for portfolio nav (same cookie as KidMind + Flash Cards). */
export function SharedAuthNav() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/auth", { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok && data.isLoggedIn && data.user) setUser(data.user);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/user/auth", { method: "DELETE", credentials: "same-origin" });
    window.location.reload();
  }

  if (loading) {
    return <span className="nav-auth-loading">Checking session…</span>;
  }

  if (user) {
    return (
      <span className="nav-auth-user">
        <span className="nav-auth-name">{user.displayName}</span>
        {user.isAdmin ? (
          <Link href="/admin" className="nav-link" data-cursor="link">
            Admin
          </Link>
        ) : null}
        <button type="button" className="nav-link" onClick={logout}>
          Sign out
        </button>
      </span>
    );
  }

  return (
    <span className="nav-auth-guest">
      <Link href="/login" className="nav-link" data-cursor="link">
        Sign in
      </Link>
      <Link href="/register" className="nav-link" data-cursor="link">
        Register
      </Link>
    </span>
  );
}
