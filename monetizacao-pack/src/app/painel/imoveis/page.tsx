import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { getPanelProperties, getSubscriptionInfo } from "@/lib/data";
import { getPlan, fmtLimit } from "@/lib/plans";
import { brl, STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PainelImoveis({ searchParams }: { searchParams: { demo?: string } }) {
  const org = await getTenant();
  const [rows, sub] = await Promise.all([getPanelProperties(org.id), getSubscriptionInfo(org.id)]);
  const plan = getPlan(sub.plan);

  return (
    <>
      <div className="phead">
        <h1>Imóveis</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <span className="pill">{sub.propertyCount} / {fmtLimit(plan.maxProperties)} imóveis · plano {plan.label}</span>
          <Link className="btn-solid" href="/painel/imoveis/novo">＋ Novo imóvel</Link>
        </div>
      </div>

      {searchParams.demo && (
        <p className="pform-error">Modo demonstração: configure o DATABASE_URL no .env para cadastrar imóveis de verdade.</p>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Imóvel</th><th>Bairro</th><th>Preço</th><th>Status</th>
            <th>Corretor</th><th>Visitas</th><th>Propostas</th><th>Dias no ar</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p: any) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.neighborhood}</td>
              <td>{brl(p.price)}</td>
              <td><span className="pill">{STATUS_LABEL[p.status] ?? p.status}</span></td>
              <td>{p.agent}</td>
              <td>{p.visits}</td>
              <td>{p.proposals}</td>
              <td style={{ color: p.daysOnMarket > 90 ? "#d88" : "inherit" }}>{p.daysOnMarket}</td>
              <td><Link className="pill" href={`/painel/imoveis/${p.id}`}>Editar</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: "var(--stone)", fontSize: ".85rem", marginTop: "1rem" }}>
        Dias no ar em vermelho = 90+ dias (candidato a revisão de preço/fotos).
      </p>
    </>
  );
}
