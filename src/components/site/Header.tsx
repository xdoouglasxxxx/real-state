import Link from "next/link";
import MobileNav from "./MobileNav";
import SiteLogo from "./SiteLogo";
import { whatsappHref } from "@/lib/site";

const WA_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.2A8 8 0 1 1 21 12z" /></svg>;

export default function Header({ orgName, logoUrl, phone }: { orgName: string; logoUrl?: string | null; phone?: string | null }) {
  const wa = whatsappHref(phone, `Olá! Vim pelo site da ${orgName}.`);
  return (
    <header className="s-head">
      <div className="wrap s-head-in">
        <Link className="s-logo" href="/" aria-label={`${orgName}: página inicial`}>
          <SiteLogo orgName={orgName} logoUrl={logoUrl} />
        </Link>
        <form className="s-hsearch" action="/imoveis" method="GET" role="search">
          <label className="sr-only" htmlFor="s-hq">Buscar imóveis</label>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input id="s-hq" name="q" maxLength={60} placeholder="Buscar por bairro ou nome do imóvel" autoComplete="off" />
        </form>
        <nav className="s-nav" aria-label="Principal">
          <Link href="/imoveis">Imóveis</Link>
          <Link href="/vender">Vender</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/blog">Blog</Link>
        </nav>
        {wa
          ? <a className="s-wa" href={wa} target="_blank" rel="noopener noreferrer">{WA_ICON}Falar no WhatsApp</a>
          : <Link className="s-cta" href="/imoveis">Ver imóveis</Link>}
        <MobileNav waHref={wa} />
      </div>
    </header>
  );
}
