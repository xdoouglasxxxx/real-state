import type { Metadata } from "next";
import Link from "next/link";
import { createTenant } from "@/app/auth-actions";

export const metadata: Metadata = { title: "Crie sua imobiliária", robots: { index: false } };

const ERROS: Record<string, string> = {
  campos: "Preencha nome, e-mail válido e senha com 6+ caracteres.",
  interno: "Erro ao criar. Tente novamente em instantes.",
  demo: "Plataforma em modo demonstração (sem banco configurado).",
};

export default function Criar({ searchParams }: { searchParams: { erro?: string } }) {
  return (
    <main className="auth-page">
      <div className="auth-card wide">
        <p className="eyebrow">Comece grátis · 14 dias de teste</p>
        <h1>Crie a sua <em>imobiliária</em></h1>
        <p className="lead" style={{ marginTop: ".6rem" }}>
          Site de alto padrão + CRM prontos em 1 minuto. Sem cartão de crédito.
        </p>

        {searchParams.erro && <p className="pform-error">{ERROS[searchParams.erro] ?? "Erro inesperado."}</p>}

        <form action={createTenant} className="form" style={{ marginTop: "1.4rem" }}>
          <div className="form-row">
            <input name="name" placeholder="Nome da imobiliária*" required />
            <input name="slug" placeholder="Endereço (ex.: silva)" pattern="[a-zA-Z0-9-]{2,40}"
              title="Só letras, números e hífen" />
          </div>
          <div className="form-row">
            <input name="city" placeholder="Cidade" />
            <input name="creci" placeholder="CRECI jurídico" />
          </div>
          <div className="form-row">
            <input name="phone" placeholder="Telefone / WhatsApp" />
            <select name="plan" defaultValue="STARTER">
              <option value="STARTER">Plano Starter — site + anúncios</option>
              <option value="PRO">Plano Pro — site + CRM completo</option>
              <option value="ENTERPRISE">Plano Enterprise — tudo + financeiro</option>
            </select>
          </div>

          <div className="brand-row">
            <label>Cor da marca <input type="color" name="themeBrass" defaultValue="#c6a15b" /></label>
            <label>Cor de fundo <input type="color" name="themeInk" defaultValue="#17130e" /></label>
          </div>

          <hr className="auth-hr" />
          <p className="auth-sub">Acesso do administrador</p>
          <div className="form-row">
            <input name="email" type="email" placeholder="Seu e-mail*" required />
            <input name="password" type="password" placeholder="Senha (mín. 6)*" minLength={6} required />
          </div>

          <button className="btn-solid" type="submit">Criar minha imobiliária →</button>
        </form>

        <p className="auth-alt">Já tem conta? <Link href="/login">Entrar no painel</Link></p>
      </div>
    </main>
  );
}
