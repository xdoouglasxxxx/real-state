"use client"

import { usePathname } from "next/navigation";

export default function ClienteNav() {
  const pathname = usePathname();
  
  const links = [
    { href: "/cliente", label: "Início" },
    { href: "/cliente/portal/favoritos", label: "Favoritos" },
    { href: "/cliente/portal/propostas", label: "Propostas" },
    { href: "/cliente/portal/visitas", label: "Visitas" },
    { href: "/cliente/portal/contratos", label: "Contratos" },
    { href: "/cliente/portal/configuracoes", label: "Configurações" },
  ];
  
  return (
    <>
      {links.map((link) => (
        <a 
          key={link.href}
          href={link.href} 
          className={`panel-link ${pathname === link.href ? "text-brass" : ""}`}
          style={{ padding: 0, fontWeight: pathname === link.href ? 600 : "normal" }}
        >
          {link.label}
        </a>
      ))}
    </>
  );
}