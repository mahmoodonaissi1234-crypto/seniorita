"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";

type Item = {
  id: number;
  name: string;
  price: number;
  stock: number;
  lowStockThreshold: number | null;
  createdAt: string;
};

type Category = {
  id: number;
};

const RECENT_ITEMS_COUNT = 5;

function effectiveThreshold(item: Item, globalThreshold: number): number {
  return item.lowStockThreshold ?? globalThreshold;
}

export function DashboardStats() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    Promise.all([
      fetch("/api/items"),
      fetch("/api/categories"),
      fetch("/api/settings/low-stock-threshold"),
    ])
      .then(async ([itemsRes, categoriesRes, thresholdRes]) => {
        if (!itemsRes.ok || !categoriesRes.ok) {
          throw new Error("Failed to load dashboard data");
        }
        const [itemsData, categoriesData] = await Promise.all([
          itemsRes.json(),
          categoriesRes.json(),
        ]);
        const thresholdData = thresholdRes.ok ? await thresholdRes.json() : null;
        if (!ignore) {
          setItems(itemsData);
          setCategories(categoriesData);
          if (thresholdData) setLowStockThreshold(thresholdData.lowStockThreshold);
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
  const lowStockItems = items
    .filter((i) => i.stock < effectiveThreshold(i, lowStockThreshold))
    .sort((a, b) => a.stock - b.stock);
  const inventoryValue = items.reduce((sum, i) => sum + i.price * i.stock, 0);

  const cards = [
    { label: "Total Items", value: totalItems.toLocaleString() },
    { label: "Total Categories", value: totalCategories.toLocaleString() },
    { label: "Low Stock Items", value: lowStockItems.length.toLocaleString() },
    {
      label: "Total Inventory Value",
      value: inventoryValue.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
    },
  ];

  const recentItems = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_ITEMS_COUNT);

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

      {lowStockItems.length > 0 && (
        <div className={styles.lowStockBanner}>
          <h2 className={styles.recentTitle}>
            Low Stock ({lowStockItems.length})
          </h2>
          <ul className={styles.recentList}>
            {lowStockItems.map((item) => (
              <li key={item.id} className={styles.recentRow}>
                <Link href={`/items?edit=${item.id}`} className={styles.recentLink}>
                  {item.name}
                </Link>
                <span className={styles.lowStockCount}>
                  {item.stock} left (threshold {effectiveThreshold(item, lowStockThreshold)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.recentSection}>
        <h2 className={styles.recentTitle}>Recently Added</h2>
        {recentItems.length === 0 ? (
          <p className={styles.state}>No items yet.</p>
        ) : (
          <ul className={styles.recentList}>
            {recentItems.map((item) => (
              <li key={item.id} className={styles.recentRow}>
                <Link href={`/items?edit=${item.id}`} className={styles.recentLink}>
                  {item.name}
                </Link>
                <span className={styles.recentDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
