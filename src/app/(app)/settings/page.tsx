import { SettingsForm } from "./SettingsForm";
import styles from "./settings.module.css";

export default function SettingsPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account and business details.</p>
      </div>

      <SettingsForm />
    </div>
  );
}
