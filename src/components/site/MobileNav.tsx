"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/vender", label: "Vender" },
  { href: "/sobre", label: "Sobre" },
  { href: "/blog", label: "Blog" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // trava o scroll do body com o menu aberto
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        className="burger"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span /><span /><span />
      </button>

      <div className={"mnav" + (open ? " open" : "")} aria-hidden={!open}>
        {LINKS.map((l, i) => (
          <Link key={l.href} href={l.href} style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
            onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
        <Link className="btn-solid mnav-cta" href="/imoveis" onClick={() => setOpen(false)}
          style={{ transitionDelay: open ? "380ms" : "0ms" }}>
          Ver imóveis
        </Link>
      </div>
    </>
  );
}
