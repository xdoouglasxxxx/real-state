"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { prepareDocumentUpload, registerDocument } from "@/app/painel/documentos/actions";

const KIND_LABEL: Record<string, string> = {
  MATRICULA: "Matrícula", IPTU: "IPTU", ESCRITURA: "Escritura", ONUS: "Certidão de ônus",
  LAUDO: "Laudo", CONTRATO: "Contrato", COMPROVANTE: "Comprovante", RG: "RG", CPF: "CPF", OUTRO: "Outro",
};

type Opt = { id: string; label: string };

/** Upload direto ao Supabase Storage (URL assinada) + registro no banco. */
export default function DocumentUploader({ properties, contracts, finances, defaultPropertyId }:
  { properties: Opt[]; contracts: Opt[]; finances: Opt[]; defaultPropertyId?: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("MATRICULA");
  const [propertyId, setPropertyId] = useState(defaultPropertyId ?? "");
  const [contractId, setContractId] = useState("");
  const [financeEntryId, setFinanceEntryId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async () => {
    if (!file) return setMsg({ ok: false, text: "Escolha um arquivo (PDF ou imagem)." });
    if (file.size > 20 * 1024 * 1024) return setMsg({ ok: false, text: "Arquivo acima de 20 MB — comprima antes de enviar." });
    setBusy(true); setMsg(null);
    try {
      const prep = await prepareDocumentUpload(file.name);
      if ("error" in prep) {
        setMsg({ ok: false, text: prep.error === "storage_off"
          ? "Storage não configurado — siga o STORAGE.md (bucket + 2 variáveis na Vercel)."
          : "Não foi possível preparar o envio. Veja os Logs da Vercel." });
        setBusy(false); return;
      }
      const put = await fetch(prep.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" },
        body: file,
      });
      if (!put.ok) { setMsg({ ok: false, text: `Falha no envio ao bucket (${put.status}). Confira se o bucket "documentos" existe.` }); setBusy(false); return; }

      const reg = await registerDocument({
        path: prep.path,
        name: name.trim() || file.name,
        kind,
        propertyId: propertyId || null,
        contractId: contractId || null,
        financeEntryId: financeEntryId || null,
      });
      if ("error" in reg) { setMsg({ ok: false, text: "Enviado ao bucket, mas falhou ao registrar — tente de novo." }); setBusy(false); return; }

      setMsg({ ok: true, text: "✔ Documento enviado e registrado." });
      setFile(null); setName(""); setContractId(""); setFinanceEntryId("");
      router.refresh();
    } catch {
      setMsg({ ok: false, text: "Erro inesperado no envio — tente de novo." });
    }
    setBusy(false);
  };

  return (
    <div className="pform" style={{ maxWidth: 980 }}>
      <section>
        <h2>Enviar documento</h2>
        {msg && <p className={msg.ok ? "ok" : "pform-error"} style={{ marginBottom: ".6rem" }}>{msg.text}</p>}
        <div className="pgrid">
          <label className="span2">Arquivo* (PDF ou imagem, até 20 MB)
            <input type="file" accept="application/pdf,image/*"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); if (!name) setName(e.target.files?.[0]?.name ?? ""); }} />
          </label>
          <label>Tipo
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Nome de exibição<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Matrícula atualizada 2026" /></label>
          <label>Vincular a imóvel
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
              <option value="">— Nenhum —</option>
              {properties.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <label>Vincular a contrato
            <select value={contractId} onChange={(e) => setContractId(e.target.value)}>
              <option value="">— Nenhum —</option>
              {contracts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <label className="span2">Vincular a lançamento financeiro (comprovante)
            <select value={financeEntryId} onChange={(e) => setFinanceEntryId(e.target.value)}>
              <option value="">— Nenhum —</option>
              {finances.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
        </div>
        <div className="pform-footer">
          <button className="btn-solid" type="button" onClick={send} disabled={busy}>
            {busy ? "Enviando..." : "📎 Enviar com rastreabilidade"}
          </button>
        </div>
      </section>
    </div>
  );
}
