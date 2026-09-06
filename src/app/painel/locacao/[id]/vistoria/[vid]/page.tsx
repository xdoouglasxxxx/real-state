import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { saveInspection } from "../../../actions";
import InspectionRooms, { type InspectionRoom } from "@/components/painel/InspectionRooms";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { ENTRADA: "Vistoria de entrada", SAIDA: "Vistoria de saída" };

export default async function EditarVistoria({
  params, searchParams,
}: { params: { id: string; vid: string }; searchParams: { salvo?: string; erro?: string } }) {
  const ctx = await requireAdmin();

  const insp = await prisma.inspection.findFirst({
    where: { id: params.vid, organizationId: ctx.org.id, rentalContractId: params.id },
    select: {
      id: true, kind: true, status: true, inspectedAt: true, inspectorName: true, notes: true, rooms: true,
      rentalContract: { select: { id: true, property: { select: { title: true } }, tenant: { select: { name: true } } } },
    },
  });
  if (!insp) notFound();

  const rooms: InspectionRoom[] = Array.isArray(insp.rooms) ? (insp.rooms as InspectionRoom[]) : [];
  const done = insp.status === "CONCLUIDA";

  return (
    <>
      <Link className="back" href={`/painel/locacao/${insp.rentalContract.id}/vistoria`}>← Voltar às vistorias</Link>
      <div className="phead">
        <h1>{KIND_LABEL[insp.kind]} — {insp.rentalContract.property?.title}</h1>
        <span className="pill">{done ? "Concluída" : "Rascunho"}</span>
      </div>
      <p style={{ color: "var(--stone)", marginBottom: "1.2rem" }}>
        Locatário: {insp.rentalContract.tenant?.name}. Registre o estado de cada ambiente com fotos —
        na saída, o comparativo com a entrada evita disputa de caução.
      </p>

      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Vistoria salva.</p>}
      {searchParams.erro && <p className="pform-error" style={{ marginBottom: "1rem" }}>Erro ao salvar — tente de novo.</p>}

      <form action={saveInspection} className="pform">
        <input type="hidden" name="id" value={insp.id} />
        <section>
          <h2>Dados da vistoria</h2>
          <div className="pgrid">
            <label>Data
              <input type="date" name="inspectedAt" defaultValue={new Date(insp.inspectedAt).toISOString().slice(0, 10)} />
            </label>
            <label className="span2">Vistoriador
              <input name="inspectorName" defaultValue={insp.inspectorName ?? ""} maxLength={80}
                placeholder="quem realizou a vistoria" />
            </label>
            <label className="span4">Observações gerais (internas — não vão para o cliente)
              <textarea name="notes" rows={2} maxLength={2000} defaultValue={insp.notes ?? ""} />
            </label>
          </div>
        </section>

        <section style={{ marginTop: "1rem" }}>
          <h2>Ambientes</h2>
          <InspectionRooms initial={rooms} />
        </section>

        <div className="pform-footer flex gap-3 flex-wrap">
          <button className="btn-outline" type="submit" name="op" value="salvar">Salvar rascunho</button>
          {done ? (
            <button className="btn-solid" type="submit" name="op" value="reabrir">Reabrir para edição</button>
          ) : (
            <button className="btn-solid" type="submit" name="op" value="concluir">Concluir vistoria</button>
          )}
        </div>
      </form>
    </>
  );
}
