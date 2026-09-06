import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { getTenant } from "@/lib/tenant";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();
  
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: org.name,
    ...(org.phone ? { telephone: org.phone } : {}),
    ...(org.creci ? { identifier: `CRECI ${org.creci}` } : {}),
  };
  
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <Header orgName={org.name} />
      {children}
      <Footer orgName={org.name} creci={org.creci} phone={org.phone} />
    </>
  );
}
