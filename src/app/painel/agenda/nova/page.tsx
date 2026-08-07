import Link from "next/link";
import { requirePanel } from "@/lib/perm";
import { getAgents, getPanelProperties, getLeadsBoardFull, getLeadDetail } from "@/lib/data";
import { createVisit } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaVisita({ searchParams }: { searchParams: { erro?: string; lead?: string } }) {
  const ctx = await requirePanel();
  const org = ctx.org;
  const agentScope = ctx.isAgent ? ctx.agentId ?? "-" : null;
  const [agents, allProperties, leads, fromLead] = await Promise.all([
    getAgents(org.id), getPanelProperties(org.id),
    getLeadsBoardFull(org.id, agentScope),
    // Veio da ficha de um lead? Traz o contexto para pré-preencher tudo
    searchParams.lead ? getLeadDetail(org.id, searchParams.lead, agentScope) : null,
  ]);

  // Bloqueia datas passadas no seletor (horário de Brasília, formato do input)
  const minLocal = new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 16);
  // só faz sentido visitar o que está disponível
  const properties = (allProperties as any[]).filter((p) => !["SOLD", "ARCHIVED"].includes(p.status));

  // Pré-preenchimento vindo do lead: imóvel e corretor já selecionados
  const defaultProperty = fromLead?.propertyId && properties.some((p: any) => p.id === fromLead.propertyId)
    ? fromLead.propertyId : "";
  const defaultAgent = fromLead?.agentId ?? "";
  const leadInList = !fromLead || leads.some((l: any) => l.id === fromLead.id);

  return (
    <>
      <Link className="back" href="/painel/agenda">← Voltar à agenda</Link>
      <h1>Agendar visita</h1>
      {searchParams.erro === "1" && <p className="pform-error">Escolha o imóvel e o horário.</p>}
      {searchParams.erro === "2" && <p className="pform-error">Erro ao salvar — tente de novo.</p>}
      {searchParams.erro === "data" && <p className="pform-error">A data da visita precisa ser no futuro — confira o dia e o ano escolhidos.</p>}
      {properties.length === 0 && (
        <p className="pform-error">Cadastre ao menos um imóvel antes de agendar (a visita acontece em um imóvel 😉).</p>
      )}
      {fromLead && (
        <p className="ok" style={{ marginBottom: "1rem" }}>
          Agendando para <strong>{fromLead.contact?.name}</strong>
          {fromLead.contact?.phone ? ` · ${fromLead.contact.phone}` : ""}
          {fromLead.contact?.email ? ` · ${fromLead.contact.email}` : ""}
          {fromLead.agent?.name ? ` · corretor ${fromLead.agent.name}` : ""}
          {fromLead.property?.title ? ` · interesse: ${fromLead.property.title}` : ""}
          — confira e ajuste se precisar.
        </p>
      )}

      <form action={createVisit} className="pform" style={{ maxWidth: 720 }}>
        <section>
          <div className="pgrid">
            <label className="span2">Lead
              <select name="leadId" defaultValue={searchParams.lead ?? ""}>
                <option value="">— Sem lead vinculado —</option>
                {!leadInList && fromLead && (
                  <option value={fromLead.id}>{fromLead.contact?.name} · {fromLead.contact?.phone}</option>
                )}
                {leads.map((l: any) => <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>)}
              </select>
            </label>
            <label className="span2">Imóvel*
              <select name="propertyId" required defaultValue={defaultProperty}>
                <option value="" disabled>Escolha o imóvel</option>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label className="span2">Data e hora*
              <input type="datetime-local" name="scheduledAt" required min={minLocal} />
            </label>
            {ctx.isAgent ? (
              <label className="span2">Corretor
                <input value="Você (automático)" disabled />
              </label>
            ) : (
              <label className="span2">Corretor
                <select name="agentId" defaultValue={defaultAgent}>
                  <option value="">— Usar o corretor do lead —</option>
                  {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
            )}
          </div>
        </section>
        <div className="pform-footer">
          <button className="btn-solid" type="submit">Agendar</button>
        </div>
      </form>
    </>
  );
}
