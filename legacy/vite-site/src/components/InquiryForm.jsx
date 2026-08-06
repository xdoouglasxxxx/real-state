import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function InquiryForm({ propertyId = null, kind = "visit" }) {
  const [f, setF] = useState({ name: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const ok = f.name.trim() && f.phone.trim();

  const submit = async () => {
    if (!ok || sending) return;
    setSending(true);
    await base44.entities.Inquiry.create({
      name: f.name, phone: f.phone, message: f.message,
      property_id: propertyId, kind,
    });
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return <p className="ok">Recebemos seu interesse. Um consultor entra em contato em até 2 horas úteis.</p>;
  }

  return (
    <div className="form">
      <input placeholder="Seu nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input placeholder="Telefone / WhatsApp" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <textarea placeholder="Mensagem (opcional)" rows={3} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      <button className="btn-solid" disabled={!ok || sending} onClick={submit}>
        {sending ? "Enviando..." : "Enviar interesse"}
      </button>
    </div>
  );
}
