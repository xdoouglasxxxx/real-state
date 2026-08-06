import Link from "next/link";

export default function Header({ orgName }: { orgName: string }) {
  const [first, ...rest] = orgName.toUpperCase().split(" ");
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="logo" href="/">{first} <em>{rest.join(" ") || "ESTATE"}</em></Link>
        <div className="nav-links">
          <Link className="nav-link" href="/imoveis">Imóveis</Link>
          <Link className="nav-link" href="/vender">Vender</Link>
          <Link className="nav-link" href="/sobre">Sobre</Link>
          <Link className="nav-link" href="/blog">Blog</Link>
          <Link className="btn-outline" href="/imoveis">Ver imóveis</Link>
        </div>
      </div>
    </nav>
  );
}
