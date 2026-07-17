"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ALLOWED_GENDERS, type Gender } from "@/lib/categories";
import styles from "./categories.module.css";

type Category = {
  id: number;
  name: string;
  gender: string;
  description: string;
  _count: { items: number };
};

type EditForm = {
  name: string;
  gender: Gender;
  description: string;
};

export function CategoriesTable() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  function startEdit(category: Category) {
    setActionError(null);
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      gender: category.gender as Gender,
      description: category.description,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(event: FormEvent, id: number) {
    event.preventDefault();
    if (!editForm) return;
    setSaving(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update category");

      setCategories(
        (prev) => prev?.map((c) => (c.id === id ? { ...c, ...data } : c)) ?? null
      );
      cancelEdit();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"?`)) return;
    setActionError(null);

    try {
      const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete category");

      setCategories((prev) => prev?.filter((c) => c.id !== category.id) ?? null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  if (loading) {
    return <p className={styles.state}>Loading categories...</p>;
  }

  if (error) {
    return (
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
    );
  }

  if (!categories || categories.length === 0) {
    return <p className={styles.state}>No categories yet.</p>;
  }

  return (
    <div>
      {actionError && <p className={styles.actionError}>{actionError}</p>}

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
          {categories.map((category) =>
            editingId === category.id && editForm ? (
              <tr key={category.id}>
                <td colSpan={4}>
                  <form className={styles.editRow} onSubmit={(e) => saveEdit(e, category.id)}>
                    <input
                      className={styles.editInput}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                      aria-label="Category name"
                    />
                    <select
                      className={styles.editInput}
                      value={editForm.gender}
                      onChange={(e) =>
                        setEditForm({ ...editForm, gender: e.target.value as Gender })
                      }
                      aria-label="Gender"
                    >
                      {ALLOWED_GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <input
                      className={styles.editInput}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                      aria-label="Description"
                    />
                    <div className={styles.editActions}>
                      <button type="submit" className={styles.saveBtn} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button type="button" className={styles.cancelBtn} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td className={styles.genderCell}>{category.gender}</td>
                <td>{category._count.items}</td>
                <td className={styles.actionsCell}>
                  <button className={styles.editBtn} onClick={() => startEdit(category)}>
                    Edit
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(category)}>
                    Delete
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
