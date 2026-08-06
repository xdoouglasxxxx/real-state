import Link from "next/link";

export default function Footer({ orgName, creci, phone }: { orgName: string; creci?: string | null; phone?: string | null }) {
  const [first, ...rest] = orgName.toUpperCase().split(" ");
  return (
    <footer className="footer">
      <div className="footer-top">
        <Link className="logo" href="/">{first} <em>{rest.join(" ") || "ESTATE"}</em></Link>
        <div className="footer-links">
          <Link href="/imoveis">Imóveis</Link>
          <Link href="/vender">Vender</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <Link href="/acessibilidade">Acessibilidade</Link>
          <Link href="/login">Entrar</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {orgName} · {creci ?? ""}</span>
        <span>{phone ?? ""}</span>
      </div>
      <div className="footer-saas">
        <Link href="/criar">Para imobiliárias — crie o seu site como este →</Link>
      </div>
    </footer>
  );
}
