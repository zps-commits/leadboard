'use client';

import { Modal } from './Modal';

/**
 * Deleting is the one action here with no undo, so it asks, and it
 * names what will go with it.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-muted">{message}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-2 rounded-lg bg-bad px-3.5 py-2 font-medium text-surface hover:brightness-110"
        >
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className="button-quiet">
          Keep it
        </button>
      </div>
    </Modal>
  );
}
