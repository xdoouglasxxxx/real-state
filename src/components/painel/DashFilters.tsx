"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import styles from "./DashParts.module.css";
import { PERIODS, dashHref, type Period } from "@/lib/periods";

/** Abas Mês/Trimestre/Ano (links: dá para compartilhar a visão) + filtro de corretor. Tudo vai para a URL. */
export default function DashFilters({
  period, agent, agents,
}: { period: Period; agent: string | null; agents: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className={styles.filters} aria-busy={pending} style={{ opacity: pending ? 0.6 : 1 }}>
      <nav className={styles.tabs} aria-label="Período">
        {PERIODS.map((p) => (
          <Link key={p.id} href={dashHref(p.id, agent)} className={p.id === period ? styles.tabOn : styles.tab}
            aria-current={p.id === period ? "page" : undefined}>
            {p.label}
          </Link>
        ))}
      </nav>
      <label className={styles.agentSel}>
        <span>Corretor</span>
        <select value={agent ?? ""} onChange={(e) => { const v = e.target.value || null; startTransition(() => router.push(dashHref(period, v))); }}>
          <option value="">Todos os corretores</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
    </div>
  );
}
