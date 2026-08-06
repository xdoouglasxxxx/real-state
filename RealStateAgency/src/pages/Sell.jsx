import { useState } from "react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  ["Avaliação", "Visitamos o imóvel e entregamos um estudo de preço em 48 h."],
  ["Preparação", "Fotos, planta humanizada e tour virtual sem custo para você."],
  ["Venda", "Negociação conduzida por especialistas e papelada por nossa conta."],
];

export default function Sell() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", address: "", type: "house" });
  const ok = f.name.trim() && f.phone.trim() && f.address.trim();

  const submit = async () => {
    if (!ok || sending) return;
    setSending(true);
    await base44.entities.Inquiry.create({
      name: f.name, phone: f.phone,
      message: `Quer vender: ${f.address} (${f.type})`,
      kind: "sell",
    });
    setSending(false);
    setSent(true);
  };

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

      {sent ? (
        <div className="empty">
          <h3>Solicitação enviada!</h3>
          <p>Nossa equipe entra em contato em até 2 horas úteis para agendar a avaliação.</p>
        </div>
      ) : (
        <div className="form boxed">
          <div className="form-row">
            <input placeholder="Seu nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input placeholder="Telefone / WhatsApp" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          <input placeholder="Endereço do imóvel" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
            <option value="house">Casa</option>
            <option value="apartment">Apartamento</option>
            <option value="land">Terreno</option>
            <option value="commercial">Comercial</option>
          </select>
          <button className="btn-solid" disabled={!ok || sending} onClick={submit}>
            {sending ? "Enviando..." : "Solicitar avaliação gratuita"}
          </button>
        </div>
      )}
    </main>
  );
}
