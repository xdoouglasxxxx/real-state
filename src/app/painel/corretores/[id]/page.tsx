import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagerUp } from "@/lib/perm";
import { updateAgent, toggleAgent } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditarCorretor({
  params, searchParams,
}: { params: { id: string }; searchParams: { salvo?: string; erro?: string } }) {
  const { org } = await requireManagerUp();

  let agent: any = null;
  try {
    agent = await prisma.agent.findFirst({
      where: { id: params.id, organizationId: org.id },
      include: { user: { select: { email: true, isActive: true } }, _count: { select: { leads: true, properties: true } } },
    });
  } catch {}
  if (!agent) notFound();

  return (
    <>
      <Link className="back" href="/painel/corretores">← Voltar aos corretores</Link>
      <div className="phead">
        <h1>{agent.name}</h1>
        <span className="pill">{agent._count.leads} leads · {agent._count.properties} imóveis</span>
        {agent.creciValidUntil && new Date(agent.creciValidUntil) < new Date() && (
          <span className="pill" style={{ background: "#a33", color: "#fff" }}>⚠ CRECI vencido</span>
        )}
      </div>

      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Corretor atualizado.</p>}
      {searchParams.erro === "1" && <p className="pform-error">O nome é obrigatório.</p>}
      {searchParams.erro === "2" && <p className="pform-error">Erro ao salvar — tente de novo. Se persistir, veja os Logs da Vercel.</p>}

      <form action={updateAgent} className="pform" style={{ maxWidth: 860 }}>
        <input type="hidden" name="id" value={agent.id} />
        <section>
          <h2>Dados cadastrais</h2>
          <div className="pgrid">
            <label className="span2">Nome*<input name="name" defaultValue={agent.name} required /></label>
            <label>CRECI<input name="creci" defaultValue={agent.creci ?? ""} placeholder="CRECI 12.345" /></label>
            <label>UF CRECI
              <select name="creciUf" defaultValue={agent.creciUf ?? ""}>
                <option value="">—</option>
                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf: string) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </label>
            <label>Validade CRECI
              <input name="creciValidUntil" type="date"
                defaultValue={agent.creciValidUntil ? new Date(agent.creciValidUntil).toISOString().slice(0, 10) : ""} />
            </label>
            <label>Telefone / WhatsApp<input name="phone" defaultValue={agent.phone ?? ""} /></label>
            <label className="span2">E-mail<input name="email" type="email" defaultValue={agent.email ?? ""} /></label>
            <label className="span2">Foto (URL)<input name="photoUrl" defaultValue={agent.photoUrl ?? ""} placeholder="https://..." /></label>
            <label className="span2">Mini-bio (aparece no site)
              <textarea name="bio" rows={3} defaultValue={agent.bio ?? ""} placeholder="Especialista em imóveis de alto padrão na zona sul..." />
            </label>
            <label>Comissão padrão (%)
              <input name="commissionPct" inputMode="decimal" defaultValue={String(agent.commissionPct ?? "2.5")} placeholder="2,5" />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: "1.4rem" }}>
              <input type="checkbox" name="isFeatured" defaultChecked={agent.isFeatured} style={{ width: "auto" }} />
              Exibir na página &quot;Sobre&quot; e na home do site
            </label>
          </div>
          <p className="pform-hint">
            Acesso ao painel: {agent.user
              ? `vinculado ao usuário ${agent.user.email}${agent.user.isActive ? "" : " (desativado)"}`
              : "sem usuário vinculado — crie em Usuários (papel Corretor) e escolha \u201cVincular a\u201d este perfil"}.
            A comissão padrão é usada como sugestão ao fechar contratos.
          </p>
          <div className="pform-footer">
            <button className="btn-solid" type="submit">Salvar alterações</button>
          </div>
        </section>
      </form>

      <form action={toggleAgent} style={{ marginTop: "1rem" }}>
        <input type="hidden" name="id" value={agent.id} />
        <button className="btn-outline" type="submit">
          {agent.isActive ? "Desativar corretor" : "Reativar corretor"}
        </button>
      </form>
    </>
  );
}
