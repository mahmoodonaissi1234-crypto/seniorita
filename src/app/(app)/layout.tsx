import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { NavLinks } from "./NavLinks";
import { LogoutButton } from "./LogoutButton";
import styles from "./app-layout.module.css";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Logo size="sm" />
        </div>
        <NavLinks />
        <div className={styles.sidebarFooter}>
          <LogoutButton />
        </div>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
