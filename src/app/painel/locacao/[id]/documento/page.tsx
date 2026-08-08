import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerUp } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/format";
import { renderTemplate, extenso } from "@/lib/contract-render";
import { GUARANTEE_LABEL } from "@/lib/data";
import { ensureDefaultTemplates } from "../../../modelos/actions";
import PrintButton from "@/components/painel/PrintButton";

export const dynamic = "force-dynamic";

/** Documento do contrato de LOCAÇÃO — mescla o modelo do tenant com o RentalContract. */
export default async function DocumentoLocacao({ params }: { params: { id: string } }) {
  const ctx = await requireManagerUp();
  await ensureDefaultTemplates(ctx.org.id);

  const c = await prisma.rentalContract.findFirst({
    where: { id: params.id, organizationId: ctx.org.id },
    include: {
      property: { select: { title: true, address: true, neighborhood: true, city: true } },
      owner: { select: { name: true, document: true } },
      tenant: { select: { name: true, phone: true, document: true } },
    },
  });
  if (!c) notFound();

  const tpl = await prisma.contractTemplate.findFirst({
    where: { organizationId: ctx.org.id, kind: "LOCACAO" },
    orderBy: { updatedAt: "desc" },
  });
  if (!tpl) notFound();

  const months = (d1: Date, d2: Date) =>
    (d2.getFullYear() * 12 + d2.getMonth()) - (d1.getFullYear() * 12 + d1.getMonth());
  const guaranteeExtra = c.guaranteeType === "PROPRIA" && Number(c.guaranteeFeePct) > 0
    ? ` (garantia própria: +${Number(c.guaranteeFeePct)}% = ${brl(Number(c.rentValue) * (1 + Number(c.guaranteeFeePct) / 100))} totais mensais)`
    : "";

  const text = renderTemplate(tpl.body, {
    imobiliaria: { nome: ctx.org.name, creci: (ctx.org as any).creci ?? "____" },
    data: { hoje: extenso(new Date()) },
    imovel: {
      titulo: c.property.title, endereco: c.property.address,
      bairro: c.property.neighborhood, cidade: c.property.city ?? "São Paulo",
    },
    locador: { nome: c.owner.name, documento: c.owner.document },
    locatario: { nome: c.tenant.name, documento: c.tenant.document, telefone: c.tenant.phone },
    contrato: {
      aluguel: brl(Number(c.rentValue)),
      aluguelTotal: guaranteeExtra,
      inicio: extenso(new Date(c.startDate)),
      fim: extenso(new Date(c.endDate)),
      meses: months(new Date(c.startDate), new Date(c.endDate)),
      diaVencimento: c.dueDay,
      indice: c.reajusteIndex,
      garantia: GUARANTEE_LABEL[c.guaranteeType] ?? c.guaranteeType,
      taxaAdmPct: `${Number(c.adminFeePct)}%`,
    },
  });

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", gap: "1rem", flexWrap: "wrap" }}>
        <Link className="back" href={`/painel/locacao/${c.id}`}>← Voltar ao contrato</Link>
        <span style={{ display: "flex", gap: ".7rem" }}>
          <Link className="btn-outline" href="/painel/modelos">Editar modelo</Link>
          <PrintButton />
        </span>
      </div>

      <article className="contract-paper">{text}</article>

      <p className="no-print" style={{ color: "var(--stone)", fontSize: ".78rem", marginTop: "1rem" }}>
        Campos em branco (________) indicam dados faltantes — complete o CPF/CNPJ do locador e do locatário
        no cadastro de contatos. Depois de assinado, anexe o PDF em Documentos vinculado ao imóvel; a vistoria
        de entrada assinada também (Cláusula 8ª).
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
