import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/app/auth-actions";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function Login({ searchParams }: { searchParams: { erro?: string } }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Painel da imobiliária</p>
        <h1>Entrar</h1>

        {searchParams.erro && <p className="pform-error">Credenciais inválidas. Confira o endereço, e-mail e senha.</p>}

        <form action={login} className="form" style={{ marginTop: "1.4rem" }}>
          <input name="email" type="email" placeholder="E-mail do administrador" required />
          <input name="password" type="password" placeholder="Senha" required />
          <input name="slug" placeholder="Endereço do site (opcional)" />
          <p className="auth-hint">Só preencha o endereço se o mesmo e-mail administrar mais de uma imobiliária.</p>
          <button className="btn-solid" type="submit">Entrar</button>
        </form>

        <p className="auth-alt">Ainda não tem conta? <Link href="/criar">Criar minha imobiliária</Link></p>
      </div>
    </main>
  );
}
