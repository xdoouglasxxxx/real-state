import type { Metadata } from "next";
import { submitSellInquiry } from "@/app/actions";

export const metadata: Metadata = { title: "Venda seu imóvel" };

const STEPS = [
  ["Avaliação", "Visitamos o imóvel e entregamos um estudo de preço em 48 h."],
  ["Preparação", "Fotos, planta humanizada e tour virtual sem custo para você."],
  ["Venda", "Negociação conduzida por especialistas e papelada por nossa conta."],
];

export default function Vender({ searchParams }: { searchParams: { enviado?: string; erro?: string } }) {
  return (
    <main className="page narrow">
      <div className="page-head">
        <p className="eyebrow">Avaliação gratuita</p>
        <h1>Venda com quem <em>valoriza</em> o seu imóvel</h1>
        <p className="lead">
          Análise comparativa de mercado, fotografia profissional, divulgação segmentada e
          acompanhamento jurídico completo — do anúncio à escritura.
        </p>
      </div>

      <div className="sell-steps">
        {STEPS.map(([t, d], i) => (
          <div className="step" key={t}>
            <span className="step-n">{String(i + 1).padStart(2, "0")}</span>
            <div><h3>{t}</h3><p>{d}</p></div>
          </div>
        ))}
      </div>

      {searchParams.enviado ? (
        <div className="empty">
          <h3>Solicitação enviada!</h3>
          <p>Nossa equipe entra em contato em até 2 horas úteis para agendar a avaliação.</p>
        </div>
      ) : (
        <form action={submitSellInquiry} className="form boxed">
          <div className="form-row">
            <input name="name" placeholder="Seu nome" required maxLength={120} />
            <input name="phone" placeholder="Telefone / WhatsApp" required maxLength={20} />
          </div>
          <input name="address" placeholder="Endereço do imóvel" required maxLength={300} />
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
          <select name="type" defaultValue="HOUSE">
            <option value="HOUSE">Casa</option>
            <option value="APARTMENT">Apartamento</option>
            <option value="LAND">Terreno</option>
            <option value="COMMERCIAL">Comercial</option>
          </select>
          <label className="consent">
            <input type="checkbox" name="lgpd" required />
            <span>Concordo em ser contatado sobre imóveis e serviços, conforme a <a href="/privacidade">Política de Privacidade</a></span>
          </label>
          {searchParams.erro && <p style={{ color: "#d88" }}>{searchParams.erro === "limite"
            ? "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo."
            : "Preencha todos os campos e aceite a Política de Privacidade."}</p>}
          <button className="btn-solid" type="submit">Solicitar avaliação gratuita</button>
        </form>
      )}
    </main>
  );
}
