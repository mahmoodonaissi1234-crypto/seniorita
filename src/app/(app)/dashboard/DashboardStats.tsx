"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";

type Item = {
  price: number;
  stock: number;
};

type Category = {
  id: number;
};

// No threshold was specified in the ticket; 5 units is a reasonable
// low-stock cutoff for a small catalog like this one.
const LOW_STOCK_THRESHOLD = 5;

export function DashboardStats() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([fetch("/api/items"), fetch("/api/categories")])
      .then(async ([itemsRes, categoriesRes]) => {
        if (!itemsRes.ok || !categoriesRes.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const [itemsData, categoriesData] = await Promise.all([
          itemsRes.json(),
          categoriesRes.json(),
        ]);
        if (!ignore) {
          setItems(itemsData);
          setCategories(categoriesData);
        }
      })
      .catch(() => {
        if (!ignore) setError("Couldn't load dashboard data. Check your connection and try again.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  if (loading) {
    return <p className={styles.state}>Loading dashboard...</p>;
  }

  if (error || !items || !categories) {
    return (
      <div className={styles.state}>
        <p>{error ?? "Couldn't load dashboard data."}</p>
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

  const totalItems = items.length;
  const totalCategories = categories.length;
  const lowStockCount = items.filter((i) => i.stock < LOW_STOCK_THRESHOLD).length;
  const inventoryValue = items.reduce((sum, i) => sum + i.price * i.stock, 0);

  const cards = [
    { label: "Total Items", value: totalItems.toLocaleString() },
    { label: "Total Categories", value: totalCategories.toLocaleString() },
    { label: "Low Stock Items", value: lowStockCount.toLocaleString() },
    {
      label: "Total Inventory Value",
      value: inventoryValue.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <div key={card.label} className={styles.card}>
          <span className={styles.cardLabel}>{card.label}</span>
          <span className={styles.cardValue}>{card.value}</span>
        </div>
      ))}
    </div>
  );
}
