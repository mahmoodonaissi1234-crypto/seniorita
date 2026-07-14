import Image from "next/image";
import { prisma } from "@/lib/db";
import { parseImages } from "@/lib/items";
import styles from "./items.module.css";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1>Items</h1>
        <p>{items.length} pieces in the catalog</p>
      </div>

      <div className={styles.grid}>
        {items.map((item) => {
          const [image] = parseImages(item.images);
          return (
            <div key={item.id} className={styles.card}>
              <div className={styles.imageWrap}>
                {image && (
                  <Image
                    src={image}
                    alt={item.name}
                    fill
                    unoptimized
                    className={styles.image}
                  />
                )}
                {!item.isActive && <span className={styles.inactiveBadge}>Inactive</span>}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.category}>{item.category.name}</span>
                <h2>{item.name}</h2>
                <p className={styles.theme}>{item.natureTheme}</p>
                <p className={styles.meta}>
                  {item.type} &middot; {item.material}
                </p>
                <div className={styles.footer}>
                  <span className={styles.price}>${item.price.toFixed(2)}</span>
                  <span className={styles.stock}>{item.stock} in stock</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
