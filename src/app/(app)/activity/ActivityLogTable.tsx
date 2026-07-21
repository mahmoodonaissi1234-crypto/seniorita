"use client";

import { useEffect, useState } from "react";
import styles from "./activity.module.css";

type LogEntry = {
  id: number;
  userId: number | null;
  userName: string;
  action: string;
  entityType: string;
  entityId: number;
  timestamp: string;
};

type UserOption = {
  id: number;
  name: string;
};

export function ActivityLogTable() {
  const [entries, setEntries] = useState<LogEntry[] | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [userFilter, setUserFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    let ignore = false;

    const params = new URLSearchParams();
    if (userFilter) params.set("userId", userFilter);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();

    fetch(`/api/activity-log${qs ? `?${qs}` : ""}`)
      .then(async (res) => {
        if (res.status === 403) {
          const err = new Error("forbidden");
          err.name = "ForbiddenError";
          throw err;
        }
        if (!res.ok) throw new Error("Failed to load activity log");
        return res.json();
      })
      .then((data: LogEntry[]) => {
        if (!ignore) setEntries(data);
      })
      .catch((err) => {
        if (ignore) return;
        if (err instanceof Error && err.name === "ForbiddenError") {
          setForbidden(true);
        } else {
          setError("Couldn't load the activity log. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [userFilter, from, to, refreshKey]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/users")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: UserOption[]) => {
        if (!ignore) setUsers(data);
      })
      .catch(() => {
        /* filter dropdown just stays empty; not critical to the page working */
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <p className={styles.state}>Loading activity log...</p>;
  }

  if (forbidden) {
    return (
      <div className={styles.state}>
        <p>
          Only the business owner can view the activity log. If you need something looked up
          here, ask them.
        </p>
      </div>
    );
  }

  if (error || !entries) {
    return (
      <div className={styles.state}>
        <p>{error ?? "Couldn't load the activity log."}</p>
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

  return (
    <div className={styles.stack}>
      <div className={styles.filterRow}>
        <label className={styles.filterField}>
          <span>User</span>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.filterField}>
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>

        <label className={styles.filterField}>
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>

        {(userFilter || from || to) && (
          <button
            type="button"
            className={styles.clearFilter}
            onClick={() => {
              setUserFilter("");
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className={styles.state}>No activity recorded yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>{entry.userName}</td>
                <td className={styles.action}>{entry.action}</td>
                <td className={styles.entityType}>{entry.entityType}</td>
                <td>{entry.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
