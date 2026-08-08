import Link from "next/link";
import { requireAdmin } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  AWAITING_SIGNATURE: "Aguardando assinatura",
  SIGNED: "Assinado",
  FINANCING: "Financiamento",
  CLOSED: "Fechado",
};

export default async function ContratosPage() {
  const { org } = await requireAdmin();
  let contracts: any[] = [];
  try {
    contracts = await prisma.contract.findMany({
      where: { organizationId: org.id, status: { notIn: ["CANCELED"] } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, status: true, totalAmount: true, createdAt: true,
        paymentMethod: true, cashAmount: true, coafReportedAt: true,
        proposal: { select: { property: { select: { title: true } } } },
      },
    });
  } catch {}

  return (
    <>
      <h1>Contratos de Venda</h1>
      <p style={{ color: "var(--stone)", marginBottom: "1.5rem" }}>
        Gerencie forma de pagamento e obrigações COAF (Lei 9.613/98) por contrato.
      </p>
      {contracts.length === 0 && (
        <p style={{ color: "var(--stone)" }}>Nenhum contrato registrado ainda.</p>
      )}
      {contracts.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Imóvel</th><th>Valor</th><th>Status</th>
              <th>Pagamento</th><th>Espécie</th><th>COAF</th><th></th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c: any) => {
              const needsCoaf = Number(c.cashAmount) > 30000 && !c.coafReportedAt;
              return (
                <tr key={c.id}>
                  <td>{c.proposal?.property?.title ?? "—"}</td>
                  <td>{brl(Number(c.totalAmount ?? 0))}</td>
                  <td><span className="pill">{STATUS_LABEL[c.status] ?? c.status}</span></td>
                  <td>{c.paymentMethod ?? "—"}</td>
                  <td>{Number(c.cashAmount) > 0 ? brl(Number(c.cashAmount)) : "—"}</td>
                  <td>
                    {needsCoaf && <span className="pill" style={{ background: "#a33", color: "#fff" }}>⚠ Comunicar COAF</span>}
                    {c.coafReportedAt && <span className="pill" style={{ background: "#1a4", color: "#fff" }}>✓ Comunicado</span>}
                    {!needsCoaf && !c.coafReportedAt && "—"}
                  </td>
                  <td><Link href={`/painel/contratos/${c.id}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>Detalhe</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
