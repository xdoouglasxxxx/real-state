import Link from "next/link";
import { requirePanel } from "@/lib/perm";
import { getAgents, getPanelProperties } from "@/lib/data";
import { createManualLead } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoLead({ searchParams }: { searchParams: { erro?: string } }) {
  const ctx = await requirePanel();
  const org = ctx.org;
  const [agents, properties] = await Promise.all([getAgents(org.id), getPanelProperties(org.id)]);

  return (
    <>
      <Link className="back" href="/painel/leads">← Voltar ao funil</Link>
      <h1>Novo lead</h1>
      {searchParams.erro === "1" && <p className="pform-error">Preencha nome e telefone.</p>}
      {searchParams.erro === "2" && <p className="pform-error">Erro ao salvar no banco. Tente de novo — se persistir, veja os Logs.</p>}

      <form action={createManualLead} className="pform" style={{ maxWidth: 720 }}>
        <section>
          <div className="pgrid">
            <label className="span2">Nome*<input name="name" required /></label>
            <label className="span2">Telefone / WhatsApp*<input name="phone" required /></label>
            <label>Origem
              <select name="source" defaultValue="WHATSAPP">
                <option value="WHATSAPP">WhatsApp</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="SITE">Site</option>
                <option value="GOOGLE">Google</option>
                <option value="INDICACAO">Indicação</option>
                <option value="PORTAL">Portal</option>
                <option value="OUTRO">Outro</option>
              </select>
            </label>
            {ctx.isAgent ? (
              <label>Corretor
                <input value="Você (automático)" disabled />
              </label>
            ) : (
              <label>Corretor
                <select name="agentId" defaultValue="">
                  <option value="">— Sem corretor —</option>
                  {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
            )}
            <label className="span2">Imóvel de interesse
              <select name="propertyId" defaultValue="">
                <option value="">— Nenhum específico —</option>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label className="span4">O que procura
              <input name="interest" placeholder="Ex.: apartamento até 900 mil nos Jardins" />
            </label>
          </div>
        </section>
        <div className="pform-footer">
          <button className="btn-solid" type="submit">Criar lead</button>
        </div>
      </form>
    </>
  );
}
