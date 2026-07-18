"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./settings.module.css";

type Settings = {
  ownerName: string;
  email: string;
  businessName: string;
  logoUrl: string | null;
};

type FormValues = {
  ownerName: string;
  email: string;
  businessName: string;
  logoUrl: string | null;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  ownerName: "",
  email: "",
  businessName: "",
  logoUrl: null,
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.ownerName.trim()) errors.ownerName = "Name is required";
  if (!values.email.trim() || !values.email.includes("@")) {
    errors.email = "A valid email is required";
  }
  if (!values.businessName.trim()) errors.businessName = "Business name is required";

  if (values.newPassword || values.confirmPassword || values.currentPassword) {
    if (!values.currentPassword) {
      errors.currentPassword = "Enter your current password to change it";
    }
    if (values.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters";
    }
    if (values.newPassword !== values.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  return errors;
}

export function SettingsForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;

    fetch("/api/settings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load settings");
        return res.json();
      })
      .then((data: Settings) => {
        if (!ignore) {
          setValues({
            ownerName: data.ownerName,
            email: data.email,
            businessName: data.businessName,
            logoUrl: data.logoUrl,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      })
      .catch(() => {
        if (!ignore) setLoadError("Couldn't load settings. Check your connection and try again.");
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

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setValues((prev) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setSubmitError(null);

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName: values.ownerName,
        email: values.email,
        businessName: values.businessName,
        logoUrl: values.logoUrl,
        currentPassword: values.currentPassword || undefined,
        newPassword: values.newPassword || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setSubmitError(data.error ?? "Failed to save settings");
      return;
    }

    setValues((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setToast("Settings saved");
  }

  if (loading) {
    return <p className={styles.state}>Loading settings...</p>;
  }

  if (loadError) {
    return (
      <div className={styles.state}>
        <p>{loadError}</p>
        <button
          className={styles.retry}
          onClick={() => {
            setLoadError(null);
            setLoading(true);
            setRefreshKey((k) => k + 1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>

        <label className={styles.field}>
          Name
          <input
            value={values.ownerName}
            onChange={(e) => setValues({ ...values, ownerName: e.target.value })}
          />
          {fieldErrors.ownerName && (
            <span className={styles.fieldError}>{fieldErrors.ownerName}</span>
          )}
        </label>

        <label className={styles.field}>
          Email
          <input
            type="email"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
          {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Change Password</h2>

        <label className={styles.field}>
          Current Password
          <input
            type="password"
            value={values.currentPassword}
            onChange={(e) => setValues({ ...values, currentPassword: e.target.value })}
          />
          {fieldErrors.currentPassword && (
            <span className={styles.fieldError}>{fieldErrors.currentPassword}</span>
          )}
        </label>

        <label className={styles.field}>
          New Password
          <input
            type="password"
            value={values.newPassword}
            onChange={(e) => setValues({ ...values, newPassword: e.target.value })}
          />
          {fieldErrors.newPassword && (
            <span className={styles.fieldError}>{fieldErrors.newPassword}</span>
          )}
        </label>

        <label className={styles.field}>
          Confirm New Password
          <input
            type="password"
            value={values.confirmPassword}
            onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })}
          />
          {fieldErrors.confirmPassword && (
            <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span>
          )}
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Business</h2>

        <label className={styles.field}>
          Business Name
          <input
            value={values.businessName}
            onChange={(e) => setValues({ ...values, businessName: e.target.value })}
          />
          {fieldErrors.businessName && (
            <span className={styles.fieldError}>{fieldErrors.businessName}</span>
          )}
        </label>

        <div className={styles.field}>
          Logo
          <div className={styles.logoRow}>
            {values.logoUrl ? (
              <Image
                src={values.logoUrl}
                alt="Business logo"
                width={64}
                height={64}
                unoptimized
                className={styles.logoPreview}
              />
            ) : (
              <div className={styles.logoPlaceholder}>No logo</div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
            />
          </div>
        </div>
      </section>

      {submitError && <p className={styles.submitError}>{submitError}</p>}

      <div className={styles.actions}>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </form>
  );
}
