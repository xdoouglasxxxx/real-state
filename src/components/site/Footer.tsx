import Link from "next/link";
import SiteLogo from "./SiteLogo";

export default function Footer({ orgName, logoUrl, creci, phone }: { orgName: string; logoUrl?: string | null; creci?: string | null; phone?: string | null }) {
  const meta = [creci, phone].filter(Boolean).join(" · ");
  return (
    <footer className="s-foot">
      <div className="wrap s-foot-in">
        <div>
          <Link className="s-logo" href="/" aria-label={`${orgName}: página inicial`}><SiteLogo orgName={orgName} logoUrl={logoUrl} /></Link>
          {meta && <p className="s-foot-meta">{meta}</p>}
        </div>
        <nav className="s-foot-nav" aria-label="Rodapé">
          <Link href="/imoveis">Imóveis</Link>
          <Link href="/vender">Vender</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/acessibilidade">Acessibilidade</Link>
          <Link href="/login">Entrar</Link>
        </nav>
      </div>
      <div className="wrap s-foot-bottom">
        <span>© {new Date().getFullYear()} {orgName}</span>
        <Link href="/criar">Para imobiliárias — crie o seu site como este →</Link>
      </div>
    </footer>
  );
}
