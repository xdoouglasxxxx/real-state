/** Score inicial de um lead por perfil de entrada.
 *  Teto 70: nascer 🔥 exige interação real posterior.
 *  Não altera o mecanismo de evolução — apenas o ponto de partida.
 */
export function calcInitialScore(opts: {
  propertyId?: string | null;
  source: string;
  email?: string | null;
  message?: string;
}): number {
  let s = 10; // base
  if (opts.propertyId) s += 25; // interesse em imóvel específico
  const sourceBonus: Record<string, number> = {
    INDICACAO: 20,
    WHATSAPP: 15,
    TELEFONE: 15,
    SITE: 10,
    PORTAL: 5,
  };
  s += sourceBonus[opts.source] ?? 0;
  if (opts.email?.trim()) s += 10;
  if ((opts.message ?? "").trim().length >= 20) s += 10;
  return Math.min(70, s);
}
