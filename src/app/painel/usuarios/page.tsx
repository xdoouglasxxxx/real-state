import { prisma } from "@/lib/prisma";
import { requireAdmin, ROLE_LABEL } from "@/lib/perm";
import { getSubscriptionInfo } from "@/lib/data";
import { getPlan, fmtLimit } from "@/lib/plans";
import { createUser, toggleUser, resetUserPassword } from "./actions";

export const dynamic = "force-dynamic";

const ERRO_MSG: Record<string, string> = {
  campos: "Preencha nome, e-mail e papel.",
  senha: "A senha precisa de pelo menos 6 caracteres.",
  email: "Já existe um usuário com esse e-mail nesta imobiliária.",
  proprio: "Você não pode desativar o seu próprio acesso.",
  ultimoadmin: "Este é o único administrador ativo — cadastre outro antes de desativá-lo.",
  interno: "Erro ao salvar. Tente de novo — se persistir, veja os Logs da Vercel.",
};

export default async function Usuarios({ searchParams }: { searchParams: { salvo?: string; senha?: string; erro?: string } }) {
  const ctx = await requireAdmin();

  let users: any[] = [];
  let freeAgents: any[] = [];
  try {
    [users, freeAgents] = await Promise.all([
      prisma.user.findMany({
        // acessos de CLIENTE são criados na ficha do lead e não aparecem aqui
        where: { organizationId: ctx.org.id, role: { in: ["ORG_ADMIN", "MANAGER", "AGENT"] as any } },
        orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
        include: { agent: { select: { id: true, name: true } } },
      }),
      prisma.agent.findMany({
        where: { organizationId: ctx.org.id, userId: null, isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  } catch {}

  const sub = await getSubscriptionInfo(ctx.org.id);
  const plan = getPlan(sub.plan);
  const activeCount = users.filter((u) => u.isActive).length; // só papéis do painel

  return (
    <>
      <div className="phead">
        <h1>Usuários</h1>
        <span className="pill">{activeCount} / {fmtLimit(plan.maxUsers)} usuários · plano {plan.label}</span>
      </div>

      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Usuário criado — ele já pode entrar em /login com o próprio e-mail e senha.</p>}
      {searchParams.senha && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Senha redefinida.</p>}
      {searchParams.erro && <p className="pform-error">{ERRO_MSG[searchParams.erro] ?? ERRO_MSG.interno}</p>}

      <form action={createUser} className="pform" style={{ maxWidth: 860, marginBottom: "2rem" }}>
        <section>
          <h2>Novo usuário</h2>
          <div className="pgrid">
            <label className="span2">Nome*<input name="name" required /></label>
            <label className="span2">E-mail*<input name="email" type="email" required /></label>
            <label>Senha inicial*<input name="password" type="password" minLength={6} required /></label>
            <label>Papel
              <select name="role" defaultValue="AGENT">
                <option value="AGENT">Corretor — vê só os próprios leads e agenda</option>
                <option value="MANAGER">Gerente — opera todo o CRM</option>
                <option value="ORG_ADMIN">Administrador — acesso total</option>
              </select>
            </label>
            <label className="span2">Perfil de corretor (só para papel Corretor)
              <select name="agentLink" defaultValue="auto">
                <option value="auto">Criar perfil novo automaticamente</option>
                {freeAgents.map((a) => <option key={a.id} value={a.id}>Vincular a: {a.name}</option>)}
              </select>
            </label>
          </div>
          <p className="pform-hint">
            Corretores entram no mesmo /login e caem no portal deles: painel próprio,
            "Meus leads" e "Minha agenda". Gerente e Administrador veem tudo.
          </p>
          <div className="pform-footer"><button className="btn-solid" type="submit">Criar usuário</button></div>
        </section>
      </form>

      {users.length > 0 && (
        <table className="table">
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Corretor vinculado</th><th>Status</th><th>Nova senha</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.45 }}>
                <td>{u.name ?? "—"}</td>
                <td>{u.email}</td>
                <td><span className="pill">{ROLE_LABEL[u.role] ?? u.role}</span></td>
                <td>{u.agent?.name ?? "—"}</td>
                <td><span className="pill">{u.isActive ? "Ativo" : "Desativado"}</span></td>
                <td>
                  <form action={resetUserPassword} style={{ display: "flex", gap: ".4rem" }}>
                    <input type="hidden" name="id" value={u.id} />
                    <input name="password" type="password" minLength={6} placeholder="mín. 6" style={{ width: "7rem" }} />
                    <button className="pill" type="submit" style={{ cursor: "pointer", background: "none" }}>Definir</button>
                  </form>
                </td>
                <td>
                  <form action={toggleUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="pill" type="submit" style={{ cursor: "pointer", background: "none" }}>
                      {u.isActive ? "Desativar" : "Reativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
