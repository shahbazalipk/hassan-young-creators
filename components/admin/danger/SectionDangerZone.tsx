"use client";

import { useEffect, useRef, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";
import type { DeleteScope } from "@/lib/admin/scopes";
import { SCOPE_DELETE_ALL_LABELS, SCOPE_WARNINGS } from "@/lib/admin/scopes";

type SectionDangerZoneProps = {
  scope: DeleteScope;
  csrfToken: string;
  label?: string;
  disabled?: boolean;
  onDeleted: () => void | Promise<void>;
  onToast: (message: string) => void;
};

export function SectionDangerZone({
  scope,
  csrfToken,
  label,
  disabled = false,
  onDeleted,
  onToast,
}: SectionDangerZoneProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const actionLabel = label || SCOPE_DELETE_ALL_LABELS[scope];

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function runDelete() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, confirm: true, csrfToken }),
      });
      const json = await res.json();
      if (json.ok) {
        onToast(json.message || "Deleted.");
        setConfirmOpen(false);
        await onDeleted();
      } else {
        onToast(json.error || "Deletion failed.");
      }
    } catch {
      onToast("Deletion failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-more-actions" ref={menuRef}>
        <button
          type="button"
          className="admin-btn secondary"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={disabled}
          onClick={() => setMenuOpen((open) => !open)}
        >
          More Actions
        </button>
        {menuOpen ? (
          <div className="admin-more-menu" role="menu">
            <p className="admin-more-menu-label">Danger Zone</p>
            <button
              type="button"
              role="menuitem"
              className="admin-more-menu-danger"
              onClick={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        title={actionLabel}
        description={SCOPE_WARNINGS[scope]}
        confirmLabel={actionLabel}
        busy={busy}
        onCancel={() => {
          if (!busy) setConfirmOpen(false);
        }}
        onConfirm={runDelete}
      />
    </>
  );
}
