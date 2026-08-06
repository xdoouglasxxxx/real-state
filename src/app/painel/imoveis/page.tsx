import { getTenant } from "@/lib/tenant";
import { getPanelProperties } from "@/lib/data";
import { brl, STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PainelImoveis() {
  const org = await getTenant();
  const rows = await getPanelProperties(org.id);

  return (
    <>
      <h1>Imóveis</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Imóvel</th><th>Bairro</th><th>Preço</th><th>Status</th>
            <th>Corretor</th><th>Visitas</th><th>Propostas</th><th>Dias no ar</th>
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
