/**
 * Contraste de cores (WCAG) para o tema do painel.
 * O painel é grafite; a cor da marca do tenant é o único destaque. Uma marca escura
 * (azul-marinho, vinho, preto) some no grafite, então `readableAccent` clareia a cor
 * só o necessário para ficar legível, preservando o matiz. Funções puras, testadas em
 * tests/unit/contrast.test.ts.
 */
export const DEFAULT_ACCENT = "#c6a15b";
/** Luminância mínima que garante ≥ 4,5:1 sobre o pior fundo do painel (#1d222b) e texto escuro (#0d0f12) por cima. */
export const MIN_ACCENT_LUMINANCE = 0.25;

type RGB = [number, number, number];

export function parseHex(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const toHex = (c: RGB) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

export function relLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a), lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Cor da marca → versão legível sobre o grafite. Entrada inválida volta ao dourado padrão. */
export function readableAccent(hex: string, minLuminance = MIN_ACCENT_LUMINANCE): string {
  const rgb = parseHex(hex);
  if (!rgb) return DEFAULT_ACCENT;
  if (relLuminance(toHex(rgb)) >= minLuminance) return toHex(rgb); // já legível: não mexe
  for (let t = 0.02; t <= 1.0001; t += 0.02) {
    const mixed: RGB = [rgb[0] + (255 - rgb[0]) * t, rgb[1] + (255 - rgb[1]) * t, rgb[2] + (255 - rgb[2]) * t];
    if (relLuminance(toHex(mixed)) >= minLuminance) return toHex(mixed);
  }
  return "#ffffff";
}
