"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./app-layout.module.css";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/items", label: "Items" },
  { href: "/categories", label: "Categories" },
  { href: "/finance", label: "Finance" },
  { href: "/settings", label: "Settings" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
