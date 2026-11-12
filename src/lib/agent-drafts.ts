/**
 * Rascunhos de mensagem do "Agente do dia" (regras, sem IA externa) e link do WhatsApp.
 *
 * Privacidade: o rascunho usa SÓ o primeiro nome do cliente e o título do imóvel — nunca sobrenome,
 * telefone, e-mail ou endereço. O telefone vai apenas dentro do link `wa.me`. Nada é enviado pelo
 * sistema: o corretor abre a conversa já preenchida e envia (ou não) por conta própria.
 * Funções puras, testadas em tests/unit/agent-drafts.test.ts.
 */
const TZ = "America/Sao_Paulo";

/** Primeiro nome com maiúscula só na inicial ("MARIANA COSTA" → "Mariana"); vazio se não houver nome. */
export function firstName(full?: string | null): string {
  const tok = String(full ?? "").trim().split(/\s+/)[0] ?? "";
  if (!tok) return "";
  const allSame = tok === tok.toLowerCase() || tok === tok.toUpperCase();
  return allSame ? tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase() : tok;
}

/** Telefone BR → só dígitos com 55 na frente; null se não parecer um telefone válido. */
export function normalizeBrPhone(raw?: string | null): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return "55" + digits;
  return null;
}

/** Link do WhatsApp com a mensagem preenchida; null se o telefone não é válido. */
export function waLink(phone: string | null | undefined, text: string): string | null {
  const n = normalizeBrPhone(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

/** "10h" ou "10h30", no horário de Brasília, qualquer que seja o fuso da máquina. */
export function fmtHour(d: Date): string {
  const parts = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

/** "sexta-feira, 13/11" no horário de Brasília. */
export function fmtDayLong(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit" }).format(d);
}

const hello = (name?: string | null) => { const n = firstName(name); return n ? `Olá, ${n}!` : "Olá!"; };

export function draftColdLead(p: { name?: string | null; property?: string | null; org: string }): string {
  return p.property
    ? `${hello(p.name)} Aqui é da ${p.org}. Vi que você se interessou pelo ${p.property}. Posso te ajudar com mais informações ou combinar uma visita?`
    : `${hello(p.name)} Aqui é da ${p.org}. Recebi o seu contato e queria entender o que você procura. Posso te ajudar?`;
}

export function draftContract(p: { name?: string | null; property?: string | null; org: string }): string {
  return `${hello(p.name)} Tudo bem? Aqui é da ${p.org}. Passando para saber se posso ajudar a concluir a assinatura do contrato${p.property ? ` do ${p.property}` : ""}. Podemos combinar um horário esta semana?`;
}

export function draftVisit(p: { name?: string | null; property?: string | null; when: Date; org: string }): string {
  return `${hello(p.name)} Lembrando da nossa visita${p.property ? ` ao ${p.property}` : ""} amanhã (${fmtDayLong(p.when)}), às ${fmtHour(p.when)}. Qualquer imprevisto é só me avisar. — ${p.org}`;
}

