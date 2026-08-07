/**
 * SUPABASE STORAGE — bucket privado "documentos".
 * Sem SDK: só fetch na REST. A chave service_role NUNCA sai do servidor;
 * o navegador recebe apenas URLs assinadas de curta duração.
 * Guia de ativação: STORAGE.md (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
 */

const BUCKET = "documentos";

export const storageEnabled = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const base = () => String(process.env.SUPABASE_URL).replace(/\/$/, "");
const headers = () => ({
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
});

/** URL assinada para o NAVEGADOR enviar o arquivo direto ao bucket (PUT).
 *  Vantagem: o arquivo não passa pelo nosso servidor (sem limite de body). */
export async function signedUploadUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(`${base()}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
      method: "POST", headers: headers(), cache: "no-store",
    });
    if (!res.ok) { console.error("signedUploadUrl:", res.status, await res.text()); return null; }
    const data = await res.json();
    return data?.url ? `${base()}/storage/v1${data.url}` : null;
  } catch (e) { console.error("signedUploadUrl:", e); return null; }
}

/** URL assinada de download (padrão: 1h). */
export async function signedDownloadUrl(path: string, expiresIn = 3600): Promise<string | null> {
  try {
    const res = await fetch(`${base()}/storage/v1/object/sign/${BUCKET}/${path}`, {
      method: "POST", headers: headers(), cache: "no-store",
      body: JSON.stringify({ expiresIn }),
    });
    if (!res.ok) { console.error("signedDownloadUrl:", res.status, await res.text()); return null; }
    const data = await res.json();
    return data?.signedURL ? `${base()}/storage/v1${data.signedURL}` : null;
  } catch (e) { console.error("signedDownloadUrl:", e); return null; }
}

/** Remove o arquivo do bucket (usado ao excluir o documento). */
export async function deleteObject(path: string): Promise<void> {
  try {
    await fetch(`${base()}/storage/v1/object/${BUCKET}/${path}`, {
      method: "DELETE", headers: headers(),
    });
  } catch (e) { console.error("deleteObject:", e); }
}

export const safeFileName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80);
