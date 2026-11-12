import type { ReactNode } from "react";

/** Ícones desenhados (traço fino, herdam a cor do texto) no lugar dos emojis dos alertas do dashboard. */
const PATHS: Record<string, ReactNode> = {
  "✍": <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 14l2 2 4-4" /></>,
  "🥶": <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  "👤": <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  "🏠": <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  "💸": <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6.5 12h.01M17.5 12h.01" /></>,
  "⚠": <><path d="M12 3l10 18H2z" /><path d="M12 10v5" /><path d="M12 18h.01" /></>,
  "🚨": <><circle cx="12" cy="12" r="9" /><path d="M12 7v6" /><path d="M12 16.5h.01" /></>,
  "🎯": <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  default: <circle cx="12" cy="12" r="3" />,
};

export default function AlertIcon({ emoji }: { emoji: string }) {
  const key = String(emoji ?? "").replace(/\uFE0F/g, "");
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[key] ?? PATHS.default}
    </svg>
  );
}
