import { NextRequest, NextResponse } from "next/server";

/**
 * Multi-tenant: repassa o host para os Server Components.
 * A autenticação do /painel é feita por sessão (cookie assinado)
 * no layout do painel — veja src/app/painel/layout.tsx e src/lib/auth.ts.
 */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-tenant-host", req.headers.get("host") ?? "");
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|icon|apple-icon|manifest).*)"],
};
