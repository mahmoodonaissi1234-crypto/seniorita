"use client";

import { useState, type FormEvent } from "react";
import { ALLOWED_GENDERS, type Gender } from "@/lib/categories";
import { ALLOWED_ITEM_TYPES, type ItemType } from "@/lib/items";
import styles from "./ItemModal.module.css";

export type Category = { id: number; name: string };

export type ItemFormValues = {
  name: string;
  categoryId: number | "";
  gender: Gender;
  type: ItemType;
  price: string;
  material: string;
  natureTheme: string;
  description: string;
  stock: string;
};

type FieldErrors = Partial<Record<keyof ItemFormValues, string>>;

type Props = {
  mode: "create" | "edit";
  categories: Category[];
  initialValues: ItemFormValues;
  onClose: () => void;
  onSubmit: (values: ItemFormValues) => Promise<{ error?: string } | void>;
};

function validate(values: ItemFormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) {
    errors.name = "Name is required";
  }
  if (values.categoryId === "") {
    errors.categoryId = "Category is required";
  }
  const price = Number(values.price);
  if (values.price.trim() === "" || !Number.isFinite(price) || price <= 0) {
    errors.price = "Price must be a positive number";
  }
  return errors;
}

export function ItemModal({ mode, categories, initialValues, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<ItemFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setSubmitError(null);
    const result = await onSubmit(values);
    setSaving(false);

    if (result?.error) {
      setSubmitError(result.error);
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <h2>{mode === "create" ? "New Item" : "Edit Item"}</h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            Name
            <input
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
            {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              Category
              <select
                value={values.categoryId}
                onChange={(e) =>
                  setValues({ ...values, categoryId: Number(e.target.value) || "" })
                }
              >
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <span className={styles.fieldError}>{fieldErrors.categoryId}</span>
              )}
            </label>

            <label className={styles.field}>
              Gender
              <select
                value={values.gender}
                onChange={(e) => setValues({ ...values, gender: e.target.value as Gender })}
              >
                {ALLOWED_GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              Type
              <select
                value={values.type}
                onChange={(e) => setValues({ ...values, type: e.target.value as ItemType })}
              >
                {ALLOWED_ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              Price
              <input
                type="number"
                step="0.01"
                value={values.price}
                onChange={(e) => setValues({ ...values, price: e.target.value })}
              />
              {fieldErrors.price && (
                <span className={styles.fieldError}>{fieldErrors.price}</span>
              )}
            </label>
          </div>

          <div className={styles.row}>
            <label className={styles.field}>
              Material
              <input
                value={values.material}
                onChange={(e) => setValues({ ...values, material: e.target.value })}
              />
            </label>

            <label className={styles.field}>
              Stock
              <input
                type="number"
                min="0"
                step="1"
                value={values.stock}
                onChange={(e) => setValues({ ...values, stock: e.target.value })}
              />
            </label>
          </div>

          <label className={styles.field}>
            Nature theme
            <input
              value={values.natureTheme}
              onChange={(e) => setValues({ ...values, natureTheme: e.target.value })}
            />
          </label>

          <label className={styles.field}>
            Description
            <textarea
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              rows={3}
            />
          </label>

          {submitError && <p className={styles.submitError}>{submitError}</p>}

          <div className={styles.actions}>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
