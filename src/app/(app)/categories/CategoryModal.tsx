"use client";

import { useState, type FormEvent } from "react";
import { ALLOWED_GENDERS, type Gender } from "@/lib/categories";
import styles from "./CategoryModal.module.css";

export type CategoryFormValues = {
  name: string;
  gender: Gender;
  description: string;
};

type FieldErrors = Partial<Record<keyof CategoryFormValues, string>>;

type Props = {
  mode: "create" | "edit";
  initialValues: CategoryFormValues;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<{ error?: string } | void>;
};

function validate(values: CategoryFormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) {
    errors.name = "Name is required";
  }
  if (!(ALLOWED_GENDERS as readonly string[]).includes(values.gender)) {
    errors.gender = "Select a valid gender";
  }
  return errors;
}

export function CategoryModal({ mode, initialValues, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues);
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
        <h2>{mode === "create" ? "New Category" : "Edit Category"}</h2>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            Name
            <input
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
            {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
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
            {fieldErrors.gender && (
              <span className={styles.fieldError}>{fieldErrors.gender}</span>
            )}
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
