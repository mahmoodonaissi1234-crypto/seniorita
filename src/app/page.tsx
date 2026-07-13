"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type HelloResponse = {
  message: string;
  timestamp: string;
};

export default function Home() {
  const [data, setData] = useState<HelloResponse | null>(null);

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Seniorita</h1>
        <p>A minimal full-stack Next.js starter for learning Git &amp; GitHub.</p>
        <p>
          {data
            ? `${data.message} (fetched at ${data.timestamp})`
            : "Loading message from the API..."}
        </p>
      </main>
    </div>
  );
}
