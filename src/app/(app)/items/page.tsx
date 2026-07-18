import { ItemsTable } from "./ItemsTable";
import styles from "./items.module.css";

export default function ItemsPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Items</h1>
        <p>Browse and manage the ring and bracelet catalog.</p>
      </div>

      <ItemsTable />
    </div>
  );
}
