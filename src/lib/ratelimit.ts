import { headers } from "next/headers";
import { prisma } from "./prisma";

/** IP do cliente (a Vercel injeta x-forwarded-for / x-real-ip). */
export function getClientIp(): string {
  const h = headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return ip.slice(0, 64);
}

/**
 * Rate limit por janela fixa, armazenado no Postgres (tabela "RateLimit",
 * criada em database/27). Retorna TRUE se a ação pode prosseguir.
 *
 * FAIL-OPEN de propósito: se o banco ou a tabela falharem (ex.: o SQL 27 ainda
 * não rodou), libera a ação e registra o erro — o limitador nunca derruba
 * login nem formulário. A tabela é acessada só por SQL cru e NÃO está no
 * schema.prisma, então publicar este código antes do SQL é seguro.
 */
export async function allow(key: string, limit: number, windowSec: number): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true;
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + make_interval(secs => ${windowSec}::int))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" < now()
                         THEN now() + make_interval(secs => ${windowSec}::int)
                         ELSE "RateLimit"."resetAt" END
      RETURNING "count"`;

    // Faxina oportunística (~1% das chamadas): remove janelas vencidas há mais de 1 dia.
    if (Math.random() < 0.01) {
      prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "resetAt" < now() - interval '1 day'`.catch(() => {});
    }
    return Number(rows[0]?.count ?? 1) <= limit;
  } catch (e) {
    console.error("rateLimit (fail-open):", e);
    return true;
  }
}
