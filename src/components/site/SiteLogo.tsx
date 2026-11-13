import { safeLogoUrl } from "@/lib/site";

/**
 * Logo do tenant. Com logo configurado (só https) mostra a imagem; sem ele, um monograma com a
 * inicial do nome + o nome em serifa. Nunca um símbolo fixo igual para todas as imobiliárias.
 */
export default function SiteLogo({ orgName, logoUrl }: { orgName: string; logoUrl?: string | null }) {
  const src = safeLogoUrl(logoUrl);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="s-logo-img" src={src} alt={orgName} height={36} />;
  }
  return (
    <>
      <span className="s-mono" aria-hidden="true">{orgName.trim().charAt(0).toUpperCase() || "·"}</span>
      <span className="s-logo-name">{orgName}</span>
    </>
  );
}
