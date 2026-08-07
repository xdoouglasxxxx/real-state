import Link from "next/link";
import { requireManagerUp } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { createAgent, toggleAgent } from "./actions";

export const dynamic = "force-dynamic";

export default async function Corretores({ searchParams }: { searchParams: { salvo?: string; erro?: string } }) {
  const { org } = await requireManagerUp();
  let agents: any[] = [];
  try {
    agents = await prisma.agent.findMany({
      where: { organizationId: org.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      include: { _count: { select: { leads: true, properties: true } } },
    });
  } catch {}

  return (
    <>
      <h1>Corretores</h1>
      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Corretor cadastrado.</p>}
      {searchParams.erro && <p className="pform-error">Informe ao menos o nome.</p>}

      <form action={createAgent} className="pform" style={{ maxWidth: 860, marginBottom: "2rem" }}>
        <section>
          <h2>Novo corretor</h2>
          <div className="pgrid">
            <label className="span2">Nome*<input name="name" required /></label>
            <label>CRECI<input name="creci" placeholder="CRECI 12.345" /></label>
            <label>Telefone / WhatsApp<input name="phone" /></label>
            <label className="span2">E-mail<input name="email" type="email" /></label>
            <label className="span2">Foto (URL)<input name="photoUrl" placeholder="https://..." /></label>
            <label className="span4 check">
              <input type="checkbox" name="isFeatured" defaultChecked />
              Exibir na página "Sobre" e na home do site
            </label>
          </div>
          <div className="pform-footer"><button className="btn-solid" type="submit">Cadastrar corretor</button></div>
        </section>
      </form>

      {agents.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Nome</th><th>CRECI</th><th>Telefone</th><th>Leads</th><th>Imóveis</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} style={{ opacity: a.isActive ? 1 : 0.45 }}>
                <td><Link href={`/painel/corretores/${a.id}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{a.name}</Link></td>
                <td>{a.creci ?? "—"}</td>
                <td>{a.phone ?? "—"}</td>
                <td>{a._count.leads}</td>
                <td>{a._count.properties}</td>
                <td><span className="pill">{a.isActive ? "Ativo" : "Inativo"}</span></td>
                <td>
                  <form action={toggleAgent}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="pill" type="submit" style={{ cursor: "pointer", background: "none" }}>
                      {a.isActive ? "Desativar" : "Reativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {agents.length === 0 && (
        <p style={{ color: "var(--stone)" }}>Nenhum corretor ainda — cadastre o primeiro acima. Eles aparecem nos dropdowns de leads e imóveis, e no site (se marcados para exibir).</p>
      )}
    </>
  );
}
