"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGuardedClient } from "@/components/admin/AdminGuardedClient";

export default function AdminSettingsPage() {
  return (
    <AdminGuardedClient>
      <SettingsManager />
    </AdminGuardedClient>
  );
}

function SettingsManager() {
  const [csrfToken, setCsrfToken] = useState("");
  const [toast, setToast] = useState("");
  const [hint, setHint] = useState("");
  const [form, setForm] = useState({
    contactFormEnabled: false,
    guestbookEnabled: false,
    challengeSubmissionsOn: true,
    publicSubmissionsEnabled: true,
    visitorMessagingEnabled: true,
    maintenanceMode: false,
    showParentEmailPublicly: false,
    themeDefault: "dark",
    accentCyan: "#3de7ff",
    accentViolet: "#9b6bff",
    accentAmber: "#ffd166",
    accentCoral: "#ff7a6e",
    privacyNotice: "",
    homepageAnnouncement: "",
    footerText: "",
    socialLinksJson: "[]",
  });

  useEffect(() => {
    Promise.all([fetch("/api/csrf").then((r) => r.json()), fetch("/api/admin/settings").then((r) => r.json())]).then(
      ([csrf, data]) => {
        setCsrfToken(csrf.csrfToken || "");
        setHint(data.settings?.parentContactEmailHint || "");
        setForm({
          contactFormEnabled: false,
          guestbookEnabled: false,
          challengeSubmissionsOn: data.settings.challengeSubmissionsOn,
          publicSubmissionsEnabled: data.settings.publicSubmissionsEnabled,
          visitorMessagingEnabled: data.settings.visitorMessagingEnabled !== false,
          maintenanceMode: data.settings.maintenanceMode,
          showParentEmailPublicly: data.settings.showParentEmailPublicly,
          themeDefault: data.settings.themeDefault,
          accentCyan: data.settings.accentCyan,
          accentViolet: data.settings.accentViolet,
          accentAmber: data.settings.accentAmber,
          accentCoral: data.settings.accentCoral,
          privacyNotice: data.settings.privacyNotice,
          homepageAnnouncement: data.settings.homepageAnnouncement || "",
          footerText: data.settings.footerText,
          socialLinksJson: data.settings.socialLinksJson || "[]",
        });
      }
    );
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contactFormEnabled: false,
        guestbookEnabled: false,
        csrfToken,
      }),
    });
    const json = await res.json();
    setToast(json.ok ? "Settings saved." : json.error || "Failed");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Website Settings</h2>
        <p className="text-slate-500">
          Parent contact email is stored in the server environment variable{" "}
          <code>PARENT_CONTACT_EMAIL</code> ({hint}). It is never shown publicly unless you enable
          that option.
        </p>
      </div>

      <div className="admin-card grid gap-3 p-5 md:grid-cols-2">
        {(
          [
            ["visitorMessagingEnabled", "Visitor messaging on"],
            ["challengeSubmissionsOn", "Challenge submissions on"],
            ["publicSubmissionsEnabled", "Public challenge notes on"],
            ["maintenanceMode", "Maintenance mode"],
            ["showParentEmailPublicly", "Show parent email publicly"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form[key] as boolean}
              onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}

        <label className="text-sm font-semibold">
          Default theme
          <select
            className="admin-input mt-1"
            value={form.themeDefault}
            onChange={(e) => setForm({ ...form, themeDefault: e.target.value })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>

        {(
          [
            ["accentCyan", "Cyan accent"],
            ["accentViolet", "Violet accent"],
            ["accentAmber", "Amber accent"],
            ["accentCoral", "Coral accent"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-sm font-semibold">
            {label}
            <input
              className="admin-input mt-1"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}

        <label className="md:col-span-2 text-sm font-semibold">
          Homepage announcement
          <input
            className="admin-input mt-1"
            value={form.homepageAnnouncement}
            onChange={(e) => setForm({ ...form, homepageAnnouncement: e.target.value })}
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Footer text
          <input
            className="admin-input mt-1"
            value={form.footerText}
            onChange={(e) => setForm({ ...form, footerText: e.target.value })}
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Privacy notice
          <textarea
            className="admin-input mt-1"
            rows={5}
            value={form.privacyNotice}
            onChange={(e) => setForm({ ...form, privacyNotice: e.target.value })}
          />
        </label>
        <label className="md:col-span-2 text-sm font-semibold">
          Social links JSON (parent managed) — example: [{`{"label":"Family Blog","href":"https://example.com"}`}]
          <textarea
            className="admin-input mt-1 font-mono text-sm"
            rows={4}
            value={form.socialLinksJson}
            onChange={(e) => setForm({ ...form, socialLinksJson: e.target.value })}
          />
        </label>
      </div>

      <button className="admin-btn" type="submit">
        Save settings
      </button>
      {toast ? <div className="toast">{toast}</div> : null}
    </form>
  );
}
