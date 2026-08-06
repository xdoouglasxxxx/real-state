import { getTenant } from "@/lib/tenant";
import { getLeadsBoard } from "@/lib/data";
import { STAGE_LABEL, SOURCE_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

const STAGES = ["NEW", "CONTACTED", "VISIT", "PROPOSAL", "FINANCING", "CONTRACT", "WON"] as const;

export default async function Leads() {
  const org = await getTenant();
  const leads = await getLeadsBoard(org.id);

  return (
    <>
      <h1>Funil de leads</h1>
      <div className="kanban">
        {STAGES.map((stage) => {
          const col = leads.filter((l: any) => l.stage === stage);
          return (
            <div className="kcol" key={stage}>
              <h3>{STAGE_LABEL[stage]} · {col.length}</h3>
              {col.map((l: any) => (
                <div className="kcard" key={l.id}>
                  <strong>{l.name}</strong>
                  <span>{l.property}</span><br />
                  <span>{l.agent}</span>
                  <em>{SOURCE_LABEL[l.source] ?? l.source}</em>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <p style={{ color: "var(--stone)", fontSize: ".85rem", marginTop: "1rem" }}>
        Todo formulário do site cria um lead em "Novo" automaticamente.
        Arrastar-e-soltar entre colunas entra na fase 2 (CRM interativo).
      </p>
    </>
  );
}
