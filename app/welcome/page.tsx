"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function WelcomeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const nextRaw = params.get("next") || "/";
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//") && !nextRaw.includes("://")
      ? nextRaw
      : "/";

  const [name, setName] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetch("/api/user/auth", {
          credentials: "same-origin",
          cache: "no-store",
        }).then((r) => r.json());
        if (cancelled) return;
        if (data?.ok && data.isLoggedIn && data.user?.displayName) {
          setName(data.user.displayName);
        }
      } catch {
        // Guest welcome is still fine.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function continueToSite() {
    router.push(next);
  }

  return (
    <div className="hassan-welcome-page">
      <div className="hassan-welcome-card">
        <p className="hassan-welcome-kicker">Young Creator</p>
        <h1 className="hassan-welcome-title">Welcome to Hassan’s website</h1>
        {ready && name ? (
          <p className="hassan-welcome-subtitle">
            Hi <strong>{name}</strong> — thanks for joining. Explore, learn, and create with me!
          </p>
        ) : (
          <p className="hassan-welcome-subtitle">
            Thanks for visiting. Explore, learn, and create with me!
          </p>
        )}

        <div className="hassan-welcome-photo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hassan-welcome.jpg"
            alt="Hassan"
            className="hassan-welcome-photo"
            width={900}
            height={1200}
            decoding="async"
          />
        </div>

        <p className="hassan-welcome-caption">Hassan · Young Web Creator</p>

        <button type="button" className="hassan-welcome-btn" onClick={continueToSite}>
          Enter the website
        </button>

        <p className="hassan-welcome-links">
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/kidmind-ai">KidMind AI</Link>
          {" · "}
          <Link href="/flash-cards">Flash Cards</Link>
        </p>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="hassan-welcome-page">
          <p className="p-8 text-center text-slate-700">Loading welcome…</p>
        </div>
      }
    >
      <WelcomeInner />
    </Suspense>
  );
}
