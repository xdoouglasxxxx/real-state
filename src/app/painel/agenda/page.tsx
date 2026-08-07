import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { getVisits } from "@/lib/data";
import { setVisitStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_PT: Record<string, string> = {
  SCHEDULED: "Agendada", DONE: "Realizada", NO_SHOW: "Não veio", CANCELED: "Cancelada",
};

const fmtDay = (d: Date) =>
  d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" });
const fmtHour = (d: Date) =>
  d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function Agenda({ searchParams }: { searchParams: { salvo?: string } }) {
  const org = await getTenant();
  const visits = await getVisits(org.id);

  // agrupar por dia
  const groups = new Map<string, typeof visits>();
  for (const v of visits) {
    const key = fmtDay(new Date(v.scheduledAt));
    if (!groups.has(key)) groups.set(key, [] as any);
    (groups.get(key) as any).push(v);
  }

  const Btn = ({ id, status, label }: { id: string; status: string; label: string }) => (
    <form action={setVisitStatus} style={{ display: "inline" }}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="pill" type="submit" style={{ cursor: "pointer", background: "none" }}>{label}</button>
    </form>
  );

  return (
    <>
      <div className="phead">
        <h1>Agenda de visitas</h1>
        <Link className="btn-solid" href="/painel/agenda/nova">＋ Agendar visita</Link>
      </div>
      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Visita agendada — o lead foi movido para "Visita" no funil.</p>}

      {visits.length === 0 && (
        <p style={{ color: "var(--stone)" }}>
          Nenhuma visita próxima. Agende pela ficha do lead (botão "Agendar visita") ou pelo botão acima.
        </p>
      )}

      {[...groups.entries()].map(([day, items]) => (
        <section key={day} className="agenda-day">
          <h2>{day}</h2>
          {(items as any[]).map((v) => (
            <div className="agenda-item" key={v.id}>
              <span className="agenda-hour">{fmtHour(new Date(v.scheduledAt))}</span>
              <div className="agenda-info">
                <strong>{v.contact?.name ?? "Visita"}</strong>
                <span>{v.property?.title}</span>
                <span>{v.agent?.name ?? "Sem corretor"} {v.contact?.phone ? `· ${v.contact.phone}` : ""}</span>
              </div>
              <span className={"pill agenda-status-" + v.status}>{STATUS_PT[v.status] ?? v.status}</span>
              <div className="agenda-actions">
                {v.status === "SCHEDULED" && (
                  <>
                    <Btn id={v.id} status="DONE" label="✔ Realizada" />
                    <Btn id={v.id} status="NO_SHOW" label="Não veio" />
                    <Btn id={v.id} status="CANCELED" label="Cancelar" />
                  </>
                )}
                {v.lead?.id && <Link className="pill" href={`/painel/leads/${v.lead.id}`}>Ficha ↗</Link>}
              </div>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
