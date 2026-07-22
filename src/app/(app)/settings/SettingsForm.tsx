"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ALLOWED_GENDERS, type Gender } from "@/lib/categories";
import { ALLOWED_CURRENCIES, type Currency } from "@/lib/storePreferences";
import styles from "./settings.module.css";

type Settings = {
  ownerName: string;
  email: string;
  businessName: string;
  logoUrl: string | null;
  currency: string;
  taxRatePercent: number;
  defaultGenders: string[];
  maintenanceMode: boolean;
  lowStockThreshold: number;
};

type FormValues = {
  ownerName: string;
  email: string;
  businessName: string;
  logoUrl: string | null;
  currency: Currency;
  taxRatePercent: string;
  defaultGenders: Gender[];
  maintenanceMode: boolean;
  lowStockThreshold: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: "owner" | "staff";
};

const EMPTY_FORM: FormValues = {
  ownerName: "",
  email: "",
  businessName: "",
  logoUrl: null,
  currency: "USD",
  taxRatePercent: "0",
  defaultGenders: [...ALLOWED_GENDERS],
  maintenanceMode: false,
  lowStockThreshold: "5",
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
  if (!values.businessName.trim())
    errors.businessName = "Business name is required";

  const taxRate = Number(values.taxRatePercent);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    errors.taxRatePercent = "Enter a tax rate between 0 and 100 (0 if none)";
  }

  if (values.defaultGenders.length === 0) {
    errors.defaultGenders = "Select at least one gender category";
  }

  const lowStockThreshold = Number(values.lowStockThreshold);
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    errors.lowStockThreshold = "Enter a whole number, 0 or greater";
  }

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
  const [forbidden, setForbidden] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<TeamMember[]>([]);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [staffError, setStaffError] = useState<string | null>(null);
  const [addingStaff, setAddingStaff] = useState(false);

  useEffect(() => {
    let ignore = false;

    fetch("/api/settings")
      .then(async (res) => {
        if (res.status === 403) {
          const err = new Error("forbidden");
          err.name = "ForbiddenError";
          throw err;
        }
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
            currency: (data.currency as Currency) ?? "USD",
            taxRatePercent: String(data.taxRatePercent ?? 0),
            defaultGenders: (data.defaultGenders as Gender[]) ?? [
              ...ALLOWED_GENDERS,
            ],
            maintenanceMode: data.maintenanceMode ?? false,
            lowStockThreshold: String(data.lowStockThreshold ?? 5),
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      })
      .catch((err) => {
        if (ignore) return;
        if (err instanceof Error && err.name === "ForbiddenError") {
          setForbidden(true);
        } else {
          setLoadError(
            "Couldn't load settings. Check your connection and try again.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: TeamMember[]) => {
        if (!ignore) setUsers(data);
      })
      .catch(() => {
        /* Team section just stays empty; not critical to the rest of the page working */
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

  function toggleDefaultGender(gender: Gender) {
    setValues((prev) => ({
      ...prev,
      defaultGenders: prev.defaultGenders.includes(gender)
        ? prev.defaultGenders.filter((g) => g !== gender)
        : [...prev.defaultGenders, gender],
    }));
  }

  async function handleAddStaff(event: React.FormEvent) {
    event.preventDefault();
    setStaffError(null);
    setAddingStaff(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStaff),
    });
    const data = await res.json();
    setAddingStaff(false);

    if (!res.ok) {
      setStaffError(data.error ?? "Failed to add staff member");
      return;
    }

    setUsers((prev) => [...prev, data]);
    setNewStaff({ name: "", email: "", password: "" });
    setToast("Staff member added");
  }

  async function handleRemoveStaff(id: number) {
    setStaffError(null);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setStaffError(data.error ?? "Failed to remove staff member");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
    setToast("Staff member removed");
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
        currency: values.currency,
        taxRatePercent: Number(values.taxRatePercent),
        defaultGenders: values.defaultGenders,
        maintenanceMode: values.maintenanceMode,
        lowStockThreshold: Number(values.lowStockThreshold),
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

  if (forbidden) {
    return (
      <div className={styles.state}>
        <p>
          Only the business owner can view Settings. If you need something
          changed here, ask them.
        </p>
      </div>
    );
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
    <div className={styles.form}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>

          <label className={styles.field}>
            Name
            <input
              value={values.ownerName}
              onChange={(e) =>
                setValues({ ...values, ownerName: e.target.value })
              }
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
            {fieldErrors.email && (
              <span className={styles.fieldError}>{fieldErrors.email}</span>
            )}
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Change Password</h2>

          <label className={styles.field}>
            Current Password
            <input
              type="password"
              value={values.currentPassword}
              onChange={(e) =>
                setValues({ ...values, currentPassword: e.target.value })
              }
            />
            {fieldErrors.currentPassword && (
              <span className={styles.fieldError}>
                {fieldErrors.currentPassword}
              </span>
            )}
          </label>

          <label className={styles.field}>
            New Password
            <input
              type="password"
              value={values.newPassword}
              onChange={(e) =>
                setValues({ ...values, newPassword: e.target.value })
              }
            />
            {fieldErrors.newPassword && (
              <span className={styles.fieldError}>
                {fieldErrors.newPassword}
              </span>
            )}
          </label>

          <label className={styles.field}>
            Confirm New Password
            <input
              type="password"
              value={values.confirmPassword}
              onChange={(e) =>
                setValues({ ...values, confirmPassword: e.target.value })
              }
            />
            {fieldErrors.confirmPassword && (
              <span className={styles.fieldError}>
                {fieldErrors.confirmPassword}
              </span>
            )}
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Business</h2>

          <label className={styles.field}>
            Business Name
            <input
              value={values.businessName}
              onChange={(e) =>
                setValues({ ...values, businessName: e.target.value })
              }
            />
            {fieldErrors.businessName && (
              <span className={styles.fieldError}>
                {fieldErrors.businessName}
              </span>
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

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Inventory</h2>

          <label className={styles.field}>
            Low Stock Threshold
            <input
              type="number"
              min="0"
              step="1"
              value={values.lowStockThreshold}
              onChange={(e) =>
                setValues({ ...values, lowStockThreshold: e.target.value })
              }
            />
            <span className={styles.fieldHint}>
              Items with fewer units in stock than this show up as low stock
              on the Dashboard. An individual item can override this on its
              own edit form.
            </span>
            {fieldErrors.lowStockThreshold && (
              <span className={styles.fieldError}>
                {fieldErrors.lowStockThreshold}
              </span>
            )}
          </label>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Store Preferences</h2>
          <p className={styles.sectionNote}>
            These control the public storefront once it exists — they don&apos;t
            affect the admin app you&apos;re using now.
          </p>

          <label className={styles.field}>
            Currency
            <select
              value={values.currency}
              onChange={(e) =>
                setValues({ ...values, currency: e.target.value as Currency })
              }
            >
              {ALLOWED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            Tax Rate (%)
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={values.taxRatePercent}
              onChange={(e) =>
                setValues({ ...values, taxRatePercent: e.target.value })
              }
            />
            <span className={styles.fieldHint}>
              Set to 0 if you don&apos;t charge sales tax.
            </span>
            {fieldErrors.taxRatePercent && (
              <span className={styles.fieldError}>
                {fieldErrors.taxRatePercent}
              </span>
            )}
          </label>

          <div className={styles.field}>
            Default Gender Categories Shown
            <div className={styles.checkboxRow}>
              {ALLOWED_GENDERS.map((gender) => (
                <label
                  key={gender}
                  className={`${styles.checkboxLabel} ${styles.genderLabel}`}
                >
                  <input
                    type="checkbox"
                    checked={values.defaultGenders.includes(gender)}
                    onChange={() => toggleDefaultGender(gender)}
                  />
                  {gender}
                </label>
              ))}
            </div>
            {fieldErrors.defaultGenders && (
              <span className={styles.fieldError}>
                {fieldErrors.defaultGenders}
              </span>
            )}
          </div>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={values.maintenanceMode}
              onChange={(e) =>
                setValues({ ...values, maintenanceMode: e.target.checked })
              }
            />
            Maintenance mode (public site shows a &quot;coming soon&quot; page)
          </label>
        </section>

        {submitError && <p className={styles.submitError}>{submitError}</p>}

        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {toast && <div className={styles.toast}>{toast}</div>}
      </form>

      <form className={styles.section} onSubmit={handleAddStaff} noValidate>
        <h2 className={styles.sectionTitle}>Team</h2>
        <p className={styles.sectionNote}>
          Staff accounts can view and edit Items and Categories, but not Finance
          or Settings.
        </p>

        {users.length > 0 && (
          <ul className={styles.teamList}>
            {users.map((member) => (
              <li key={member.id} className={styles.teamRow}>
                <div>
                  <div className={styles.teamName}>{member.name}</div>
                  <div className={styles.teamEmail}>{member.email}</div>
                </div>
                <span className={styles.teamRole}>{member.role}</span>
                {member.role === "staff" && (
                  <button
                    type="button"
                    className={styles.teamRemoveBtn}
                    onClick={() => handleRemoveStaff(member.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <label className={styles.field}>
          Name
          <input
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
          />
        </label>

        <label className={styles.field}>
          Email
          <input
            type="email"
            value={newStaff.email}
            onChange={(e) =>
              setNewStaff({ ...newStaff, email: e.target.value })
            }
          />
        </label>

        <label className={styles.field}>
          Password
          <input
            type="password"
            value={newStaff.password}
            onChange={(e) =>
              setNewStaff({ ...newStaff, password: e.target.value })
            }
          />
        </label>

        {staffError && <p className={styles.submitError}>{staffError}</p>}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={addingStaff}
          >
            {addingStaff ? "Adding..." : "Add Staff Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
