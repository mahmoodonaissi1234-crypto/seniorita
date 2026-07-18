"use client";

import { useState } from "react";
import styles from "./DeleteCategoryModal.module.css";

type Category = {
  id: number;
  name: string;
  _count: { items: number };
};

type Props = {
  category: Category;
  onCancel: () => void;
  onConfirm: () => Promise<{ error?: string } | void>;
};

export function DeleteCategoryModal({ category, onCancel, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = category._count.items > 0;

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
        {blocked ? (
          <>
            <h2>Cannot delete &quot;{category.name}&quot;</h2>
            <p className={styles.body}>
              This category has {category._count.items} item{category._count.items === 1 ? "" : "s"}{" "}
              assigned to it. Reassign or delete those items first, then try again.
            </p>
            <div className={styles.actions}>
              <button className={styles.closeBtn} onClick={onCancel}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Delete &quot;{category.name}&quot;?</h2>
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
          </>
        )}
      </div>
    </div>
  );
}
