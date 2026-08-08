import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerUp } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/format";
import { renderTemplate, extenso } from "@/lib/contract-render";
import { ensureDefaultTemplates } from "../../../modelos/actions";
import PrintButton from "@/components/painel/PrintButton";

export const dynamic = "force-dynamic";

/** Documento do contrato de VENDA — mescla o modelo do tenant com os dados reais.
 *  Imprimível (Ctrl+P → Salvar como PDF); assinatura digital pluga na Fase 2. */
export default async function DocumentoVenda({ params }: { params: { id: string } }) {
  const ctx = await requireManagerUp();
  await ensureDefaultTemplates(ctx.org.id);

  const contract = await prisma.contract.findFirst({
    where: { id: params.id, organizationId: ctx.org.id },
    include: {
      proposal: {
        include: {
          contact: { select: { name: true, phone: true, email: true, document: true } },
          property: {
            select: {
              title: true, address: true, neighborhood: true, city: true,
              owner: { select: { name: true, document: true } },
              agent: { select: { name: true, creci: true } },
            },
          },
        },
      },
      commissions: { select: { amount: true } },
    },
  });
  if (!contract) notFound();

  const tpl = await prisma.contractTemplate.findFirst({
    where: { organizationId: ctx.org.id, kind: "VENDA" },
    orderBy: { updatedAt: "desc" },
  });
  if (!tpl) notFound();

  const p = contract.proposal;
  const commissionTotal = contract.commissions.reduce((s, c) => s + Number(c.amount), 0);
  const total = Number(contract.totalAmount);

  const text = renderTemplate(tpl.body, {
    imobiliaria: { nome: ctx.org.name, creci: (ctx.org as any).creci ?? "____" },
    data: { hoje: extenso(new Date()) },
    corretor: { nome: p.property.agent?.name, creci: p.property.agent?.creci },
    imovel: {
      titulo: p.property.title, endereco: p.property.address,
      bairro: p.property.neighborhood, cidade: p.property.city ?? "São Paulo",
    },
    vendedor: { nome: p.property.owner?.name, documento: p.property.owner?.document },
    comprador: {
      nome: p.contact.name, documento: p.contact.document,
      telefone: p.contact.phone, email: p.contact.email,
    },
    negocio: {
      valor: brl(total), condicoes: p.conditions,
      comissaoValor: commissionTotal > 0 ? brl(commissionTotal) : undefined,
      comissaoPct: commissionTotal > 0 && total > 0 ? `${((100 * commissionTotal) / total).toFixed(1)}%` : undefined,
    },
  });

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", gap: "1rem", flexWrap: "wrap" }}>
        <Link className="back" href="/painel/leads">← Voltar</Link>
        <span style={{ display: "flex", gap: ".7rem" }}>
          <Link className="btn-outline" href="/painel/modelos">Editar modelo</Link>
          <PrintButton />
        </span>
      </div>

      <article className="contract-paper">{text}</article>

      <p className="no-print" style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: "1rem" }}>
        Campos em branco (________) indicam dados faltantes no cadastro — complete o CPF/CNPJ do contato e do
        proprietário na ficha antes de imprimir. Depois de assinado, anexe o PDF em Documentos (tipo Contrato).
      </p>

      <style>{`
        .contract-paper {
          background: #fdfcf8; color: #1a1a1a; padding: 3rem 3.4rem; border-radius: 4px;
          font-family: Georgia, 'Times New Roman', serif; font-size: .95rem; line-height: 1.75;
          white-space: pre-wrap; box-shadow: 0 2px 24px rgba(0,0,0,.35);
        }
        @media print {
          .no-print, nav, aside, header { display: none !important; }
          body, main { background: #fff !important; padding: 0 !important; margin: 0 !important; }
          .contract-paper { box-shadow: none; border-radius: 0; padding: 0; font-size: 11pt; }
        }
      `}</style>
    </div>
  );
}
