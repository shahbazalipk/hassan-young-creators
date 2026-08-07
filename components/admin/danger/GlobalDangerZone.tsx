"use client";

import { useEffect, useId, useRef, useState } from "react";

type GlobalDangerZoneProps = {
  csrfToken: string;
  onToast: (message: string) => void;
  onDeleted: () => void | Promise<void>;
};

export function GlobalDangerZone({ csrfToken, onToast, onDeleted }: GlobalDangerZoneProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [backupDate, setBackupDate] = useState<string | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const requestInFlight = useRef(false);
  const titleId = useId();

  useEffect(() => {
    if (!open || busy) return;
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, busy]);

  function closeDialog() {
    if (busy) return;
    setOpen(false);
  }

  async function downloadBackup() {
    setBackupBusy(true);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        onToast(json?.error || "Could not create backup.");
        return;
      }
      const blob = await res.blob();
      const headerDate = res.headers.get("X-Backup-Created-At");
      const createdAt = headerDate || new Date().toISOString();
      setBackupDate(createdAt);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hassan-admin-backup-${createdAt.slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onToast(`Backup downloaded (${new Date(createdAt).toLocaleString()}).`);
    } catch {
      onToast("Could not create backup.");
    } finally {
      setBackupBusy(false);
    }
  }

  async function restoreDefaults() {
    if (restoreBusy || busy) return;
    setRestoreBusy(true);
    try {
      const res = await fetch("/api/admin/restore-defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken }),
      });
      const json = await res.json();
      onToast(json.ok ? json.message || "Defaults restored." : json.error || "Restore failed.");
      if (json.ok) await onDeleted();
    } catch {
      onToast("Could not restore default website content.");
    } finally {
      setRestoreBusy(false);
    }
  }

  async function continueDelete() {
    if (busy || requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/delete-all-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, confirm: true }),
      });
      const json = await res.json();
      if (json.ok) {
        onToast(
          json.message ||
            "Removable Admin Panel data was deleted. Essential public website content was preserved."
        );
        setOpen(false);
        setBusy(false);
        requestInFlight.current = false;
        await onDeleted();
        return;
      }
      onToast(json.error || "Global deletion failed.");
    } catch {
      onToast("Global deletion failed. Please try again.");
    } finally {
      setBusy(false);
      requestInFlight.current = false;
    }
  }

  return (
    <section className="admin-danger-zone" aria-labelledby="global-danger-heading">
      <div className="admin-danger-zone-header">
        <span className="admin-danger-zone-icon" aria-hidden="true">
          ⚠
        </span>
        <div>
          <h3 id="global-danger-heading" className="text-xl font-bold text-rose-900">
            Danger Zone
          </h3>
          <p className="mt-1 text-sm text-rose-800/80">
            Delete removable visitor messages, submissions, and activity records. Essential public
            sections (About, projects, skills, Inspiration Wall, and more) are preserved. Your admin
            login is never deleted.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="admin-btn"
          onClick={restoreDefaults}
          disabled={restoreBusy || busy}
        >
          {restoreBusy ? "Restoring…" : "Restore Default Website Content"}
        </button>
        <button
          type="button"
          className="admin-btn secondary"
          onClick={downloadBackup}
          disabled={backupBusy || busy}
        >
          {backupBusy ? "Preparing backup…" : "Download Backup First"}
        </button>
        <button
          type="button"
          className="admin-btn danger"
          onClick={() => setOpen(true)}
          disabled={busy || restoreBusy}
        >
          Delete All Admin Data
        </button>
      </div>
      {backupDate ? (
        <p className="mt-2 text-xs text-slate-500">
          Last backup downloaded: {new Date(backupDate).toLocaleString()}
        </p>
      ) : null}

      {open ? (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) closeDialog();
          }}
        >
          <div
            className="admin-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-busy={busy}
          >
            <div className="admin-dialog-icon" aria-hidden="true">
              ⚠
            </div>
            <h3 id={titleId} className="text-xl font-bold text-slate-900">
              Delete All Admin Data
            </h3>
            {busy ? (
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Deleting all Admin Panel data…
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Are you sure you want to delete all Admin Panel data? This action cannot be undone.
                Essential public website content will be kept.
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                ref={cancelRef}
                className="admin-btn secondary"
                type="button"
                onClick={closeDialog}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="admin-btn danger"
                type="button"
                onClick={continueDelete}
                disabled={busy}
                aria-busy={busy}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
