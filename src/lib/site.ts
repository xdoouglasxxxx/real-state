/**
 * Utilidades do site público: privacidade das coordenadas, logo seguro e lista branca de dados do mapa.
 * Funções puras, testadas em tests/unit/site.test.ts.
 */
import { normalizeBrPhone } from "./agent-drafts";

/** Casas decimais das coordenadas públicas: 3 ≈ célula de ~110 m (região, não endereço). */
export const PUBLIC_COORD_DECIMALS = 3;

export function roundCoord(n: number, decimals = PUBLIC_COORD_DECIMALS): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

/** Coordenada ARREDONDADA para exibição pública; null se não for um ponto válido. Nunca devolva a coordenada exata ao site. */
export function publicLatLng(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const a = typeof lat === "string" && lat.trim() !== "" ? Number(lat) : lat;
  const b = typeof lng === "string" && lng.trim() !== "" ? Number(lng) : lng;
  if (typeof a !== "number" || typeof b !== "number" || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  if (a === 0 && b === 0) return null; // "ilha nula": coordenada não preenchida
  return { lat: roundCoord(a), lng: roundCoord(b) };
}

/** Logo do tenant: só https, sem usuário/senha, tamanho razoável. Qualquer outra coisa é ignorada. */
export function safeLogoUrl(url?: string | null): string | null {
  const s = String(url ?? "").trim();
  if (!s || s.length > 500) return null;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || !u.hostname || u.username || u.password) return null;
    return u.toString();
  } catch { return null; }
}

/** Dados de um pin do mapa público: SÓ o necessário (nada de corretor, comissão, proprietário, endereço). */
export type PublicPin = { slug: string; title: string; price: number; lat: number; lng: number; exclusive: boolean };

export function publicPins(rows: any[], limit = 200): PublicPin[] {
  const out: PublicPin[] = [];
  for (const r of rows ?? []) {
    if (out.length >= limit) break;
    if (!r || (r.status !== "FOR_SALE" && r.status !== "EXCLUSIVE") || !r.slug) continue;
    const pt = publicLatLng(r.latitude, r.longitude);
    if (!pt) continue;
    out.push({ slug: String(r.slug), title: String(r.title ?? ""), price: Number(r.price) || 0, lat: pt.lat, lng: pt.lng, exclusive: r.status === "EXCLUSIVE" });
  }
  return out;
}

/** Link do WhatsApp só com telefone válido (o telefone vai dentro do link, não como texto). */
export function whatsappHref(phone: string | null | undefined, text: string): string | null {
  const n = normalizeBrPhone(phone);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * JSON-LD seguro para `<script type="application/ld+json">`. JSON.stringify NÃO protege: um valor com `</script>`
 * (nome da imobiliária, título de imóvel vindo de feed XML) fecharia a tag e injetaria HTML na página.
 * Escapamos `<`, `>`, `&` e os separadores U+2028/2029; o JSON continua válido e idêntico para quem lê.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
