import { prisma } from "@/lib/prisma";
import { requireClientPortal } from "@/lib/perm";
import { VISIT_LABEL } from "@/lib/data";

export const dynamic = "force-dynamic";

const fmtDT = (x: Date | string) =>
  new Date(x).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function VisitasPage() {
  const ctx = await requireClientPortal();

  let visits: any[] = [];
  try {
    if (ctx.contactIds.length > 0) {
      visits = await prisma.visit.findMany({
        where: { organizationId: ctx.org.id, contactId: { in: ctx.contactIds } },
        orderBy: { scheduledAt: "desc" },
        take: 50,
        // notes é anotação interna do corretor — nunca vai para o cliente
        select: {
          id: true, scheduledAt: true, status: true,
          property: { select: { title: true, slug: true, neighborhood: true } },
          agent: { select: { name: true } },
        },
      });
    }
  } catch (e) { console.error("portal/visitas:", e); }

  const upcoming = visits.filter((v) => v.status === "SCHEDULED" && +new Date(v.scheduledAt) >= Date.now() - 3600000);
  const past = visits.filter((v) => !upcoming.includes(v));

  return (
    <>
      <h1>Minhas visitas</h1>
      <p style={{ color: "var(--stone)", marginBottom: "1.6rem" }}>
        Agendamentos e histórico das suas visitas com a {ctx.org.name}.
      </p>

      {visits.length === 0 && (
        <section className="ficha-box">
          <h2>Nenhuma visita por aqui</h2>
          <p style={{ color: "var(--stone)" }}>
            Quando seu corretor agendar uma visita, ela aparece nesta página.
          </p>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="ficha-box" style={{ marginBottom: "1.4rem" }}>
          <h2>Próximas visitas</h2>
          {upcoming.map((v) => (
            <p key={v.id} style={{ marginBottom: ".45rem" }}>
              📅 <strong>{fmtDT(v.scheduledAt)}</strong> — {v.property?.title}
              {v.property?.neighborhood ? <span style={{ color: "var(--stone)" }}> · {v.property.neighborhood}</span> : null}
              {v.agent?.name ? ` · com ${v.agent.name}` : ""} <span className="pill">Agendada</span>
            </p>
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="ficha-box">
          <h2>Visitas anteriores</h2>
          {past.map((v) => (
            <p key={v.id} style={{ marginBottom: ".35rem", color: "var(--stone)", fontSize: ".9rem" }}>
              {fmtDT(v.scheduledAt)} — {v.property?.title} · {VISIT_LABEL[v.status] ?? v.status}
            </p>
          ))}
        </section>
      )}
    </>
  );
}
