import { ActivityLogTable } from "./ActivityLogTable";
import styles from "./activity.module.css";

export default function ActivityPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Activity Log</h1>
        <p>See who changed what, and when.</p>
      </div>

      <ActivityLogTable />
    </div>
  );
}
