/** Exportação DIMOB — base anual para a declaração no programa da Receita.
 *  Uma linha por contrato de locação com pagamentos PAGOS no ano.
 *  CPF/CNPJ das partes é completado pela contabilidade. */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return s.includes(";") || s.includes("\n") || s.includes('"')
    ? '"' + s.split('"').join('""') + '"' : s;
};
const money = (v: number) => v.toFixed(2).replace(".", ",");
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export async function GET(req: Request) {
  const ctx = await requireAdmin();
  const anoRaw = Number(new URL(req.url).searchParams.get("ano"));
  const ano = anoRaw >= 2000 && anoRaw <= 2100 ? anoRaw : new Date().getFullYear() - 1;

  const pagamentos = await prisma.rentPayment.findMany({
    where: {
      organizationId: ctx.org.id,
      status: "PAGO",
      paidAt: { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) },
    },
    select: {
      paidAt: true, rentValue: true, adminFee: true,
      contract: {
        select: {
          id: true,
          owner: { select: { name: true } },
          tenant: { select: { name: true } },
          property: { select: { title: true, address: true } },
        },
      },
    },
  });

  type Linha = {
    owner: string; tenant: string; imovel: string; endereco: string;
    meses: number[]; totalAluguel: number; totalComissao: number;
  };
  const porContrato = new Map<string, Linha>();
  for (const p of pagamentos) {
    if (!p.paidAt) continue;
    let linha = porContrato.get(p.contract.id);
    if (!linha) {
      linha = {
        owner: p.contract.owner.name, tenant: p.contract.tenant.name,
        imovel: p.contract.property.title, endereco: p.contract.property.address ?? "",
        meses: Array(12).fill(0), totalAluguel: 0, totalComissao: 0,
      };
      porContrato.set(p.contract.id, linha);
    }
    const valor = Number(p.rentValue);
    linha.meses[new Date(p.paidAt).getMonth()] += valor;
    linha.totalAluguel += valor;
    linha.totalComissao += Number(p.adminFee);
  }

  const header = ["Proprietário", "Locatário", "Imóvel", "Endereço", ...MESES, "Total aluguéis (R$)", "Total comissão (R$)"];
  const rows = Array.from(porContrato.values()).map((l) =>
    [l.owner, l.tenant, l.imovel, l.endereco,
     ...l.meses.map(money), money(l.totalAluguel), money(l.totalComissao)]
      .map(cell).join(";"));

  const csv = "\uFEFF" + [header.join(";"), ...rows].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dimob-${ctx.org.slug}-${ano}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
