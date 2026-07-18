import { Suspense } from "react";
import { ItemsTable } from "./ItemsTable";
import styles from "./items.module.css";

export default function ItemsPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Items</h1>
        <p>Browse and manage the ring and bracelet catalog.</p>
      </div>

      <Suspense fallback={<p className={styles.state}>Loading items...</p>}>
        <ItemsTable />
      </Suspense>
    </div>
  );
}
