"use client";

import { useState } from "react";
import styles from "./DeleteItemModal.module.css";

type Props = {
  count: number;
  onCancel: () => void;
  onConfirm: () => Promise<{ error?: string } | void>;
};

export function BulkDeleteModal({ count, onCancel, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    const result = await onConfirm();
    setDeleting(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h2>
          Delete {count} item{count === 1 ? "" : "s"}?
        </h2>
        <p className={styles.body}>This action cannot be undone.</p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button className={styles.deleteBtn} onClick={handleConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
