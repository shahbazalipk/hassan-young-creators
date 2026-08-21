"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Visitor = {
  id: string;
  displayName: string;
  email: string | null;
  photoUrl: string | null;
  isAnonymous: boolean;
  authStatus: string;
  firstVisitAt: string;
  lastVisitAt: string;
  visitCount: number;
};

export default function AdminVisitorsPage() {
  const [name, setName] = useState("Admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [totals, setTotals] = useState({ uniqueVisitors: 0, totalVisits: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const me = await fetch("/api/auth").then((r) => r.json());
      if (me?.name) setName(me.name);
      const data = await fetch("/api/admin/visitors?pageSize=50").then((r) => r.json());
      if (!data.ok) throw new Error(data.error || "Failed to load visitors");
      setVisitors(data.visitors || []);
      setTotals(data.totals || { uniqueVisitors: 0, totalVisits: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminShell name={name}>
      <div className="space-y-6 p-4 md:p-6">
        <header>
          <h1 className="text-2xl font-bold">Visitors</h1>
          <p className="mt-1 text-sm text-slate-500">
            Privacy-safe visit analytics. Anonymous visitors never expose Google account details.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Total unique visitors</p>
            <p className="text-3xl font-bold">{totals.uniqueVisitors}</p>
          </div>
          <div className="admin-card p-4">
            <p className="text-sm text-slate-500">Total visits</p>
            <p className="text-3xl font-bold">{totals.totalVisits}</p>
          </div>
        </div>

        {loading ? <p>Loading visitors…</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}
        {!loading && !error && visitors.length === 0 ? (
          <p className="admin-card p-4 text-slate-500">No visitors recorded yet.</p>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Visitor</th>
                <th className="p-2">Status</th>
                <th className="p-2">First visit</th>
                <th className="p-2">Last visit</th>
                <th className="p-2">Visits</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      {v.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.photoUrl} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200">👤</span>
                      )}
                      <div>
                        <p className="font-semibold">{v.displayName}</p>
                        {v.email ? <p className="text-xs text-slate-500">{v.email}</p> : null}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">{v.isAnonymous ? "Anonymous" : "Signed in"}</td>
                  <td className="p-2">{new Date(v.firstVisitAt).toLocaleString()}</td>
                  <td className="p-2">{new Date(v.lastVisitAt).toLocaleString()}</td>
                  <td className="p-2 font-semibold">{v.visitCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
