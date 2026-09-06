import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { createInspection } from "../../actions";
import PrintButton from "@/components/painel/PrintButton";

export const dynamic = "force-dynamic";

const fmtD = (x: Date | string) => new Date(x).toLocaleDateString("pt-BR");
const STATE_LABEL: Record<string, string> = { OTIMO: "Ótimo", BOM: "Bom", REGULAR: "Regular", RUIM: "Ruim" };
const STATE_COLOR: Record<string, string> = { OTIMO: "#8fbb7d", BOM: "var(--cream)", REGULAR: "var(--brass)", RUIM: "#e57373" };
const KIND_LABEL: Record<string, string> = { ENTRADA: "Vistoria de entrada", SAIDA: "Vistoria de saída" };

type Room = { nome: string; estado: string; obs: string; fotos: string[] };

export default async function VistoriasPage({
  params, searchParams,
}: { params: { id: string }; searchParams: { ok?: string } }) {
  const ctx = await requireAdmin();

  const contract = await prisma.rentalContract.findFirst({
    where: { id: params.id, organizationId: ctx.org.id },
    select: {
      id: true, startDate: true, endDate: true,
      property: { select: { title: true, neighborhood: true } },
      tenant: { select: { name: true } },
      owner: { select: { name: true } },
      inspections: {
        orderBy: { kind: "asc" },
        select: { id: true, kind: true, status: true, inspectedAt: true, inspectorName: true, rooms: true },
      },
    },
  });
  if (!contract) notFound();

  const entrada = contract.inspections.find((i) => i.kind === "ENTRADA");
  const saida = contract.inspections.find((i) => i.kind === "SAIDA");
  const roomsOf = (i?: { rooms: unknown } | null): Room[] => (Array.isArray(i?.rooms) ? (i!.rooms as Room[]) : []);
  const entradaRooms = roomsOf(entrada);
  const saidaRooms = roomsOf(saida);
  const allNames = [...entradaRooms.map((r) => r.nome), ...saidaRooms.filter((r) => !entradaRooms.some((e) => e.nome === r.nome)).map((r) => r.nome)];

  return (
    <>
      <Link className="back" href={`/painel/locacao/${contract.id}`}>← Voltar ao contrato</Link>
      <div className="phead">
        <h1>Vistorias — {contract.property?.title}</h1>
        {(entrada || saida) && <PrintButton />}
      </div>
      <p style={{ color: "var(--stone)", marginBottom: "1.2rem" }}>
        Locatário: <strong>{contract.tenant?.name}</strong> · Proprietário: {contract.owner?.name} ·
        vigência {fmtD(contract.startDate)} → {fmtD(contract.endDate)}
      </p>

      {searchParams.ok && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Vistoria concluída.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {(["ENTRADA", "SAIDA"] as const).map((kind) => {
          const insp = kind === "ENTRADA" ? entrada : saida;
          return (
            <section className="ficha-box" key={kind}>
              <div className="flex justify-between items-baseline gap-3 flex-wrap">
                <h2>{KIND_LABEL[kind]}</h2>
                {insp && <span className="pill">{insp.status === "CONCLUIDA" ? "Concluída" : "Rascunho"}</span>}
              </div>
              {insp ? (
                <>
                  <p style={{ color: "var(--stone)", fontSize: ".88rem", margin: ".4rem 0 .8rem" }}>
                    {fmtD(insp.inspectedAt)}{insp.inspectorName ? ` · vistoriador: ${insp.inspectorName}` : ""} ·{" "}
                    {roomsOf(insp).length} ambiente(s)
                  </p>
                  <Link className="btn-outline" href={`/painel/locacao/${contract.id}/vistoria/${insp.id}`}>
                    {insp.status === "CONCLUIDA" ? "Ver / reabrir" : "Continuar vistoria"}
                  </Link>
                </>
              ) : (
                <form action={createInspection} style={{ marginTop: ".6rem" }}>
                  <input type="hidden" name="contractId" value={contract.id} />
                  <input type="hidden" name="kind" value={kind} />
                  <button className="btn-solid" type="submit">Iniciar {KIND_LABEL[kind].toLowerCase()}</button>
                </form>
              )}
            </section>
          );
        })}
      </div>

      {allNames.length > 0 && (
        <section className="ficha-box">
          <h2>Comparativo entrada × saída</h2>
          <table className="table" style={{ marginTop: ".8rem" }}>
            <thead>
              <tr><th>Ambiente</th><th>Entrada</th><th>Saída</th></tr>
            </thead>
            <tbody>
              {allNames.map((nome) => {
                const e = entradaRooms.find((r) => r.nome === nome);
                const s = saidaRooms.find((r) => r.nome === nome);
                const cell = (r?: Room) => r ? (
                  <>
                    <strong style={{ color: STATE_COLOR[r.estado] ?? "var(--cream)" }}>{STATE_LABEL[r.estado] ?? r.estado}</strong>
                    {r.obs && <span style={{ color: "var(--stone)" }}> — {r.obs}</span>}
                    {r.fotos.length > 0 && (
                      <span className="flex gap-1 flex-wrap mt-1">
                        {r.fotos.slice(0, 6).map((u) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a key={u} href={u} target="_blank" rel="noopener">
                            <img src={u} alt={nome} style={{ width: 74, height: 56, objectFit: "cover", borderRadius: 6 }} />
                          </a>
                        ))}
                      </span>
                    )}
                  </>
                ) : <span style={{ color: "var(--stone)" }}>—</span>;
                return (
                  <tr key={nome}>
                    <td style={{ verticalAlign: "top" }}><strong>{nome}</strong></td>
                    <td style={{ verticalAlign: "top" }}>{cell(e)}</td>
                    <td style={{ verticalAlign: "top" }}>{cell(s)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(entrada?.status !== "CONCLUIDA" || (saida && saida.status !== "CONCLUIDA")) && (
            <p style={{ color: "var(--stone)", fontSize: ".8rem", marginTop: ".8rem" }}>
              Rascunhos aparecem no comparativo — conclua as duas vistorias antes de imprimir a versão final.
            </p>
          )}
        </section>
      )}
    </>
  );
}
