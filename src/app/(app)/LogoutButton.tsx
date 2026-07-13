"use client";

import { useRouter } from "next/navigation";
import styles from "./app-layout.module.css";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className={styles.logout} onClick={handleLogout}>
      Log out
    </button>
  );
}
