import { prisma } from "@/lib/db";
import styles from "./categories.module.css";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Categories</h1>
        <p>{categories.length} collections</p>
      </div>

      <div className={styles.list}>
        {categories.map((category) => (
          <div key={category.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>{category.name}</h2>
              <span className={styles.gender}>{category.gender}</span>
            </div>
            <p className={styles.description}>{category.description}</p>
            <p className={styles.count}>{category._count.items} items</p>
          </div>
        ))}
      </div>
    </div>
  );
}
