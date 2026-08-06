"use client";
import { useRef, useState } from "react";

/**
 * Gerencia as fotos do imóvel.
 * - Com Cloudinary configurado (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME +
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET): botão de upload direto do computador.
 * - Sem Cloudinary: campo para colar URLs de imagem.
 * As URLs vão no form como inputs hidden name="photos".
 */
export default function PhotoUploader({ initial = [] }: { initial?: string[] }) {
  const [photos, setPhotos] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const hasCloudinary = Boolean(cloud && preset);

  const upload = async (files: FileList | null) => {
    if (!files?.length || !hasCloudinary) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", preset!);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: fd });
        const json = await res.json();
        if (json.secure_url) setPhotos((p) => [...p, json.secure_url]);
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    setPhotos((p) => {
      const j = i + dir;
      if (j < 0 || j >= p.length) return p;
      const copy = [...p];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  return (
    <div className="uploader">
      {photos.map((url) => <input key={url} type="hidden" name="photos" value={url} />)}

      <div className="uploader-grid">
        {photos.map((url, i) => (
          <div className="uploader-item" key={url}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${i + 1}`} />
            {i === 0 && <span className="uploader-cover">Capa</span>}
            <div className="uploader-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para a esquerda">←</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label="Mover para a direita">→</button>
              <button type="button" onClick={() => setPhotos((p) => p.filter((u) => u !== url))} aria-label="Remover">✕</button>
            </div>
          </div>
        ))}
      </div>

      {hasCloudinary ? (
        <label className="btn-outline uploader-btn">
          {busy ? "Enviando..." : "＋ Enviar fotos"}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} disabled={busy} />
        </label>
      ) : (
        <div className="uploader-url">
          <input placeholder="Cole a URL de uma foto e clique em Adicionar" value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)} />
          <button type="button" className="btn-outline"
            onClick={() => { if (urlDraft.trim()) { setPhotos((p) => [...p, urlDraft.trim()]); setUrlDraft(""); } }}>
            Adicionar
          </button>
          <p className="uploader-hint">
            Dica: configure o Cloudinary no .env (NEXT_PUBLIC_CLOUDINARY_*) para habilitar upload direto do computador.
          </p>
        </div>
      )}
    </div>
  );
}
