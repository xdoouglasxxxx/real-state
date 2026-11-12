"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isNavActive } from "@/lib/nav";

/** Item do menu lateral do painel, com estado ativo (a página atual fica destacada). */
export default function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const path = usePathname() ?? "";
  const active = isNavActive(href, path);
  return (
    <Link className={active ? "panel-link panel-link-on" : "panel-link"} href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
