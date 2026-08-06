import Link from "next/link";
import MobileNav from "./MobileNav";

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="none" stroke="currentColor" strokeOpacity=".4" strokeWidth="2.5" />
      <path d="M17 45 V20 L32 37 L47 20 V45" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="50" r="2.6" fill="currentColor" />
    </svg>
  );
}

export default function Header({ orgName }: { orgName: string }) {
  const [first, ...rest] = orgName.toUpperCase().split(" ");
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="logo" href="/">
          <LogoMark />
          <span>{first} <em>{rest.join(" ") || "ESTATE"}</em></span>
        </Link>
        <div className="nav-links">
          <Link className="nav-link" href="/imoveis">Imóveis</Link>
          <Link className="nav-link" href="/vender">Vender</Link>
          <Link className="nav-link" href="/sobre">Sobre</Link>
          <Link className="nav-link" href="/blog">Blog</Link>
          <Link className="nav-link nav-entrar" href="/login">Entrar</Link>
          <Link className="btn-outline" href="/imoveis">Ver imóveis</Link>
        </div>
        <MobileNav />
      </div>
    </nav>
  );
}
