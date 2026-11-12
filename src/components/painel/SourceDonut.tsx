"use client";

import DonutCard from "./DonutCard";

export type SourceItem = { label: string; count: number; won: number; share: number };

/** Rosca "De onde vêm" do dashboard: leads criados no período, por canal. */
export default function SourceDonut({ items, total }: { items: SourceItem[]; total: number }) {
  return (
    <DonutCard
      title="De onde vêm"
      items={items.map((it) => ({
        label: it.label,
        value: it.count,
        display: String(it.count),
        note: it.won > 0 ? ` · ${it.won} venda${it.won > 1 ? "s" : ""}` : undefined,
        aria: `${it.label}: ${it.count} leads, ${it.share}%${it.won > 0 ? `, ${it.won} vendas` : ""}`,
      }))}
      totalDisplay={String(total)}
      caption="leads"
      emptyText="Sem leads criados neste período."
      hint="Leads criados no período, por canal. Onde investir: volume + vendas."
    />
  );
}
