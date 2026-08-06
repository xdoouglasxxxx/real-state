/* Mapeia nomes de página (padrão Base44) para rotas do react-router. */
const ROUTES: Record<string, string> = {
  Home: "/",
  PropertySearch: "/imoveis",
  PropertyDetail: "/imovel",
  Sell: "/vender",
  About: "/sobre",
  Blog: "/blog",
  BlogDetail: "/blog/post",
  Privacy: "/privacidade",
  Terms: "/termos",
  Accessibility: "/acessibilidade",
};

export function createPageUrl(page: string, params?: Record<string, string>): string {
  const base = ROUTES[page] ?? "/";
  if (!params) return base;
  const qs = new URLSearchParams(params).toString();
  return qs ? `${base}?${qs}` : base;
}
