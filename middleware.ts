import { NextRequest, NextResponse } from "next/server";

/**
 * 1) Multi-tenant: repassa o host para os Server Components.
 * 2) /painel protegido por Basic Auth (defina PAINEL_USER e PAINEL_PASS
 *    no .env / Vercel). Sem as variáveis, o painel fica aberto (apenas dev!).
 *    Em produção real, troque por Better Auth (fase 2).
 */
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/painel")) {
    const user = process.env.PAINEL_USER;
    const pass = process.env.PAINEL_PASS;
    if (user && pass) {
      const auth = req.headers.get("authorization");
      const expected = "Basic " + btoa(`${user}:${pass}`);
      if (auth !== expected) {
        return new NextResponse("Autenticação necessária", {
          status: 401,
          headers: { "WWW-Authenticate": 'Basic realm="Painel Maison"' },
        });
      }
    }
  }
  const res = NextResponse.next();
  res.headers.set("x-tenant-host", req.headers.get("host") ?? "");
  return res;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)"],
};
