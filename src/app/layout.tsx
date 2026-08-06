import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const org = await getTenant();
  return {
    title: { default: `${org.name} · Imóveis de alto padrão`, template: `%s · ${org.name}` },
    description: `Compra, venda e avaliação de imóveis de alto padrão. ${org.creci ?? ""}`,
    openGraph: { siteName: org.name, type: "website", locale: "pt_BR" },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();
  // Identidade visual do tenant vira CSS variables — todo o design responde
  const themeVars = {
    "--ink": org.themeInk,
    "--brass": org.themeBrass,
    "--cream": org.themeCream,
  } as React.CSSProperties;

  return (
    <html lang="pt-BR">
      <body style={themeVars}>{children}</body>
    </html>
  );
}
