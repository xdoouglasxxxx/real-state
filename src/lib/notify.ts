/**
 * Notificação de lead novo via WhatsApp Cloud API (Meta).
 * Sem as envs configuradas, registra no log (Vercel -> Logs) e segue o baile.
 * Setup completo: veja WHATSAPP.md na raiz do projeto.
 * Envs: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID
 */
export async function notifyNewLead(opts: {
  orgName: string;
  leadName: string;
  leadPhone: string;
  interest?: string | null;
  agentName?: string | null;
  agentPhone?: string | null;
}) {
  const lines = [
    `🏠 *${opts.orgName}* — novo lead!`,
    `👤 ${opts.leadName}`,
    `📱 ${opts.leadPhone}`,
    opts.interest ? `🔎 ${opts.interest}` : null,
    opts.agentName ? `➡️ Distribuído para: ${opts.agentName}` : null,
  ].filter(Boolean);
  const body = lines.join("\n");

  console.log("[notifyNewLead]", body.replace(/\n/g, " | "));

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const to = opts.agentPhone?.replace(/\D/g, "");
  if (!token || !phoneId || !to) return;

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to.startsWith("55") ? to : `55${to}`,
        type: "text",
        text: { body },
      }),
    });
    if (!res.ok) console.error("whatsapp notify falhou:", res.status, await res.text());
  } catch (e) {
    console.error("whatsapp notify erro:", e);
  }
}
