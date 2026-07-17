import { CategoriesTable } from "./CategoriesTable";
import styles from "./categories.module.css";

export default function CategoriesPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Categories</h1>
        <p>Manage the collections items are organized into.</p>
      </div>

      <CategoriesTable />
    </div>
  );
}
