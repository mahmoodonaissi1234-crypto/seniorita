import styles from "./PlaceholderPage.module.css";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.wrap}>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
