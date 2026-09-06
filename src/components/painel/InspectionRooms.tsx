"use client";
import { useRef, useState } from "react";

/** Ambientes da vistoria de locação (entrada/saída).
 *  Estado local + serialização em UM hidden name="rooms" (JSON) — o servidor
 *  re-valida e sanitiza. Upload de fotos igual ao PhotoUploader: Cloudinary
 *  quando configurado; sem ele, colar URL. */

export type InspectionRoom = {
  nome: string;
  estado: "OTIMO" | "BOM" | "REGULAR" | "RUIM";
  obs: string;
  fotos: string[];
};

export const ROOM_STATE_LABEL: Record<string, string> = {
  OTIMO: "Ótimo", BOM: "Bom", REGULAR: "Regular", RUIM: "Ruim",
};

const PRESETS = ["Sala", "Cozinha", "Quarto", "Banheiro", "Área de serviço", "Área externa"];

export default function InspectionRooms({ initial = [] }: { initial?: InspectionRoom[] }) {
  const [rooms, setRooms] = useState<InspectionRoom[]>(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState<Record<number, string>>({});
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const hasCloudinary = Boolean(cloud && preset);

  const patch = (i: number, p: Partial<InspectionRoom>) =>
    setRooms((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...p } : r)));

  const addRoom = (nome = "") =>
    setRooms((rs) => [...rs, { nome, estado: "BOM", obs: "", fotos: [] }]);

  // update funcional: vários arquivos em sequência sem closure stale
  const addFoto = (i: number, url: string) =>
    setRooms((rs) => rs.map((r, idx) => (idx === i ? { ...r, fotos: [...r.fotos, url] } : r)));

  const upload = async (i: number, files: FileList | null) => {
    if (!files?.length || !hasCloudinary) return;
    setBusy(i);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", preset!);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
        const json = await res.json();
        if (json.secure_url) addFoto(i, json.secure_url);
      }
    } finally {
      setBusy(null);
      const ref = fileRefs.current[i];
      if (ref) ref.value = "";
    }
  };

  return (
    <div>
      <input type="hidden" name="rooms" value={JSON.stringify(rooms)} />

      {rooms.map((r, i) => (
        <div key={i} className="ficha-box" style={{ marginBottom: ".9rem", padding: "1rem" }}>
          <div className="pgrid">
            <label className="span2">Ambiente
              <input value={r.nome} maxLength={60} placeholder="ex.: Sala de estar"
                onChange={(e) => patch(i, { nome: e.target.value })} />
            </label>
            <label>Estado
              <select value={r.estado} onChange={(e) => patch(i, { estado: e.target.value as InspectionRoom["estado"] })}>
                {Object.entries(ROOM_STATE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="span4">Observações (avarias, detalhes)
              <textarea rows={2} maxLength={1000} value={r.obs}
                onChange={(e) => patch(i, { obs: e.target.value })} />
            </label>
          </div>

          <div className="uploader" style={{ marginTop: ".6rem" }}>
            <div className="uploader-grid">
              {r.fotos.map((url, fi) => (
                <div className="uploader-item" key={url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${r.nome || "Ambiente"} — foto ${fi + 1}`} />
                  <div className="uploader-actions">
                    <button type="button" aria-label="Remover foto"
                      onClick={() => patch(i, { fotos: r.fotos.filter((u) => u !== url) })}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            {hasCloudinary ? (
              <label className="btn-outline uploader-btn">
                {busy === i ? "Enviando..." : "＋ Fotos do ambiente"}
                <input ref={(el) => { fileRefs.current[i] = el; }} type="file" accept="image/*" multiple hidden
                  onChange={(e) => upload(i, e.target.files)} disabled={busy !== null} />
              </label>
            ) : (
              <div className="uploader-url">
                <input placeholder="Cole a URL de uma foto" value={urlDraft[i] ?? ""}
                  onChange={(e) => setUrlDraft((d) => ({ ...d, [i]: e.target.value }))} />
                <button type="button" className="btn-outline"
                  onClick={() => {
                    const u = (urlDraft[i] ?? "").trim();
                    if (u) { patch(i, { fotos: [...r.fotos, u] }); setUrlDraft((d) => ({ ...d, [i]: "" })); }
                  }}>
                  Adicionar
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: ".6rem", textAlign: "right" }}>
            <button type="button" className="panel-link" style={{ padding: 0 }}
              onClick={() => setRooms((rs) => rs.filter((_, idx) => idx !== i))}>
              Remover ambiente
            </button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".4rem" }}>
        <button type="button" className="btn-outline" onClick={() => addRoom()}>＋ Adicionar ambiente</button>
        {PRESETS.filter((p) => !rooms.some((r) => r.nome === p)).map((p) => (
          <button key={p} type="button" className="panel-link" style={{ padding: "0 .3rem" }} onClick={() => addRoom(p)}>
            + {p}
          </button>
        ))}
      </div>
    </div>
  );
}
