import { requirePanel, ROLE_LABEL } from "@/lib/perm";
import { changePassword } from "@/app/auth-actions";

export const dynamic = "force-dynamic";

const ERRO_MSG: Record<string, string> = {
  curta: "A nova senha precisa de pelo menos 6 caracteres.",
  confirma: "A confirmação não confere com a nova senha.",
  atual: "Senha atual incorreta.",
  master: "O acesso master usa as variáveis PAINEL_USER/PAINEL_PASS da Vercel — altere lá.",
  interno: "Erro ao salvar. Tente de novo — se persistir, veja os Logs da Vercel.",
};

export default async function MinhaConta({ searchParams }: { searchParams: { salvo?: string; erro?: string } }) {
  const ctx = await requirePanel();

  return (
    <>
      <h1>Minha conta</h1>
      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Senha alterada — use a nova no próximo login.</p>}
      {searchParams.erro && <p className="pform-error">{ERRO_MSG[searchParams.erro] ?? ERRO_MSG.interno}</p>}

      <div className="pform" style={{ maxWidth: 620 }}>
        <section>
          <h2>Identificação</h2>
          <p><strong>E-mail:</strong> {ctx.email}</p>
          <p><strong>Papel:</strong> {ctx.master ? "Master (plataforma)" : ROLE_LABEL[ctx.role] ?? ctx.role}</p>
          <p><strong>Imobiliária:</strong> {ctx.org.name}</p>
        </section>
      </div>

      {!ctx.master && (
        <form action={changePassword} className="pform" style={{ maxWidth: 620, marginTop: "1.4rem" }}>
          <section>
            <h2>Alterar senha</h2>
            <div className="pgrid">
              <label className="span2">Senha atual*<input name="current" type="password" required /></label>
              <label className="span2">Nova senha* (mín. 6)<input name="next" type="password" minLength={6} required /></label>
              <label className="span2">Confirmar nova senha*<input name="confirm" type="password" minLength={6} required /></label>
            </div>
            <div className="pform-footer"><button className="btn-solid" type="submit">Salvar nova senha</button></div>
          </section>
        </form>
      )}
    </>
  );
}
