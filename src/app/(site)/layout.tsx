import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { getTenant } from "@/lib/tenant";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const org = await getTenant();
  return (
    <>
      <Header orgName={org.name} />
      {children}
      <Footer orgName={org.name} creci={org.creci} phone={org.phone} />
    </>
  );
}
