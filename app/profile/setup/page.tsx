"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

function ProfileSetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [csrf, setCsrf] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [publicNickname, setPublicNickname] = useState("");
  const [leaderboardConsent, setLeaderboardConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetch("/api/user/auth", {
        credentials: "same-origin",
        cache: "no-store",
      }).then((r) => r.json());
      if (cancelled) return;
      if (!data.ok || !data.isLoggedIn) {
        router.replace(`/login?next=${encodeURIComponent("/profile/setup?next=" + next)}`);
        return;
      }
      setCsrf(data.csrfToken || "");
      if (data.user?.publicNickname) setPublicNickname(data.user.publicNickname);
      setLeaderboardConsent(Boolean(data.user?.leaderboardConsent));
      if (data.user?.hasDateOfBirth && !data.user?.needsDobSetup) {
        router.replace(next.startsWith("/") ? next : "/");
        return;
      }
      setReady(true);
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
      const res = await fetch("/api/user/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          action: "set-dob",
          dateOfBirth,
          publicNickname: publicNickname.trim(),
          leaderboardConsent,
          csrfToken: token,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Could not save profile.");
        return;
      }
      router.replace(next.startsWith("/") ? next : "/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <p className="p-8 text-center">Loading profile setup…</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Finish your student profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add the student’s date of birth so questions stay age-appropriate. We never invent a
          birthday. A parent/guardian should help with this step.
        </p>
      </header>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium">
          Date of birth
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            type="date"
            required
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Leaderboard nickname (optional)
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            maxLength={24}
            value={publicNickname}
            onChange={(e) => setPublicNickname(e.target.value)}
            placeholder="e.g. StarCoder"
          />
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={leaderboardConsent}
            onChange={(e) => setLeaderboardConsent(e.target.checked)}
          />
          <span>Parent/guardian agrees this nickname may appear on the public leaderboard.</span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save and continue"}
        </button>
      </form>
      <p className="text-center text-sm">
        <Link href="/" className="text-indigo-600 underline">
          Back to Hassan’s website
        </Link>
      </p>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <ProfileSetupForm />
    </Suspense>
  );
}
