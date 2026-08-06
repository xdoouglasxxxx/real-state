import type { Metadata, Viewport } from "next";
import { getTenant } from "@/lib/tenant";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // safe areas do iPhone (notch / Dynamic Island)
  themeColor: "#17130e",
};

export async function generateMetadata(): Promise<Metadata> {
  const org = await getTenant();
  return {
    title: { default: `${org.name} · Imóveis de alto padrão`, template: `%s · ${org.name}` },
    description: `Compra, venda e avaliação de imóveis de alto padrão. ${org.creci ?? ""}`,
    openGraph: { siteName: org.name, type: "website", locale: "pt_BR" },
    robots: { index: true, follow: true },
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: org.name },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();
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
