"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./finance.module.css";

type Item = {
  price: number;
  stock: number;
};

type Transaction = {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
};

type MonthlyTotal = {
  key: string;
  label: string;
  sales: number;
  expenses: number;
};

const currency = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Validated via the dataviz skill's validate_palette.js against both light
// and dark chart surfaces (blue/green pass every check; our brand sage
// greens fail the chroma floor at every saturation tried).
function useChartColors() {
  const [isDark, setIsDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => setIsDark(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return {
    sales: isDark ? "#3987e5" : "#2a78d6",
    expenses: "#008300",
  };
}

function groupByMonth(transactions: Transaction[]): MonthlyTotal[] {
  const byMonth = new Map<string, MonthlyTotal>();

  for (const transaction of transactions) {
    const date = new Date(transaction.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const entry = byMonth.get(key) ?? { key, label, sales: 0, expenses: 0 };

    if (transaction.type === "sale") entry.sales += transaction.amount;
    else if (transaction.type === "expense") entry.expenses += transaction.amount;

    byMonth.set(key, entry);
  }

  return [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function FinanceStats() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const colors = useChartColors();

  useEffect(() => {
    let ignore = false;

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();

    Promise.all([fetch("/api/items"), fetch(`/api/transactions${qs ? `?${qs}` : ""}`)])
      .then(async ([itemsRes, transactionsRes]) => {
        if (transactionsRes.status === 403) {
          const err = new Error("forbidden");
          err.name = "ForbiddenError";
          throw err;
        }
        if (!itemsRes.ok || !transactionsRes.ok) {
          throw new Error("Failed to load finance data");
        }
        const [itemsData, transactionsData] = await Promise.all([
          itemsRes.json(),
          transactionsRes.json(),
        ]);
        if (!ignore) {
          setItems(itemsData);
          setTransactions(transactionsData);
        }
      })
      .catch((err) => {
        if (ignore) return;
        if (err instanceof Error && err.name === "ForbiddenError") {
          setError("Only the business owner can view Finance. If you need something here, ask them.");
        } else {
          setError("Couldn't load finance data. Check your connection and try again.");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [from, to, refreshKey]);

  if (loading) {
    return <p className={styles.state}>Loading finance data...</p>;
  }

  if (error || !items || !transactions) {
    return (
      <div className={styles.state}>
        <p>{error ?? "Couldn't load finance data."}</p>
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

  const totalInventoryValue = items.reduce((sum, i) => sum + i.price * i.stock, 0);
  const totalSales = transactions
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const cards = [
    { label: "Total Inventory Value", value: currency(totalInventoryValue) },
    { label: "Total Sales", value: currency(totalSales) },
    { label: "Total Expenses", value: currency(totalExpenses) },
  ];

  const monthly = groupByMonth(transactions);

  return (
    <div className={styles.stack}>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} className={styles.card}>
            <span className={styles.cardLabel}>{card.label}</span>
            <span className={styles.cardValue}>{card.value}</span>
          </div>
        ))}
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterField}>
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className={styles.filterField}>
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        {(from || to) && (
          <button
            type="button"
            className={styles.clearFilter}
            onClick={() => {
              setFrom("");
              setTo("");
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.chartSection}>
        <h2 className={styles.chartTitle}>Sales & Expenses by Month</h2>

        {monthly.length === 0 ? (
          <p className={styles.state}>No transactions in this date range.</p>
        ) : (
          <>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthly} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--ink)" tick={{ fontSize: 12 }} />
                  <YAxis
                    stroke="var(--ink)"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: number) => currency(value)}
                    width={80}
                  />
                  <Tooltip formatter={(value) => currency(Number(value))} />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill={colors.sales} radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill={colors.expenses}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <table className={styles.dataTable}>
              <caption className={styles.visuallyHidden}>
                Monthly sales and expenses totals
              </caption>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Sales</th>
                  <th>Expenses</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td>{currency(row.sales)}</td>
                    <td>{currency(row.expenses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
