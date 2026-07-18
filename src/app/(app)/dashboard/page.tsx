import { DashboardStats } from "./DashboardStats";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>A quick look at how the business is doing.</p>
      </div>

      <DashboardStats />
    </div>
  );
}
