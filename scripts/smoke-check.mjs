/**
 * SMOKE CHECK — valida em produção as entregas dos Blocos 0-3 + Locação 2B.
 * 100% SOMENTE-LEITURA (nenhuma escrita no banco).
 *
 * Uso (terminal do VS Code, na raiz do repo, após deploy verde):
 *   node scripts/smoke-check.mjs --base https://maison.maisonstate.vercel.app --tenant maison
 *
 * --base   URL pública do tenant a testar (com https://)
 * --tenant slug do tenant no banco (ex.: maison, maison-prime)
 * Requer o .env local com DATABASE_URL (o script lê o arquivo sozinho).
 */
import { readFileSync, existsSync } from "node:fs";

// ---------- .env manual (sem dependências) ----------
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

// ---------- args ----------
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = (arg("base", "") || "").replace(/\/$/, "");
const TENANT = arg("tenant", "");
if (!BASE || !TENANT) {
  console.error("Uso: node scripts/smoke-check.mjs --base https://SEU-TENANT.maisonstate.vercel.app --tenant SEU-TENANT");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

const results = [];
const ok = (name, detail = "") => results.push(["PASS", name, detail]);
const bad = (name, detail = "") => results.push(["FAIL", name, detail]);
const skip = (name, detail = "") => results.push(["SKIP", name, detail]);
const info = (name, detail = "") => results.push(["INFO", name, detail]);

const HOST = arg("host", ""); // opcional: força o Host header (multi-tenant sem cert de sub-subdomínio)
const get = async (path) => {
  try {
    const headers = { "user-agent": "smoke-check" };
    if (HOST) headers.host = HOST;
    const res = await fetch(BASE + path, { redirect: "manual", headers });
    const body = res.status === 200 ? await res.text() : "";
    return { status: res.status, body, location: res.headers.get("location") ?? "" };
  } catch (e) {
    return { status: 0, body: "", location: "", err: String(e.cause?.code ?? e.message) };
  }
};

console.log(`\n🔎 SMOKE CHECK — ${BASE} (tenant: ${TENANT})\n`);

let org = null;
try {
  org = await prisma.organization.findFirst({ where: { slug: TENANT }, select: { id: true, name: true } });
  org ? ok("Tenant encontrado no banco", org.name) : bad("Tenant encontrado no banco", `slug '${TENANT}' não existe`);
} catch (e) { bad("Conexão com o banco", String(e.message).slice(0, 120)); }

/* ================= BANCO: migrações 19/20 ================= */
try {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE (table_name='Lead'     AND column_name IN ('lgpdConsentAt','lgpdIp'))
       OR (table_name='Agent'    AND column_name IN ('creciUf','creciValidUntil'))
       OR (table_name='Contract' AND column_name IN ('paymentMethod','cashAmount','coafReportedAt'))`);
  cols.length === 7 ? ok("Migração 20: 7 colunas de compliance", "Lead/Agent/Contract")
    : bad("Migração 20: 7 colunas de compliance", `encontradas ${cols.length}/7: ${cols.map(c => c.column_name).join(",")}`);
} catch (e) { bad("Migração 20 (query)", String(e.message).slice(0, 120)); }

try {
  const enums = await prisma.$queryRawUnsafe(`
    SELECT t.typname, e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE (t.typname='PropStatus' AND e.enumlabel='RENTED')
       OR (t.typname='FinCategory' AND e.enumlabel IN ('MULTA_RESCISORIA','ALUGUEL_RECEBIDO','REPASSE_LOCACAO'))`);
  enums.length >= 4 ? ok("Migrações 18/19: enums RENTED + categorias de locação")
    : bad("Migrações 18/19: enums", `encontrados ${enums.length}/4`);
} catch (e) { bad("Migração 19 (enums)", String(e.message).slice(0, 120)); }

try {
  const fk = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='RentPayment_financeEntryId_fkey' AND table_name='RentPayment'`);
  fk.length ? ok("Migração 19: FK RentPayment→FinanceEntry") : bad("Migração 19: FK RentPayment→FinanceEntry", "constraint ausente");
} catch (e) { bad("Migração 19 (FK)", String(e.message).slice(0, 120)); }

