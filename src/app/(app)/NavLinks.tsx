"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./app-layout.module.css";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/items", label: "Items" },
  { href: "/categories", label: "Categories" },
  { href: "/finance", label: "Finance", ownerOnly: true },
  { href: "/settings", label: "Settings", ownerOnly: true },
];

export function NavLinks() {
  const pathname = usePathname();
  const [isOwner, setIsOwner] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { role?: string } | null) => {
        if (!ignore) setIsOwner(data?.role !== "staff");
      })
      .catch(() => {
        /* default (isOwner=true) just leaves all links visible */
      });
    return () => {
      ignore = true;
    };
  }, []);

  const links = LINKS.filter((link) => !link.ownerOnly || isOwner);

  return (
    <nav className={styles.nav}>
      {links.map((link) => {
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
