import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/app/auth-actions";
import { mailEnabled } from "@/lib/mailer";

export const metadata: Metadata = { title: "Esqueci minha senha", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  email: "Informe um e-mail válido.",
  limite: "Muitas solicitações. Aguarde cerca de 1 hora e tente de novo.",
  indisponivel:
    "O envio de e-mails ainda não está ativo nesta plataforma. Peça ao administrador da sua imobiliária para redefinir a senha em Painel → Usuários.",
};

export default function Esqueci({ searchParams }: { searchParams: { erro?: string; enviado?: string } }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Acesso</p>
        <h1>Esqueci minha senha</h1>

        {searchParams.enviado ? (
          <>
            <p className="ok" style={{ marginTop: "1.2rem" }}>
              Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha.
              Ele vale por 1 hora. Confira também a caixa de spam.
            </p>
            <p className="auth-alt"><Link href="/login">← Voltar ao login</Link></p>
          </>
        ) : (
          <>
            {searchParams.erro && <p className="pform-error">{ERROS[searchParams.erro] ?? "Algo deu errado. Tente novamente."}</p>}
            {!mailEnabled() && !searchParams.erro && (
              <p className="auth-hint" style={{ marginTop: "1rem" }}>
                O envio de e-mails ainda não está ativo nesta plataforma. Peça ao administrador da sua
                imobiliária para redefinir a senha em Painel → Usuários.
              </p>
            )}
            <form action={requestPasswordReset} className="form" style={{ marginTop: "1.4rem" }}>
              <input name="email" type="email" placeholder="Seu e-mail de acesso" required autoComplete="email" />
              <button className="btn-solid" type="submit">Enviar link</button>
            </form>
            <p className="auth-alt"><Link href="/login">← Voltar ao login</Link></p>
          </>
        )}
      </div>
    </main>
  );
}
