"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export function AdminGuardedClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("Parent");

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        if (!data.isLoggedIn) {
          router.replace("/admin/login");
          return;
        }
        setName(data.name || "Parent");
        setReady(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  if (!ready) {
    return (
      <div className="admin-shell grid min-h-screen place-items-center">
        <p>Loading secure admin…</p>
      </div>
    );
  }

  return <AdminShell name={name}>{children}</AdminShell>;
}