/* ================= HTTP: páginas públicas ================= */
let slugProp = null;
try {
  if (org) {
    const p = await prisma.property.findFirst({
      where: { organizationId: org.id, status: { in: ["FOR_SALE", "EXCLUSIVE"] } },
      select: { slug: true, title: true },
    });
    slugProp = p;
  }
} catch {}

if (slugProp) {
  const page = await get(`/imovel/${slugProp.slug}`);
  if (page.status !== 200) bad("Página pública do imóvel", page.status === 0 ? `REDE: ${page.err}` : `HTTP ${page.status} em /imovel/${slugProp.slug}`);
  else {
    page.body.includes("Concordo") && page.body.includes("/privacidade")
      ? ok("LGPD: checkbox de consentimento no form de visita")
      : bad("LGPD: checkbox de consentimento no form de visita", "texto 'Concordo' + link /privacidade não encontrados");
    /required[^>]*name="lgpd|name="lgpd[^"]*"[^>]*required/.test(page.body) || page.body.includes("required")
      ? info("LGPD: atributo required presente na página (verificação ampla)")
      : info("LGPD: não foi possível confirmar 'required' no HTML");
  }
} else skip("LGPD no form de visita", "nenhum imóvel FOR_SALE/EXCLUSIVE no tenant");

{
  const page = await get("/vender");
  if (page.status !== 200) bad("Página /vender", page.status === 0 ? `REDE: ${page.err}` : `HTTP ${page.status}`);
  else page.body.includes("Concordo") && page.body.includes("/privacidade")
    ? ok("LGPD: checkbox de consentimento no form 'quero vender'")
    : bad("LGPD: checkbox no form 'quero vender'", "não encontrado");
}

{
  const page = await get("/termos");
  if (page.status !== 200) bad("Página /termos", page.status === 0 ? `REDE: ${page.err}` : `HTTP ${page.status}`);
  else /não exerce corretagem|nao exerce corretagem/i.test(page.body)
    ? ok("Termos: cláusula 'regra de ouro' (plataforma ≠ corretagem)")
    : bad("Termos: cláusula 'regra de ouro'", "texto não encontrado");
}

{
  const page = await get("/privacidade");
  if (page.status !== 200) bad("Página /privacidade", page.status === 0 ? `REDE: ${page.err}` : `HTTP ${page.status}`);
  else /LGPD|13\.709/.test(page.body) && /consentimento/i.test(page.body)
    ? ok("Privacidade: seção LGPD com consentimento")
    : bad("Privacidade: seção LGPD", "menções a LGPD/consentimento não encontradas");
}

/* ============ Locação 2B: RENTED fora da vitrine ============ */
try {
  if (org) {
    const rented = await prisma.property.findFirst({
      where: { organizationId: org.id, status: "RENTED" }, select: { title: true, slug: true },
    });
    if (!rented) skip("Vitrine: imóvel RENTED oculto", "nenhum imóvel RENTED no tenant (crie um contrato para testar)");
    else {
      const home = await get("/");
      const listing = await get("/imoveis");
      const visible = [home, listing].some((r) => r.status === 200 && r.body.includes(rented.title));
      visible ? bad("Vitrine: imóvel RENTED oculto", `'${rented.title}' ainda aparece na vitrine`)
              : ok("Vitrine: imóvel RENTED oculto", rented.title);
    }
  }
} catch (e) { bad("Vitrine RENTED (query)", String(e.message).slice(0, 120)); }

/* ============ Score inicial (Bloco 3) ============ */
try {
  if (org) {
    // Descobre a coluna de score sem depender do client tipado
    const col = await prisma.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='Lead' AND column_name IN ('score','leadScore','temperature') LIMIT 1`);
    if (!col.length) info("Score inicial", "coluna de score não encontrada no Lead — me informe o nome");
    else {
      const c = col[0].column_name;
      const last = await prisma.$queryRawUnsafe(`
        SELECT "name", "propertyId", "${c}" AS score FROM "Lead"
        WHERE "organizationId" = '${org.id}' AND "source"::text = 'SITE'
        ORDER BY "createdAt" DESC LIMIT 5`);
      if (!last.length) skip("Score inicial por regras", "nenhum lead SITE — envie um pelo formulário e rode de novo");
      else {
        const zeroWithProp = last.filter((l) => l.propertyId && Number(l.score ?? 0) === 0);
        zeroWithProp.length === 0
          ? ok("Score inicial por regras", `últimos SITE: ${last.map((l) => `${l.name}=${l.score}`).join(", ")}`)
          : bad("Score inicial por regras", `${zeroWithProp.length} lead(s) com imóvel e score 0`);
      }
    }
  }
} catch (e) { bad("Score (query)", String(e.message).replace(/\n/g, " ").slice(0, 140)); }

/* ============ LGPD gravando (após você enviar 1 lead) ============ */
try {
  if (org) {
    const consented = await prisma.lead.count({ where: { organizationId: org.id, lgpdConsentAt: { not: null } } });
    consented > 0 ? ok("LGPD: consentimento sendo gravado", `${consented} lead(s) com lgpdConsentAt`)
      : skip("LGPD: consentimento sendo gravado", "0 registros — envie 1 lead pelo site e rode de novo");
  }
} catch (e) { bad("LGPD (query)", String(e.message).slice(0, 120)); }

/* ============ CRECI e COAF: dados → alertas ============ */
try {
  if (org) {
    const expired = await prisma.agent.count({
      where: { organizationId: org.id, isActive: true, creciValidUntil: { lt: new Date() } },
    });
    info("CRECI vencidos (ativos)", `${expired} — ${expired > 0 ? "o alerta 🪪 DEVE estar no dashboard" : "cadastre uma validade passada num corretor para testar o alerta"}`);
    const coaf = await prisma.contract.count({
      where: { organizationId: org.id, cashAmount: { gt: 30000 }, coafReportedAt: null },
    });
    info("Contratos espécie >30k sem COAF", `${coaf} — ${coaf > 0 ? "o alerta 🚨 DEVE estar no dashboard" : "registre um pagamento em espécie >30k para testar"}`);
  }
} catch (e) { bad("CRECI/COAF (query)", String(e.message).slice(0, 120)); }

/* ============ Segurança básica: painel exige login ============ */
{
  const painel = await get("/painel");
  painel.status >= 300 && painel.status < 400 && painel.location.includes("login")
    ? ok("Segurança: /painel redireciona para login sem sessão")
    : painel.status === 200
      ? bad("Segurança: /painel SEM redirect de login", "verifique o middleware!")
      : info("Segurança: /painel", `HTTP ${painel.status}`);
}

/* ================= RELATÓRIO ================= */
await prisma.$disconnect();
const pad = (s, n) => String(s).padEnd(n);
console.log("┌──────┬" + "─".repeat(58) + "┐");
for (const [st, name, detail] of results) {
  const icon = st === "PASS" ? "🟢" : st === "FAIL" ? "🔴" : st === "SKIP" ? "⚪" : "🔵";
  console.log(`${icon} ${pad(st, 4)} │ ${name}${detail ? ` — ${detail}` : ""}`);
}
const fails = results.filter((r) => r[0] === "FAIL").length;
const passes = results.filter((r) => r[0] === "PASS").length;
console.log("└──────┴" + "─".repeat(58) + "┘");
console.log(`\n${passes} PASS · ${fails} FAIL · ${results.filter((r) => r[0] === "SKIP").length} SKIP`);
console.log("\n⚠ O que o script NÃO cobre (manual, 3 min): fluxo de rescisão com banner de multa;");
console.log("  botão 'Marcar COAF comunicado' apagando o alerta; pills visuais no painel (exigem login).");
process.exit(fails > 0 ? 1 : 0);
