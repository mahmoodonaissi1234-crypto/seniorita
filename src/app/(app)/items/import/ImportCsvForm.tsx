"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import styles from "./import.module.css";

type ValidRow = { row: number; name: string; status: "valid" };
type ErrorRow = { row: number; name: string; status: "error"; errors: string[] };
type ReportRow = ValidRow | ErrorRow;

type Report = {
  results: ReportRow[];
  summary: { total: number; valid: number; invalid: number };
};

type CommitResult = {
  created: Array<{ row: number; id: number; name: string }>;
  summary: { total: number; imported: number; skipped: number };
};

const COLUMNS: Array<{ name: string; required: boolean; notes: string }> = [
  { name: "name", required: true, notes: "Item name" },
  { name: "category", required: true, notes: "Must match an existing category name" },
  { name: "gender", required: true, notes: "men, women, or unisex" },
  { name: "type", required: true, notes: "ring or bracelet" },
  { name: "price", required: true, notes: "Positive number" },
  { name: "material", required: false, notes: "" },
  { name: "natureTheme", required: false, notes: "" },
  { name: "description", required: false, notes: "" },
  { name: "stock", required: false, notes: "Whole number, defaults to 0" },
  { name: "isActive", required: false, notes: "true/false, defaults to true" },
];

export function ImportCsvForm() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setReport(null);
    setCommitResult(null);
    setError(null);
    if (!file) {
      setFileName(null);
      setCsvText(null);
      return;
    }
    setFileName(file.name);
    const text = await file.text();
    setCsvText(text);
  }

  async function handleValidate() {
    if (!csvText) return;
    setValidating(true);
    setError(null);
    setReport(null);
    setCommitResult(null);
    try {
      const res = await fetch("/api/items/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Validation failed");
        return;
      }
      setReport(data);
    } catch {
      setError("Could not reach the server");
    } finally {
      setValidating(false);
    }
  }

  async function handleCommit() {
    if (!csvText) return;
    setCommitting(true);
    setError(null);
    try {
      const res = await fetch("/api/items/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }
      setCommitResult(data);
    } catch {
      setError("Could not reach the server");
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className={styles.content}>
      <div className={styles.formatBox}>
        <h2>Column format</h2>
        <p>The first row must be a header with these column names (any order):</p>
        <table className={styles.formatTable}>
          <thead>
            <tr>
              <th>Column</th>
              <th>Required</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {COLUMNS.map((c) => (
              <tr key={c.name}>
                <td>{c.name}</td>
                <td>{c.required ? "Yes" : "No"}</td>
                <td>{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.uploadBox}>
        <label className={styles.fileLabel}>
          Choose CSV file
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} />
        </label>
        {fileName && <span className={styles.fileName}>{fileName}</span>}

        <button
          className={styles.validateBtn}
          onClick={handleValidate}
          disabled={!csvText || validating}
        >
          {validating ? "Validating..." : "Validate"}
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {report && !commitResult && (
        <div className={styles.report}>
          <p className={styles.summary}>
            {report.summary.total} row(s) checked &mdash; {report.summary.valid} valid,{" "}
            {report.summary.invalid} with errors.
          </p>

          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Row</th>
                <th>Name</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {report.results.map((r) => (
                <tr key={r.row}>
                  <td>{r.row}</td>
                  <td>{r.name}</td>
                  <td className={r.status === "error" ? styles.statusError : styles.statusOk}>
                    {r.status === "valid" ? "Valid" : "Error"}
                  </td>
                  <td>{r.status === "error" ? r.errors.join("; ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {report.summary.valid > 0 ? (
            <button className={styles.commitBtn} onClick={handleCommit} disabled={committing}>
              {committing
                ? "Importing..."
                : `Import ${report.summary.valid} valid row(s)`}
            </button>
          ) : (
            <p className={styles.noneValid}>No valid rows to import.</p>
          )}
        </div>
      )}

      {commitResult && (
        <div className={styles.report}>
          <p className={styles.summary}>
            Imported {commitResult.summary.imported} item(s)
            {commitResult.summary.skipped > 0
              ? `, skipped ${commitResult.summary.skipped} with errors.`
              : "."}
          </p>
          <Link href="/items" className={styles.backLink}>
            Back to Items
          </Link>
        </div>
      )}
    </div>
  );
}
