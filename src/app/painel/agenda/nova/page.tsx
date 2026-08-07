import Link from "next/link";
import { requirePanel } from "@/lib/perm";
import { getAgents, getPanelProperties, getLeadsBoardFull } from "@/lib/data";
import { createVisit } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaVisita({ searchParams }: { searchParams: { erro?: string; lead?: string } }) {
  const ctx = await requirePanel();
  const org = ctx.org;
  const [agents, allProperties, leads] = await Promise.all([
    getAgents(org.id), getPanelProperties(org.id),
    getLeadsBoardFull(org.id, ctx.isAgent ? ctx.agentId ?? "-" : null),
  ]);
  // só faz sentido visitar o que está disponível
  const properties = (allProperties as any[]).filter((p) => !["SOLD", "ARCHIVED"].includes(p.status));

  return (
    <>
      <Link className="back" href="/painel/agenda">← Voltar à agenda</Link>
      <h1>Agendar visita</h1>
      {searchParams.erro === "1" && <p className="pform-error">Escolha o imóvel e o horário.</p>}
      {searchParams.erro === "2" && <p className="pform-error">Erro ao salvar — tente de novo.</p>}
      {properties.length === 0 && (
        <p className="pform-error">Cadastre ao menos um imóvel antes de agendar (a visita acontece em um imóvel 😉).</p>
      )}

      <form action={createVisit} className="pform" style={{ maxWidth: 720 }}>
        <section>
          <div className="pgrid">
            <label className="span2">Lead
              <select name="leadId" defaultValue={searchParams.lead ?? ""}>
                <option value="">— Sem lead vinculado —</option>
                {leads.map((l: any) => <option key={l.id} value={l.id}>{l.name} · {l.phone}</option>)}
              </select>
            </label>
            <label className="span2">Imóvel*
              <select name="propertyId" required defaultValue="">
                <option value="" disabled>Escolha o imóvel</option>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label className="span2">Data e hora*
              <input type="datetime-local" name="scheduledAt" required />
            </label>
            {ctx.isAgent ? (
              <label className="span2">Corretor
                <input value="Você (automático)" disabled />
              </label>
            ) : (
              <label className="span2">Corretor
                <select name="agentId" defaultValue="">
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
