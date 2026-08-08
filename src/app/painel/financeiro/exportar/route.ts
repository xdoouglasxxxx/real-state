/** Exportação CSV do extrato — respeita mês e filtros ativos da tela.
 *  Formato Excel pt-BR: separador ';', decimal com vírgula, BOM UTF-8. */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/perm";
import { getFinance, FIN_CATEGORY } from "@/lib/data";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  const needsQuote = s.includes(";") || s.includes("\n") || s.includes('"');
  return needsQuote ? '"' + s.split('"').join('""') + '"' : s;
};
const money = (v: unknown) => Number(v ?? 0).toFixed(2).replace(".", ",");
const dt = (v: Date | string | null) => (v ? new Date(v).toLocaleDateString("pt-BR") : "");

export async function GET(req: Request) {
  const ctx = await requireAdmin();
  const url = new URL(req.url);

  const now = new Date();
  const [y, m] = (url.searchParams.get("mes") ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
    .split("-").map(Number);
  const filter = {
    kpi: url.searchParams.get("filtro") ?? undefined,
    cat: url.searchParams.get("cat") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
  };

  const f = await getFinance(ctx.org.id, y || now.getFullYear(), m || now.getMonth() + 1, filter);

  const header = ["Vencimento", "Descrição", "Categoria", "Imóvel", "Corretor", "Tipo", "Valor (R$)", "Status", "Pago/Recebido em", "Criado por"];
  const rows = f.entries.map((e: any) => {
    const prop = e.property ?? e.contract?.proposal?.property;
    const overdue = !e.paidAt && +new Date(e.dueDate) < Date.now();
    return [
      dt(e.dueDate),
      e.description,
      FIN_CATEGORY[e.category] ?? e.category,
      prop?.title ?? "",
      e.agent?.name ?? "",
      e.direction === "IN" ? "Entrada" : "Saída",
      money(e.amount),
      e.paidAt ? (e.direction === "IN" ? "Recebido" : "Pago") : overdue ? "Vencido" : "Previsto",
      dt(e.paidAt),
      e.createdBy ?? "",
    ].map(cell).join(";");
  });

  const csv = "\uFEFF" + [header.join(";"), ...rows].join("\r\n");
  const mes = `${y || now.getFullYear()}-${String(m || now.getMonth() + 1).padStart(2, "0")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="financeiro-${ctx.org.slug}-${mes}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
