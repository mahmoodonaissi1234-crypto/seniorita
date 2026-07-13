import styles from "./Logo.module.css";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`${styles.logo} ${styles[size]}`}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path
          d="M12 2C8 6 6 10 6 13.5C6 17.09 8.69 20 12 20C15.31 20 18 17.09 18 13.5C18 10 16 6 12 2Z"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path d="M12 20V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span className={styles.word}>Seniorita</span>
    </div>
  );
}
