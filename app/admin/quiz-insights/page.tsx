"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Entry = {
  id: string;
  displayName: string;
  age: number | null;
  ageBand: string | null;
  score: number;
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  durationMs: number | null;
  completedAt: string;
};

type QuestionStats = {
  total: number;
  active: number;
  inactive: number;
  duplicateGroups: number;
  duplicateQuestionCount: number;
  byAgeBand: { id: string; label: string; count: number }[];
};

type QuestionRow = {
  id: string;
  publicId: string;
  text: string;
  minAge: number;
  maxAge: number;
  difficulty: string;
  isActive: boolean;
};

export default function AdminQuizInsightsPage() {
  const [name, setName] = useState("Admin");
  const [csrf, setCsrf] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const me = await fetch("/api/auth").then((r) => r.json());
      if (me?.name) setName(me.name);
      if (me?.csrfToken) setCsrf(me.csrfToken);
      const [lb, qs] = await Promise.all([
        fetch("/api/admin/leaderboard?limit=50").then((r) => r.json()),
        fetch("/api/admin/questions").then((r) => r.json()),
      ]);
      if (!lb.ok) throw new Error(lb.error || "Leaderboard failed");
      if (!qs.ok) throw new Error(qs.error || "Questions failed");
      setEntries(lb.entries || []);
      setStats(qs.stats || null);
      setQuestions(qs.questions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleQuestion(id: string, isActive: boolean) {
    const res = await fetch("/api/admin/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive, csrfToken: csrf }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Update failed");
      return;
    }
    load();
  }

  return (
    <AdminShell name={name}>
      <div className="space-y-8 p-4 md:p-6">
        <header>
          <h1 className="text-2xl font-bold">Quiz Insights</h1>
          <p className="mt-1 text-sm text-slate-500">
            Global leaderboard and question-bank health for Flash Cards.
          </p>
        </header>

        {loading ? <p>Loading…</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        {stats ? (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="admin-card p-4">
              <p className="text-sm text-slate-500">Questions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-slate-500">
                {stats.active} active · {stats.inactive} disabled
              </p>
            </div>
            <div className="admin-card p-4">
              <p className="text-sm text-slate-500">Duplicate groups</p>
              <p className="text-2xl font-bold">{stats.duplicateGroups}</p>
              <p className="text-xs text-slate-500">{stats.duplicateQuestionCount} rows involved</p>
            </div>
            {stats.byAgeBand.slice(0, 2).map((b) => (
              <div key={b.id} className="admin-card p-4">
                <p className="text-sm text-slate-500">{b.label}</p>
                <p className="text-2xl font-bold">{b.count}</p>
              </div>
            ))}
          </section>
        ) : null}

        {stats ? (
          <section className="admin-card p-4">
            <h2 className="mb-3 text-lg font-semibold">Questions by age band</h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stats.byAgeBand.map((b) => (
                <li key={b.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <strong>{b.label}</strong>: {b.count}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <h2 className="mb-3 text-lg font-semibold">Global leaderboard</h2>
          {!loading && entries.length === 0 ? (
            <p className="text-slate-500">No cloud scores yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">#</th>
                    <th className="p-2">Player</th>
                    <th className="p-2">Score</th>
                    <th className="p-2">Accuracy</th>
                    <th className="p-2">Age band</th>
                    <th className="p-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, idx) => (
                    <tr key={e.id} className="border-b border-slate-100">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 font-semibold">{e.displayName}</td>
                      <td className="p-2">
                        {e.correctCount}/{e.totalQuestions}
                      </td>
                      <td className="p-2">{e.scorePercent}%</td>
                      <td className="p-2">{e.ageBand || "—"}</td>
                      <td className="p-2">{new Date(e.completedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Recent questions</h2>
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className="admin-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{q.text}</p>
                  <p className="text-xs text-slate-500">
                    {q.publicId} · ages {q.minAge}–{q.maxAge} · {q.difficulty} ·{" "}
                    {q.isActive ? "active" : "disabled"}
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => toggleQuestion(q.id, !q.isActive)}
                >
                  {q.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
