"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/vender", label: "Vender" },
  { href: "/sobre", label: "Sobre" },
  { href: "/blog", label: "Blog" },
  { href: "/login", label: "Entrar" },
];

/** Menu do celular: botão + tela cheia. Fechado, os links saem da ordem do Tab (visibility); Esc fecha. */
export default function MobileNav({ waHref }: { waHref?: string | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <>
      <button className="s-burger" type="button" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} aria-controls="s-mnav" onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
      <div id="s-mnav" className={"s-mnav" + (open ? " open" : "")}>
        {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
        {waHref
          ? <a className="s-mnav-cta s-wa" href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Falar no WhatsApp</a>
          : <Link className="s-mnav-cta s-cta" href="/imoveis" onClick={() => setOpen(false)}>Ver imóveis</Link>}
      </div>
    </>
  );
}
