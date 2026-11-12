/**
 * Notificações ao corretor via WhatsApp Cloud API (Meta).
 * Sem as envs configuradas, registra no log (Vercel -> Logs) e segue o baile.
 * Setup completo: veja WHATSAPP.md na raiz do projeto.
 * Envs: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID
 *
 * LGPD: nunca logar nome/telefone/valores — só a organização e se o canal está configurado.
 */

/** Envia texto simples pelo WhatsApp. Nunca lança: notificação não pode quebrar o fluxo. */
async function sendWhatsApp(toRaw: string | null | undefined, body: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const to = toRaw?.replace(/\D/g, "");
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

const channelOn = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);

export async function notifyNewLead(opts: {
  orgName: string;
  leadName: string;
  leadPhone: string;
  interest?: string | null;
  agentName?: string | null;
  agentPhone?: string | null;
}) {
  const body = [
    `🏠 *${opts.orgName}* — novo lead!`,
    `👤 ${opts.leadName}`,
    `📱 ${opts.leadPhone}`,
    opts.interest ? `🔎 ${opts.interest}` : null,
    opts.agentName ? `➡️ Distribuído para: ${opts.agentName}` : null,
  ].filter(Boolean).join("\n");

  // M3: não logar nome/telefone do lead — dados pessoais (LGPD).
  console.log("[notifyNewLead] org:", opts.orgName, "| whatsapp configurado:", channelOn());
  await sendWhatsApp(opts.agentPhone, body);
}

/** Cliente enviou uma proposta pelo Portal do Cliente — avisa o corretor da negociação. */
export async function notifyNewProposal(opts: {
  orgName: string;
  clientName: string;
  propertyTitle: string;
  amount: string; // já formatado (ex.: "R$ 1.250.000")
  agentPhone?: string | null;
}) {
  const body = [
    `💼 *${opts.orgName}* — nova proposta pelo portal!`,
    `👤 ${opts.clientName}`,
    `🏠 ${opts.propertyTitle}`,
    `💰 ${opts.amount}`,
    `Abra o painel → Leads para responder.`,
  ].join("\n");

  console.log("[notifyNewProposal] org:", opts.orgName, "| whatsapp configurado:", channelOn());
  await sendWhatsApp(opts.agentPhone, body);
}
