/** Item do menu está ativo? "/painel" só na própria home; os demais incluem as subpáginas ("/painel/leads/novo"). */
export function isNavActive(href: string, path: string): boolean {
  if (href === "/painel") return path === "/painel";
  return path === href || path.startsWith(href + "/");
}
