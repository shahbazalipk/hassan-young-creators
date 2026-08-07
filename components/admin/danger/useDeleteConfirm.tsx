"use client";

import { useCallback, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/admin/danger/ConfirmDeleteDialog";

type UseDeleteConfirmOptions = {
  csrfToken: string;
  onToast: (message: string) => void;
  onSuccess?: () => void | Promise<void>;
};

type PendingDelete = {
  title: string;
  description: string;
  confirmLabel?: string;
  request: () => Promise<{ ok: boolean; message?: string; error?: string }>;
};

export function useDeleteConfirm({ csrfToken, onToast, onSuccess }: UseDeleteConfirmOptions) {
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const [busy, setBusy] = useState(false);

  const askDelete = useCallback((config: PendingDelete) => {
    setPending(config);
  }, []);

  const cancel = useCallback(() => {
    if (!busy) setPending(null);
  }, [busy]);

  const confirm = useCallback(async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const result = await pending.request();
      if (result.ok) {
        onToast(result.message || "Deleted.");
        setPending(null);
        await onSuccess?.();
      } else {
        onToast(result.error || "Deletion failed.");
      }
    } catch {
      onToast("Deletion failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [pending, busy, onToast, onSuccess]);

  const dialog = (
    <ConfirmDeleteDialog
      open={Boolean(pending)}
      title={pending?.title || "Delete"}
      description={pending?.description || ""}
      confirmLabel={pending?.confirmLabel || "Delete"}
      busy={busy}
      onCancel={cancel}
      onConfirm={confirm}
    />
  );

  return { askDelete, dialog, busy, csrfToken };
}

export async function deleteJson(
  url: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
