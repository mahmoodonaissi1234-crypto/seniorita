import { FinanceStats } from "./FinanceStats";
import styles from "./finance.module.css";

export default function FinancePage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Finance</h1>
        <p>Track revenue, costs, and profit for the business.</p>
      </div>

      <FinanceStats />
    </div>
  );
}
