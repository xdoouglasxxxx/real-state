import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePanel } from "@/lib/perm";
import { getLeadDetail, getAgents } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { addLeadNote, assignAgent, upsertClientAccess } from "../actions";
import { STAGE_LABEL, SOURCE_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACT_LABEL: Record<string, string> = {
  PAGE_VIEW: "Visualizou página", FORM_SUBMIT: "Enviou formulário",
  WHATSAPP_SENT: "WhatsApp enviado", WHATSAPP_RECEIVED: "WhatsApp recebido",
  EMAIL_SENT: "E-mail enviado", CALL: "Ligação", NOTE: "Anotação", STAGE_CHANGE: "Mudou de estágio",
};

export default async function LeadFicha({ params, searchParams }: { params: { id: string }; searchParams: { cliente?: string } }) {
  const ctx = await requirePanel();
  const org = ctx.org;
  // Corretor só abre a ficha dos PRÓPRIOS leads (agentId "-" nunca casa = nega)
  const [lead, agents] = await Promise.all([
    getLeadDetail(org.id, params.id, ctx.isAgent ? ctx.agentId ?? "-" : null),
    getAgents(org.id),
  ]);
  if (!lead) notFound();

  // Portal do Cliente: já existe acesso para o e-mail deste contato?
  let clientAccess: { isActive: boolean } | null = null;
  const contactEmail = (lead as any).contact?.email?.trim().toLowerCase() ?? null;
  if (ctx.isManagerUp && contactEmail && process.env.DATABASE_URL) {
    try {
      clientAccess = await prisma.user.findFirst({
        where: { organizationId: org.id, email: contactEmail, role: "CLIENT" },
        select: { isActive: true },
      });
    } catch {}
  }
  const CLIENTE_MSG: Record<string, [string, boolean]> = {
    ok: ["✔ Acesso do cliente pronto — envie o e-mail e a senha pelo WhatsApp.", true],
    senha: ["A senha do cliente precisa de pelo menos 6 caracteres.", false],
    sememail: ["Este contato não tem e-mail cadastrado — o acesso do portal usa o e-mail como login.", false],
    conflito: ["Este e-mail pertence a um usuário do time — não pode virar acesso de cliente.", false],
    erro: ["Erro ao criar o acesso. Tente de novo — se persistir, veja os Logs.", false],
  };

  const phone = lead.contact?.phone ?? "";
  const wa = phone
    ? `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${lead.contact?.name?.split(" ")[0] ?? ""}! Aqui é da ${org.name}. 😊`)}`
    : null;

  return (
    <>
      <Link className="back" href="/painel/leads">← Voltar ao funil</Link>
      <div className="phead">
        <h1>{lead.contact?.name}</h1>
        <span className="pill">{STAGE_LABEL[lead.stage] ?? lead.stage}</span>
      </div>

      <div className="ficha">
        <div className="ficha-col">
          <section className="ficha-box">
            <h2>Contato</h2>
            <p><strong>Telefone:</strong> {phone || "—"}</p>
            <p><strong>E-mail:</strong> {lead.contact?.email ?? "—"}</p>
            <p><strong>Origem:</strong> {SOURCE_LABEL[lead.source] ?? lead.source}</p>
            <p><strong>Interesse:</strong> {lead.interest ?? "—"}</p>
            <p><strong>Imóvel:</strong> {lead.property ? (
              <Link href={`/painel/imoveis/${lead.property.id}`} style={{ color: "var(--brass)" }}>{lead.property.title}</Link>
            ) : "—"}</p>
            <p><strong>Criado em:</strong> {new Date(lead.createdAt).toLocaleString("pt-BR")}</p>
            <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap", marginTop: ".8rem" }}>
              {wa && <a className="btn-solid" href={wa} target="_blank" rel="noopener">💬 WhatsApp</a>}
              <Link className="btn-outline" href={`/painel/agenda/nova?lead=${lead.id}`}>📅 Agendar visita</Link>
            </div>
          </section>

          <section className="ficha-box">
            <h2>Corretor responsável</h2>
            {ctx.isAgent ? (
              <p>{lead.agent?.name ?? "—"} <span style={{ color: "var(--stone)", fontSize: ".85rem" }}>(redistribuição é feita pelo gerente)</span></p>
            ) : (
              <form action={assignAgent} className="form">
                <input type="hidden" name="leadId" value={lead.id} />
                <select name="agentId" defaultValue={lead.agentId ?? ""}>
                  <option value="">— Sem corretor —</option>
                  {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button className="btn-outline" type="submit">Salvar corretor</button>
              </form>
            )}
          </section>

          {ctx.isManagerUp && (
            <section className="ficha-box">
              <h2>Portal do Cliente</h2>
              {searchParams.cliente && (
                <p className={CLIENTE_MSG[searchParams.cliente]?.[1] ? "ok" : "pform-error"} style={{ marginBottom: ".6rem" }}>
                  {CLIENTE_MSG[searchParams.cliente]?.[0]}
                </p>
              )}
              {!contactEmail ? (
                <p style={{ color: "var(--stone)", fontSize: ".85rem" }}>
                  Cadastre um e-mail para este contato para liberar o portal (o e-mail é o login do cliente).
                </p>
              ) : (
                <>
                  <p style={{ fontSize: ".85rem", color: "var(--stone)", marginBottom: ".6rem" }}>
                    {clientAccess
                      ? `Acesso ativo para ${contactEmail}. Defina uma nova senha se o cliente esqueceu.`
                      : `O cliente acompanha a negociação sozinho em /login com o e-mail ${contactEmail}.`}
                  </p>
                  <form action={upsertClientAccess} className="form">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input name="password" type="password" minLength={6} placeholder="Senha do cliente (mín. 6)" required />
                    <button className="btn-outline" type="submit">
                      {clientAccess ? "Redefinir senha do cliente" : "Criar acesso do cliente"}
                    </button>
                  </form>
                </>
              )}
            </section>
          )}

          <section className="ficha-box">
            <h2>Anotação</h2>
            <form action={addLeadNote} className="form">
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea name="note" rows={3} placeholder="Ex.: prefere visitas aos sábados; tem FGTS para entrada..." required />
              <button className="btn-outline" type="submit">Adicionar à timeline</button>
            </form>
          </section>
        </div>

        <section className="ficha-box">
          <h2>Timeline</h2>
          <ul className="timeline">
            {lead.activities.map((a: any) => (
              <li key={a.id}>
                <span className="tl-when">{new Date(a.createdAt).toLocaleString("pt-BR")}</span>
                <strong>{ACT_LABEL[a.type] ?? a.type}</strong>
                {a.payload?.note && <p>{a.payload.note}</p>}
                {a.payload?.from && <p>{STAGE_LABEL[a.payload.from] ?? a.payload.from} → {STAGE_LABEL[a.payload.to] ?? a.payload.to}</p>}
                {a.payload?.message && <p>{a.payload.message}</p>}
                {a.payload?.kind && <p>Formulário: {a.payload.kind === "sell" ? "quer vender" : "agendar visita"}</p>}
                {a.payload?.by && <p style={{ color: "var(--stone)", fontSize: ".78rem" }}>por {a.payload.by}</p>}
              </li>
            ))}
            {lead.activities.length === 0 && <li><p>Sem eventos ainda.</p></li>}
          </ul>
        </section>
      </div>
    </>
  );
}
