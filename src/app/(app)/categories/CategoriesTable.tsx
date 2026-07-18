"use client";

import { useEffect, useState } from "react";
import type { Gender } from "@/lib/categories";
import { CategoryModal, type CategoryFormValues } from "./CategoryModal";
import { DeleteCategoryModal } from "./DeleteCategoryModal";
import styles from "./categories.module.css";

type Category = {
  id: number;
  name: string;
  gender: string;
  description: string;
  _count: { items: number };
};

type ModalState =
  | { mode: "create" }
  | { mode: "edit"; category: Category }
  | null;

export function CategoriesTable() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    fetch("/api/categories")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load categories");
        return res.json();
      })
      .then((data: Category[]) => {
        if (!ignore) setCategories(data);
      })
      .catch(() => {
        if (!ignore) setError("Couldn't load categories. Check your connection and try again.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setActionError(null);

    const res = await fetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "Failed to delete category" };
    }

    setCategories((prev) => prev?.filter((c) => c.id !== deleteTarget.id) ?? null);
    setDeleteTarget(null);
    setToast("Category deleted");
  }

  async function handleModalSubmit(values: CategoryFormValues) {
    const isEdit = modal?.mode === "edit";
    const url = isEdit ? `/api/categories/${modal.category.id}` : "/api/categories";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();

    if (!res.ok) {
      return { error: data.error ?? "Failed to save category" };
    }

    setModal(null);
    setToast(isEdit ? "Category updated" : "Category created");
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.newBtn} onClick={() => setModal({ mode: "create" })}>
          New Category
        </button>
      </div>

      {toast && <p className={styles.toast}>{toast}</p>}
      {actionError && <p className={styles.actionError}>{actionError}</p>}

      {loading ? (
        <p className={styles.state}>Loading categories...</p>
      ) : error ? (
        <div className={styles.state}>
          <p>{error}</p>
          <button
            className={styles.retry}
            onClick={() => {
              setError(null);
              setLoading(true);
              setRefreshKey((k) => k + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : !categories || categories.length === 0 ? (
        <p className={styles.state}>No categories yet. Create one to get started.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Gender</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td className={styles.genderCell}>{category.gender}</td>
                <td>{category._count.items}</td>
                <td className={styles.actionsCell}>
                  <button
                    className={styles.editBtn}
                    onClick={() => setModal({ mode: "edit", category })}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setDeleteTarget(category)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <CategoryModal
          mode={modal.mode}
          initialValues={
            modal.mode === "edit"
              ? {
                  name: modal.category.name,
                  gender: modal.category.gender as Gender,
                  description: modal.category.description,
                }
              : { name: "", gender: "unisex", description: "" }
          }
          onClose={() => setModal(null)}
          onSubmit={handleModalSubmit}
        />
      )}

      {deleteTarget && (
        <DeleteCategoryModal
          category={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
