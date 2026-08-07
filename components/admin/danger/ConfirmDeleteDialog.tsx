"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmDeleteDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="admin-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="admin-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="admin-dialog-icon" aria-hidden="true">
          ⚠
        </div>
        <h3 id={titleId} className="text-xl font-bold text-slate-900">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-rose-700">
          Permanent deletion — cannot be recovered
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            ref={cancelRef}
            className="admin-btn secondary"
            type="button"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            className="admin-btn danger"
            type="button"
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
