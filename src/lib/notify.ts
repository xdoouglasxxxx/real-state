/**
 * Notificações de lead novo.
 * HOJE: registra no log (visível em Vercel -> Logs).
 * PRÓXIMO PASSO (WhatsApp Cloud API da Meta): preencher as envs
 *   WHATSAPP_TOKEN e WHATSAPP_PHONE_ID e descomentar o fetch abaixo.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
export async function notifyNewLead(opts: {
  orgName: string;
  leadName: string;
  leadPhone: string;
  interest?: string | null;
  agentPhone?: string | null;
}) {
  const msg = `🏠 ${opts.orgName}: novo lead!\n${opts.leadName} · ${opts.leadPhone}\n${opts.interest ?? ""}`;
  console.log("[notifyNewLead]", msg);

  // const token = process.env.WHATSAPP_TOKEN;
  // const phoneId = process.env.WHATSAPP_PHONE_ID;
  // if (token && phoneId && opts.agentPhone) {
  //   await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  //     body: JSON.stringify({
  //       messaging_product: "whatsapp",
  //       to: opts.agentPhone.replace(/\D/g, ""),
  //       type: "text",
  //       text: { body: msg },
  //     }),
  //   }).catch((e) => console.error("whatsapp notify:", e));
  // }
}
