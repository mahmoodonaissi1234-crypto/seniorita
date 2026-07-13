import styles from "./home.module.css";

export default function HomePage() {
  return (
    <div className={styles.home}>
      <h1>Welcome back</h1>
      <p className={styles.lead}>
        Seniorita is a small, private-labeled jewelry studio crafting rings and bracelets
        inspired by the textures, colors, and quiet details of the natural world. Every
        piece is designed in-house, drawing from leaves, stones, and organic forms, then
        produced in small batches to keep the collection intentional rather than mass-made.
      </p>
      <p className={styles.lead}>
        This dashboard is where the business runs day to day: track inventory in{" "}
        <strong>Items</strong>, organize the catalog in <strong>Categories</strong>, keep
        an eye on money in <strong>Finance</strong>, and adjust preferences in{" "}
        <strong>Settings</strong>.
      </p>
    </div>
  );
}
