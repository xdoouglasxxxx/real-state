import "./site-theme.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { getTenant } from "@/lib/tenant";
import { readableAccent } from "@/lib/contrast";
import { safeJsonLd, safeLogoUrl } from "@/lib/site";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();
  const logo = safeLogoUrl(org.logoUrl);

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: org.name,
    ...(logo ? { logo } : {}),
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(org.creci ? { identifier: `CRECI ${org.creci}` } : {}),
  };

  // A cor da marca do tenant vira só o DESTAQUE (botões, itálicos, pins); o resto é grafite fixo.
  // readableAccent garante contraste AA no escuro para qualquer cor cadastrada.
  return (
    <div className="site" style={{ "--brass": readableAccent(org.themeBrass) } as React.CSSProperties}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgLd) }} />
      <Header orgName={org.name} logoUrl={logo} phone={org.phone} />
      {children}
      <Footer orgName={org.name} logoUrl={logo} creci={org.creci} phone={org.phone} />
    </div>
  );
}
