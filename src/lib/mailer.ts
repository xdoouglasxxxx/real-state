/**
 * E-mail transacional via Resend (https://resend.com) usando fetch — sem
 * dependências. Envs: RESEND_API_KEY e MAIL_FROM (ex.: "Maison <nao-responda@seudominio.com.br>").
 * Sem as envs, não envia (retorna false) e registra um aviso sem dados pessoais.
 */
export const mailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

/** Escapa texto dinâmico antes de colocar em HTML de e-mail. */
export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export async function sendEmail(opts: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    console.warn("[mailer] RESEND_API_KEY/MAIL_FROM ausentes — e-mail NÃO enviado (veja EMAIL.md)");
    return false;
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.error("[mailer] Resend recusou:", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[mailer] erro de envio:", e);
    return false;
  }
}
