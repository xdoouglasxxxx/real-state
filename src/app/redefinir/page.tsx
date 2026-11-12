import type { Metadata } from "next";
import Link from "next/link";
import { resetPassword } from "@/app/auth-actions";
import { readResetToken } from "@/lib/reset-token";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  curta: "A senha precisa ter pelo menos 8 caracteres.",
  confirma: "As senhas não conferem.",
  limite: "Muitas tentativas. Aguarde um pouco e tente de novo.",
  interno: "Não foi possível salvar agora. Tente novamente.",
};

export default function Redefinir({ searchParams }: { searchParams: { t?: string; erro?: string } }) {
  const token = searchParams.t ?? "";
  // Só valida assinatura/validade aqui; a conferência de uso único acontece ao salvar.
  const valid = Boolean(token) && Boolean(readResetToken(token)) && searchParams.erro !== "invalido";

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Acesso</p>
        <h1>Nova senha</h1>

        {!valid ? (
          <>
            <p className="pform-error" style={{ marginTop: "1.2rem" }}>
              Este link é inválido, expirou ou já foi usado.
            </p>
            <p className="auth-alt"><Link href="/esqueci">Pedir um novo link</Link></p>
          </>
        ) : (
          <>
            {searchParams.erro && <p className="pform-error">{ERROS[searchParams.erro] ?? "Algo deu errado."}</p>}
            <form action={resetPassword} className="form" style={{ marginTop: "1.4rem" }}>
              <input type="hidden" name="token" value={token} />
              <input name="next" type="password" placeholder="Nova senha (mín. 8 caracteres)" minLength={8} required autoComplete="new-password" />
              <input name="confirm" type="password" placeholder="Repita a nova senha" minLength={8} required autoComplete="new-password" />
              <button className="btn-solid" type="submit">Salvar nova senha</button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
