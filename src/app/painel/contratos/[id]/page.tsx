import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";
import { brl } from "@/lib/format";
import { updateContractPayment, markCoafReported } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  AWAITING_SIGNATURE: "Aguardando assinatura",
  SIGNED: "Assinado",
  FINANCING: "Financiamento",
  CLOSED: "Fechado",
  CANCELED: "Cancelado",
};

export default async function ContratoPage({
  params, searchParams,
}: { params: { id: string }; searchParams: { salvo?: string; coaf?: string } }) {
  const { org } = await requireAdmin();

  let contract: any = null;
  try {
    contract = await prisma.contract.findFirst({
      where: { id: params.id, organizationId: org.id },
      select: {
        id: true, status: true, totalAmount: true, createdAt: true,
        paymentMethod: true, cashAmount: true, coafReportedAt: true,
        proposal: { select: { property: { select: { title: true, city: true } } } },
      },
    });
  } catch {}
  if (!contract) notFound();

  const needsCoaf = Number(contract.cashAmount) > 30000 && !contract.coafReportedAt;
  const cashDefault = Number(contract.cashAmount) > 0 ? String(Number(contract.cashAmount)) : "";

  return (
    <>
      <Link className="back" href="/painel/contratos">← Voltar aos contratos</Link>
      <div className="phead">
        <h1>{contract.proposal?.property?.title ?? "Contrato"}</h1>
        <span className="pill">{STATUS_LABEL[contract.status] ?? contract.status}</span>
      </div>

      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Forma de pagamento salva.</p>}
      {searchParams.coaf && <p className="ok" style={{ marginBottom: "1rem" }}>✔ COAF marcado como comunicado.</p>}

      <div className="ficha-box" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginBottom: ".75rem" }}>Resumo</h3>
        <div className="meta-bar">
          <span>Imóvel: <strong>{contract.proposal?.property?.title ?? "—"}</strong></span>
          <span>Cidade: <strong>{contract.proposal?.property?.city ?? "—"}</strong></span>
          <span>Valor total: <strong>{brl(Number(contract.totalAmount ?? 0))}</strong></span>
          <span>Criado em: <strong>{new Date(contract.createdAt).toLocaleDateString("pt-BR")}</strong></span>
        </div>
      </div>

      {needsCoaf && (
        <div style={{ padding: "1rem 1.2rem", background: "#3a1a1a", borderLeft: "3px solid #c44", borderRadius: 6, marginBottom: "1.5rem" }}>
          <strong style={{ color: "#f66" }}>⚠ Obrigação COAF — Lei 9.613/98</strong>
          <p style={{ color: "var(--stone)", marginTop: ".4rem", fontSize: ".9rem" }}>
            Pagamento em espécie superior a R$ 30.000 deve ser comunicado ao COAF via SISCOAF.
            Registre após realizar a comunicação.
          </p>
        </div>
      )}

      <form action={updateContractPayment} className="pform" style={{ maxWidth: 640 }}>
        <input type="hidden" name="id" value={contract.id} />
        <section>
          <h2>Forma de pagamento</h2>
          <div className="pgrid">
            <label className="span2">Modalidade
              <select name="paymentMethod" defaultValue={contract.paymentMethod ?? ""}>
                <option value="">— Selecione —</option>
                <option value="PIX">PIX</option>
                <option value="TRANSFERENCIA">Transferência bancária</option>
                <option value="FINANCIAMENTO">Financiamento bancário</option>
                <option value="DINHEIRO">Dinheiro (espécie)</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MISTO">Misto (espécie + outra)</option>
              </select>
            </label>
            <label className="span2">Valor pago em espécie (R$)
              <input name="cashAmount" inputMode="decimal" defaultValue={cashDefault} placeholder="0" />
            </label>
          </div>
          <div className="pform-footer">
            <button className="btn-solid" type="submit">Salvar</button>
          </div>
        </section>
      </form>

      {Number(contract.cashAmount) > 30000 && (
        <div style={{ marginTop: "1.5rem" }}>
          {contract.coafReportedAt ? (
            <p className="ok">✔ COAF comunicado em {new Date(contract.coafReportedAt).toLocaleDateString("pt-BR")}.</p>
          ) : (
            <form action={markCoafReported}>
              <input type="hidden" name="id" value={contract.id} />
              <button className="btn-outline" type="submit">Marcar COAF como comunicado</button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
