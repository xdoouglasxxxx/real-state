import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/perm";
import { brl } from "@/lib/format";
import { createRentalContract } from "../actions";

export const dynamic = "force-dynamic";

const ERRO_MSG: Record<string, string> = {
  campos: "Confira os campos: imóvel, inquilino, valor do aluguel e início são obrigatórios.",
  venda: "Este imóvel está em processo de VENDA (à venda/exclusividade/reservado). Marque a confirmação para prosseguir com a locação mesmo assim.",
  semdono: "Este imóvel não tem proprietário cadastrado — defina o proprietário na ficha do imóvel antes (é para ele que vai o repasse).",
  jaalugado: "Este imóvel já tem um contrato de locação ATIVO. Encerre o atual antes de criar outro.",
  interno: "Erro ao criar o contrato — tente de novo. Se persistir, veja os Logs da Vercel.",
};

export default async function NovoContratoLocacao({ searchParams }: { searchParams: { erro?: string } }) {
  const ctx = await requireAdmin();

  let properties: any[] = [], contacts: any[] = [], agents: any[] = [];
  if (process.env.DATABASE_URL) {
    try {
      [properties, contacts, agents] = await Promise.all([
        prisma.property.findMany({
          where: { organizationId: ctx.org.id, status: { notIn: ["ARCHIVED", "SOLD", "RENTED"] } },
          orderBy: { title: "asc" }, take: 300,
          select: { id: true, title: true, price: true, status: true, ownerId: true, owner: { select: { name: true } } },
        }),
        prisma.contact.findMany({
          where: { organizationId: ctx.org.id },
          orderBy: { name: "asc" }, take: 400,
          select: { id: true, name: true, phone: true },
        }),
        prisma.agent.findMany({
          where: { organizationId: ctx.org.id, isActive: true },
          orderBy: { name: "asc" }, select: { id: true, name: true },
        }),
      ]);
    } catch {}
  }

  return (
    <>
      <Link className="back" href="/painel/locacao">← Voltar à locação</Link>
      <h1>Novo contrato de locação</h1>

      {searchParams.erro && <p className="pform-error">{ERRO_MSG[searchParams.erro] ?? ERRO_MSG.interno}</p>}

      <form action={createRentalContract} className="pform" style={{ maxWidth: 980 }}>
        <section>
          <h2>Imóvel e partes</h2>
          <div className="pgrid">
            <label className="span2">Imóvel* (proprietário vem do cadastro do imóvel)
              <select name="propertyId" required defaultValue="">
                <option value="" disabled>Escolha o imóvel</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.owner?.name ?? "SEM PROPRIETÁRIO"} · venda {brl(p.price)} · aluguel ≈ {brl(Math.round(Number(p.price) * 0.0045 / 50) * 50)}
                  </option>
                ))}
              </select>
            </label>
            <label className="span2">Inquilino*
              <select name="tenantId" required defaultValue="">
                <option value="" disabled>Escolha o contato</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
              </select>
            </label>
            <label className="span2">Corretor (comissão de captação)
              <select name="agentId" defaultValue="">
                <option value="">— Nenhum —</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label className="span2" style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: "1.4rem" }}>
              <input type="checkbox" name="confirmSale" style={{ width: "auto" }} />
              Confirmo a locação mesmo se o imóvel estiver em processo de venda
            </label>
          </div>
        </section>

        <section>
          <h2>Condições</h2>
          <div className="pgrid">
            <label>Tipo
              <select name="type" defaultValue="LONG_STAY">
                <option value="LONG_STAY">Longa duração</option>
                <option value="FLEX">Flex (mobiliado)</option>
                <option value="CORPORATE">Corporativo</option>
                <option value="TEMPORADA">Temporada</option>
              </select>
            </label>
            <label>Aluguel mensal (R$)*<input name="rentValue" required inputMode="decimal" placeholder="12.000" /></label>
            <label>Taxa de administração (%)
              <input name="adminFeePct" inputMode="decimal" defaultValue="10" placeholder="10 longa · 25 flex" />
            </label>
            <label>Taxa de setup (R$)
              <input name="setupFee" inputMode="decimal" placeholder="1º aluguel (opcional)" />
            </label>
            <label>Garantia
              <select name="guaranteeType" defaultValue="FIADOR">
                <option value="FIADOR">Fiador</option>
                <option value="CAUCAO">Caução</option>
                <option value="SEGURO_FIANCA">Seguro-fiança</option>
                <option value="PROPRIA">Garantia própria (cobra % do inquilino)</option>
              </select>
            </label>
            <label>% garantia própria
              <input name="guaranteeFeePct" inputMode="decimal" defaultValue="12" placeholder="só p/ garantia própria" />
            </label>
            <label>Vencimento (dia)
              <select name="dueDay" defaultValue="5">
                {[1, 5, 10, 15, 20, 25].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label>Início*<input name="startDate" type="date" required /></label>
            <label>Duração
              <select name="months" defaultValue="30">
                <option value="12">12 meses</option>
                <option value="24">24 meses</option>
                <option value="30">30 meses (padrão Lei 8.245)</option>
                <option value="36">36 meses</option>
              </select>
            </label>
            <label>Índice de reajuste
              <select name="reajusteIndex" defaultValue="IGP-M">
                <option value="IGP-M">IGP-M</option>
                <option value="IPCA">IPCA</option>
                <option value="IVAR">IVAR</option>
              </select>
            </label>
          </div>
          <p className="pform-hint">
            Ao criar, o sistema gera a régua de cobrança completa (uma parcela por mês, no dia do vencimento).
            Garantia própria soma o % ao boleto do inquilino — receita da imobiliária. A taxa de setup entra
            no Financeiro como receita prevista. Anexe o contrato assinado e a vistoria em Documentos,
            vinculados ao imóvel.
          </p>
          <div className="pform-footer">
            <button className="btn-solid" type="submit">Criar contrato + régua de cobrança</button>
          </div>
        </section>
      </form>
    </>
  );
}
