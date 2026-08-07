"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";
import { SectionDangerZone } from "@/components/admin/danger/SectionDangerZone";

export default function AdminProfilePage() {
  return (
    <AdminGuardedClient>
      <ProfileManager />
    </AdminGuardedClient>
  );
}

function ProfileManager() {
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    age: 10,
    classLevel: "",
    introHeadline: "",
    aboutText: "",
    motivationalMessage: "",
    safetyReminder: "",
    skillsText: "",
    achievementsText: "",
    funFactsText: "",
    goalsText: "",
    journeyText: "",
  });

  useEffect(() => {
    Promise.all([fetch("/api/csrf").then((r) => r.json()), fetch("/api/admin/profile").then((r) => r.json())]).then(
      ([csrf, data]) => {
        setCsrfToken(csrf.csrfToken || "");
        setAvatarPath(data.profile?.avatarPath || null);
        setForm({
          displayName: data.profile?.displayName || "",
          age: data.profile?.age || 10,
          classLevel: data.profile?.classLevel || "",
          introHeadline: data.profile?.introHeadline || "",
          aboutText: data.profile?.aboutText || "",
          motivationalMessage: data.profile?.motivationalMessage || "",
          safetyReminder: data.profile?.safetyReminder || "",
          skillsText: (data.skills || [])
            .map((s: { name: string; level: number; note: string }) => `${s.name}|${s.level}|${s.note}`)
            .join("\n"),
          achievementsText: (data.achievements || [])
            .map(
              (a: { label: string; value: number | null; icon: string; animated: boolean }) =>
                `${a.label}|${a.value ?? ""}|${a.icon}|${a.animated ? "1" : "0"}`
            )
            .join("\n"),
          funFactsText: (data.funFacts || []).map((f: { text: string }) => f.text).join("\n"),
          goalsText: (data.goals || []).map((g: { text: string }) => g.text).join("\n"),
          journeyText: (data.journey || [])
            .map((j: { title: string; detail: string }) => `${j.title}|${j.detail}`)
            .join("\n"),
        });
      }
    );
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const payload = {
      displayName: form.displayName,
      age: Number(form.age),
      classLevel: form.classLevel,
      introHeadline: form.introHeadline,
      aboutText: form.aboutText,
      motivationalMessage: form.motivationalMessage,
      safetyReminder: form.safetyReminder,
      skills: form.skillsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, level, note] = line.split("|");
          return { name, level: Number(level || 50), note: note || "" };
        }),
      achievements: form.achievementsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, value, icon, animated] = line.split("|");
          return {
            label,
            value: value ? Number(value) : null,
            icon: icon || "⭐",
            animated: animated === "1",
          };
        }),
      funFacts: form.funFactsText.split("\n").map((l) => l.trim()).filter(Boolean),
      goals: form.goalsText.split("\n").map((l) => l.trim()).filter(Boolean),
      journey: form.journeyText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [title, detail] = line.split("|");
          return { title, detail: detail || "" };
        }),
      csrfToken,
    };

    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setToast(json.ok ? json.message : json.error || "Update failed");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold">Profile Management</h2>
          <p className="text-slate-500">Publish changes to update the public website automatically.</p>
        </div>
        {csrfToken ? (
          <SectionDangerZone
            scope="profile-lists"
            csrfToken={csrfToken}
            label="Delete All Profile Lists"
            onToast={setToast}
            onDeleted={() => {
              setForm((prev) => ({
                ...prev,
                skillsText: "",
                achievementsText: "",
                funFactsText: "",
                goalsText: "",
                journeyText: "",
              }));
            }}
          />
        ) : null}
      </div>

      <form
        className="admin-card flex flex-wrap items-center gap-4 p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          data.set("csrfToken", csrfToken);
          const res = await fetch("/api/admin/profile/avatar", { method: "POST", body: data });
          const json = await res.json();
          setToast(json.ok ? json.message : json.error || "Avatar upload failed");
          if (json.ok) setAvatarPath(json.profile?.avatarPath || null);
        }}
      >
        <div>
          <p className="text-sm font-semibold">Profile image / avatar</p>
          <p className="text-sm text-slate-500">JPEG, PNG, or WebP under 2MB. Metadata is stripped.</p>
          {avatarPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPath}
              alt="Current avatar"
              className="mt-2 h-20 w-20 rounded-full object-cover"
            />
          ) : null}
        </div>
        <label className="text-sm font-semibold">
          Choose image
          <input
            className="admin-input mt-1"
            name="avatar"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
          />
        </label>
        <button className="admin-btn" type="submit">
          Upload avatar
        </button>
      </form>

      <form onSubmit={onSubmit} className="space-y-4">
      <div className="admin-card grid gap-3 p-5 md:grid-cols-2">
        {(
          [
            ["displayName", "Display name"],
            ["classLevel", "Class"],
            ["introHeadline", "Intro headline"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm font-semibold">
            {label}
            <input
              className="admin-input mt-1"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
            />
          </label>
        ))}
        <label className="text-sm font-semibold">
          Age
          <input
            className="admin-input mt-1"
            type="number"
            min={5}
            max={17}
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          About text
          <textarea
            className="admin-input mt-1"
            rows={5}
            value={form.aboutText}
            onChange={(e) => setForm({ ...form, aboutText: e.target.value })}
            required
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Motivational message
          <textarea
            className="admin-input mt-1"
            rows={3}
            value={form.motivationalMessage}
            onChange={(e) => setForm({ ...form, motivationalMessage: e.target.value })}
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Safety reminder
          <input
            className="admin-input mt-1"
            value={form.safetyReminder}
            onChange={(e) => setForm({ ...form, safetyReminder: e.target.value })}
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Skills (one per line: Name|Level|Note)
          <textarea
            className="admin-input mt-1 font-mono text-sm"
            rows={6}
            value={form.skillsText}
            onChange={(e) => setForm({ ...form, skillsText: e.target.value })}
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Achievements (Label|Value|Icon|Animated0/1)
          <textarea
            className="admin-input mt-1 font-mono text-sm"
            rows={6}
            value={form.achievementsText}
            onChange={(e) => setForm({ ...form, achievementsText: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold">
          Fun facts (one per line)
          <textarea
            className="admin-input mt-1"
            rows={5}
            value={form.funFactsText}
            onChange={(e) => setForm({ ...form, funFactsText: e.target.value })}
          />
        </label>
        <label className="text-sm font-semibold">
          Goals (one per line)
          <textarea
            className="admin-input mt-1"
            rows={5}
            value={form.goalsText}
            onChange={(e) => setForm({ ...form, goalsText: e.target.value })}
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Journey (Title|Detail per line)
          <textarea
            className="admin-input mt-1 font-mono text-sm"
            rows={6}
            value={form.journeyText}
            onChange={(e) => setForm({ ...form, journeyText: e.target.value })}
          />
        </label>
      </div>
      <button className="admin-btn" type="submit">
        Publish profile changes
      </button>
    </form>
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
