import { ImportCsvForm } from "./ImportCsvForm";
import styles from "./import.module.css";

export default function ImportItemsPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Import Items</h1>
        <p>Upload a CSV file to add many items at once.</p>
      </div>

      <ImportCsvForm />
    </div>
  );
}
