/**
 * DAILY HEALTH CHECK 2.0 — Enterprise Synthetic Monitoring (Fase A: read-only)
 * ============================================================================
 * Registry de checks com id/categoria/severidade · score ponderado · duração
 * por check · veredito HEALTHY/DEGRADED/CRITICAL · Job Summary no GitHub ·
 * histórico JSON. 100% SOMENTE-LEITURA (nenhuma escrita no banco).
 *
 * Uso:
 *   node scripts/smoke-check.mjs --base https://... --host tenant.dominio --tenant slug
 *   [--category SEC]   roda só uma categoria
 *   [--json out.json]  grava o resultado estruturado
 *
 * SEVERIDADE (pesos do score):  P0=40 catastrófico · P1=10 · P2=3 · P3=1
 * SCORE = 100 × (1 − Σpeso(FAIL) / Σpeso(executados)); qualquer P0 FAIL trava ≤ 25.
 * VEREDITO: CRITICAL = FAIL em P0/P1 · DEGRADED = FAIL em P2/P3 · HEALTHY = zero FAIL.
 * WARN = passou porém lento (> SLOW_MS) — não desconta score, aparece no relatório.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";

/* ---------------- config ---------------- */
const SLOW_MS = 1500; // acima disso, PASS vira WARN (performance)
const WEIGHT = { P0: 40, P1: 10, P2: 3, P3: 1 };
const CAT_LABEL = {
  INFRA: "Infraestrutura", MIG: "Migrações do banco", SITE: "Site público",
  LGPD: "Compliance LGPD", LOC: "Locação", GEN: "Contratos", SIM: "Simulador",
  CRM: "CRM / Leads", COMP: "Compliance operacional", SEC: "Segurança",
  INT: "Integridade dos dados",
};
const catName = (c) => CAT_LABEL[c] ?? c;

/* ---------------- .env manual ---------------- */
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

/* ---------------- args ---------------- */
const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const BASE = (arg("base", "") || "").replace(/\/$/, "");
const TENANT = arg("tenant", "");
const HOST = arg("host", "");
const ONLY_CAT = (arg("category", "") || "").toUpperCase();
const JSON_OUT = arg("json", "");
if (!BASE || !TENANT) {
  console.error("Uso: node scripts/smoke-check.mjs --base https://... --tenant slug [--host h] [--category SEC] [--json f]");
  process.exit(2);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

/* ---------------- http helpers ---------------- */
const get = async (path) => {
  try {
    const headers = { "user-agent": "healthcheck" };
    if (HOST) headers.host = HOST;
    const res = await fetch(BASE + path, { redirect: "manual", headers });
    const body = res.status === 200 ? await res.text() : "";
    return { status: res.status, body, location: res.headers.get("location") ?? "" };
  } catch (e) { return { status: 0, body: "", location: "", err: String(e.cause?.code ?? e.message) }; }
};
const post = async (path, body = "") => {
  try {
    const headers = { "user-agent": "healthcheck", "content-type": "application/json" };
    if (HOST) headers.host = HOST;
    const res = await fetch(BASE + path, { method: "POST", body, redirect: "manual", headers });
    return { status: res.status };
  } catch (e) { return { status: 0, err: String(e.cause?.code ?? e.message) }; }
};

/* ---------------- runner ---------------- */
const REGISTRY = [];
/** define(id, category, severity, name, fn) — fn recebe ctx e retorna
 *  { st: "PASS"|"FAIL"|"SKIP"|"INFO", detail? } */
const define = (id, category, severity, name, fn) => REGISTRY.push({ id, category, severity, name, fn });

const ctx = { org: null, state: {} };
const pass = (detail = "") => ({ st: "PASS", detail });
const fail = (detail = "") => ({ st: "FAIL", detail });
const skip = (detail = "") => ({ st: "SKIP", detail });
const inf = (detail = "") => ({ st: "INFO", detail });
const needOrg = () => (ctx.org ? null : skip("dependência: tenant não resolvido (TENANT-001)"));

/* ============================================================
 * INFRA — repositório e fundação
 * ============================================================ */
define("INFRA-001", "INFRA", "P2", "Raiz do repo sem fantasmas (schema/sql/código solto)", async () => {
  const ghosts = [];
  if (existsSync("schema.prisma")) ghosts.push("schema.prisma");
  for (const f of ["actions.ts", "contract-render.ts", "PrintButton.tsx", "page.tsx"]) if (existsSync(f)) ghosts.push(f);
  const { readdirSync } = await import("node:fs");
  for (const f of readdirSync(".")) if (/^\d+_.*\.sql$/.test(f)) ghosts.push(f);
  return ghosts.length === 0 ? pass() : fail(ghosts.join(", ") + " — Prisma prioriza schema.prisma da raiz!");
});

define("TENANT-001", "INFRA", "P1", "Tenant resolvido no banco", async () => {
  ctx.org = await prisma.organization.findFirst({ where: { slug: TENANT }, select: { id: true, name: true } });
  return ctx.org ? pass(ctx.org.name) : fail(`slug '${TENANT}' não encontrado`);
});

/* ============================================================
 * MIG — migrações aplicadas (15 → 22)
 * ============================================================ */
define("MIG-020", "MIG", "P1", "Migração 20: 7 colunas de compliance", async () => {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE (table_name='Lead' AND column_name IN ('lgpdConsentAt','lgpdIp'))
       OR (table_name='Agent' AND column_name IN ('creciUf','creciValidUntil'))
       OR (table_name='Contract' AND column_name IN ('paymentMethod','cashAmount','coafReportedAt'))`);
  return cols.length === 7 ? pass("Lead/Agent/Contract") : fail(`${cols.length}/7 colunas`);
});
define("MIG-018", "MIG", "P1", "Migrações 18/19: enums RENTED + categorias de locação", async () => {
  const enums = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
    WHERE (t.typname='PropStatus' AND e.enumlabel='RENTED')
       OR (t.typname='FinCategory' AND e.enumlabel IN ('MULTA_RESCISORIA','ALUGUEL_RECEBIDO','REPASSE_LOCACAO'))`);
  return enums.length >= 4 ? pass() : fail(`${enums.length}/4 valores`);
});
define("MIG-019", "MIG", "P1", "Migração 19: FK RentPayment→FinanceEntry", async () => {
  const fk = await prisma.$queryRawUnsafe(`SELECT 1 FROM pg_constraint WHERE conname='RentPayment_financeEntryId_fkey'`);
  return fk.length ? pass() : fail("constraint ausente");
});
define("MIG-021", "MIG", "P1", "Migração 21: tabela ContractTemplate", async () => {
  const t = await prisma.$queryRawUnsafe(`SELECT 1 FROM information_schema.tables WHERE table_name='ContractTemplate'`);
  return t.length ? pass() : fail("tabela ausente");
});
define("MIG-022", "MIG", "P1", "Migração 22: Organization.financingRates", async () => {
  const c = await prisma.$queryRawUnsafe(`SELECT 1 FROM information_schema.columns WHERE table_name='Organization' AND column_name='financingRates'`);
  return c.length ? pass() : fail("coluna ausente");
});
define("MIG-015", "MIG", "P1", "Migrações 15/17: Document.org/uploadedBy + Commission.paidAmount", async () => {
  const legacy = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE (table_name='Document' AND column_name IN ('organizationId','uploadedBy'))
       OR (table_name='Commission' AND column_name='paidAmount')`);
  return legacy.length === 3 ? pass() : fail(`${legacy.length}/3 colunas`);
});
define("MIG-016", "MIG", "P2", "Migração 16: DocKind estendido (ONUS...)", async () => {
  const dk = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='DocKind' AND e.enumlabel='ONUS'`);
  return dk.length ? pass() : fail("ONUS ausente");
});

/* ============================================================
 * SITE — site público
 * ============================================================ */
for (const [path, label] of [["/", "Home"], ["/imoveis", "Vitrine /imoveis"], ["/sobre", "/sobre"],
  ["/blog", "Blog"], ["/criar", "/criar (signup)"], ["/login", "/login"]]) {
  define(`SITE-${String(REGISTRY.length).padStart(3, "0")}`, "SITE", "P1", `${label} responde 200`, async () => {
    const r = await get(path);
    return r.status === 200 ? pass() : fail(r.status === 0 ? `REDE: ${r.err}` : `HTTP ${r.status}`);
  });
}
define("SITE-007", "SITE", "P2", "Sitemap com imóveis", async () => {
  const sm = await get("/sitemap.xml");
  return sm.status === 200 && sm.body.includes("/imovel/") ? pass() : fail(`HTTP ${sm.status}`);
});
define("SITE-008", "SITE", "P3", "robots.txt", async () => {
  const rb = await get("/robots.txt");
  return rb.status === 200 ? pass() : fail(`HTTP ${rb.status}`);
});
define("SITE-009", "SITE", "P3", "Home exibe a marca do tenant", async () => {
  const dep = needOrg(); if (dep) return dep;
  const home = await get("/");
  const parts = ctx.org.name.split(/\s+/).filter((w) => w.length > 2);
  return parts.every((w) => new RegExp(w, "i").test(home.body))
    ? pass(ctx.org.name) : inf(`'${ctx.org.name}' não localizado no HTML — conferir visualmente`);
});
define("SITE-010", "SITE", "P1", "Vitrine: imóvel VENDIDO oculto", async () => {
  const dep = needOrg(); if (dep) return dep;
  const sold = await prisma.property.findFirst({ where: { organizationId: ctx.org.id, status: "SOLD" }, select: { title: true } });
  if (!sold) return skip("nenhum SOLD no tenant");
  const listing = await get("/imoveis");
  return listing.status === 200 && !listing.body.includes(sold.title) ? pass(sold.title) : fail(`'${sold.title}' visível!`);
});
define("SITE-011", "SEC", "P1", "Tour virtual: iframe com sandbox + host confiável (H3)", async () => {
  const dep = needOrg(); if (dep) return dep;
  const col = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='Property' AND column_name IN ('tourUrl','tour','virtualTourUrl','videoUrl') LIMIT 1`);
  if (!col.length) return skip("campo de tour não encontrado no Property");
  const rows = await prisma.$queryRawUnsafe(`
    SELECT "slug","title" FROM "Property" WHERE "organizationId"='${ctx.org.id}'
      AND "${col[0].column_name}" IS NOT NULL AND "status"::text IN ('FOR_SALE','EXCLUSIVE','RESERVED') LIMIT 1`);
  if (!rows.length) return skip("nenhum imóvel com tour visível");
  const pg = await get(`/imovel/${rows[0].slug}`);
  if (pg.status !== 200) return fail(`HTTP ${pg.status}`);
  if (!pg.body.includes("<iframe")) return inf("iframe não renderizado (host fora da lista? verificar)");
  const sandboxed = /<iframe[^>]+sandbox/i.test(pg.body);
  const goodHost = /(matterport|youtube|youtu\.be|vimeo|kuula)/i.test(pg.body);
  return sandboxed && goodHost ? pass(rows[0].title) : fail(`sandbox:${sandboxed} host:${goodHost}`);
});

/* ============================================================
 * LGPD — compliance de captação
 * ============================================================ */
define("LGPD-001", "LGPD", "P1", "Checkbox de consentimento no form de visita", async () => {
  const dep = needOrg(); if (dep) return dep;
  const p = await prisma.property.findFirst({
    where: { organizationId: ctx.org.id, status: { in: ["FOR_SALE", "EXCLUSIVE"] } }, select: { slug: true },
  });
  if (!p) return skip("nenhum imóvel FOR_SALE/EXCLUSIVE no tenant");
  ctx.state.slugProp = p.slug;
  const page = await get(`/imovel/${p.slug}`);
  if (page.status !== 200) return fail(page.status === 0 ? `REDE: ${page.err}` : `HTTP ${page.status}`);
  return page.body.includes("Concordo") && page.body.includes("/privacidade")
    ? pass() : fail("texto de consentimento + link /privacidade ausentes");
});
define("LGPD-002", "LGPD", "P1", "Checkbox de consentimento no form 'quero vender'", async () => {
  const page = await get("/vender");
  if (page.status !== 200) return fail(`HTTP ${page.status}`);
  return page.body.includes("Concordo") && page.body.includes("/privacidade") ? pass() : fail("não encontrado");
});
define("LGPD-003", "LGPD", "P2", "Termos: cláusula 'regra de ouro' (plataforma ≠ corretagem)", async () => {
  const page = await get("/termos");
  if (page.status !== 200) return fail(`HTTP ${page.status}`);
  return /não exerce corretagem|nao exerce corretagem/i.test(page.body) ? pass() : fail("cláusula ausente");
});
define("LGPD-004", "LGPD", "P2", "Privacidade: seção LGPD com consentimento", async () => {
  const page = await get("/privacidade");
  if (page.status !== 200) return fail(`HTTP ${page.status}`);
  return /LGPD|13\.709/.test(page.body) && /consentimento/i.test(page.body) ? pass() : fail("seção ausente");
});
define("LGPD-005", "LGPD", "P1", "Consentimento sendo gravado (lgpdConsentAt)", async () => {
  const dep = needOrg(); if (dep) return dep;
  const consented = await prisma.lead.count({ where: { organizationId: ctx.org.id, lgpdConsentAt: { not: null } } });
  return consented > 0 ? pass(`${consented} lead(s)`) : skip("0 registros — envie 1 lead pelo site e rode de novo");
});

/* ============================================================
 * LOC / GEN / SIM — locação, gerador, simulador
 * ============================================================ */
define("LOC-001", "LOC", "P1", "Vitrine: imóvel ALUGADO (RENTED) oculto", async () => {
  const dep = needOrg(); if (dep) return dep;
  const rented = await prisma.property.findFirst({ where: { organizationId: ctx.org.id, status: "RENTED" }, select: { title: true } });
  if (!rented) return skip("nenhum RENTED — crie um contrato de locação para testar");
  const home = await get("/");
  const listing = await get("/imoveis");
  const visible = [home, listing].some((r) => r.status === 200 && r.body.includes(rented.title));
  return visible ? fail(`'${rented.title}' na vitrine!`) : pass(rented.title);
});
define("GEN-001", "GEN", "P2", "Modelos de contrato do tenant", async () => {
  const dep = needOrg(); if (dep) return dep;
  const tpls = await prisma.contractTemplate.count({ where: { organizationId: ctx.org.id } });
  return tpls >= 2 ? pass(`${tpls} modelos`) : skip("0 — abra /painel/modelos (nascem no 1º acesso)");
});
define("GEN-002", "SIM", "P3", "Taxas de financiamento por banco", async () => {
  const dep = needOrg(); if (dep) return dep;
  const rates = await prisma.organization.findFirst({ where: { id: ctx.org.id }, select: { financingRates: true } });
  const n = Array.isArray(rates?.financingRates) ? rates.financingRates.length : 0;
  return n > 0 ? pass(`${n} banco(s)`) : skip("0 — cadastre em Configurações → Taxas");
});
define("GEN-003", "GEN", "P3", "Documento de locação disponível (manual)", async () => {
  const dep = needOrg(); if (dep) return dep;
  const rental = await prisma.rentalContract.findFirst({ where: { organizationId: ctx.org.id }, select: { id: true } });
  return rental ? inf(`/painel/locacao/${rental.id}/documento → 📄 🖨`) : skip("nenhum contrato de locação");
});
define("SIM-001", "SIM", "P2", "Badge MCMV na vitrine e na página (imóvel ≤ 500k)", async () => {
  const dep = needOrg(); if (dep) return dep;
  const cheap = await prisma.property.findFirst({
    where: { organizationId: ctx.org.id, status: { in: ["FOR_SALE", "EXCLUSIVE"] }, price: { lte: 500000 } },
    select: { title: true, slug: true },
  });
  if (!cheap) return skip("nenhum imóvel ≤ R$ 500k à venda");
  const listing = await get("/imoveis");
  const pg = await get(`/imovel/${cheap.slug}`);
  const inList = listing.status === 200 && /MCMV/i.test(listing.body);
  const inPage = pg.status === 200 && /MCMV/i.test(pg.body);
  return inList && inPage ? pass(cheap.title) : fail(`listagem:${inList} página:${inPage} (${cheap.title})`);
});
define("SCORE-001", "CRM", "P2", "Score inicial por regras (leads pós-4.5)", async () => {
  const dep = needOrg(); if (dep) return dep;
  const col = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='Lead' AND column_name IN ('score','leadScore','temperature') LIMIT 1`);
  if (!col.length) return inf("coluna de score não encontrada");
  const last = await prisma.$queryRawUnsafe(`
    SELECT co."name", l."propertyId", l."${col[0].column_name}" AS score, l."createdAt"
    FROM "Lead" l JOIN "Contact" co ON co."id"=l."contactId"
    WHERE l."organizationId"='${ctx.org.id}' AND l."source"::text='SITE' AND l."lgpdConsentAt" IS NOT NULL
    ORDER BY l."createdAt" DESC LIMIT 5`);
  if (!last.length) return skip("nenhum lead SITE pós-4.5 — envie um e rode de novo");
  const zero = last.filter((l) => l.propertyId && Number(l.score ?? 0) === 0);
  return zero.length === 0
    ? pass(last.map((l) => `${l.name}=${l.score}`).join(", "))
    : fail(`NOVOS com imóvel e score 0: ${zero.map((l) => l.name).join(", ")}`);
});

/* ============================================================
 * COMP — compliance operacional (informativos que viram alerta)
 * ============================================================ */
define("COMP-001", "COMP", "P3", "CRECI vencidos (corretores ativos)", async () => {
  const dep = needOrg(); if (dep) return dep;
  const n = await prisma.agent.count({ where: { organizationId: ctx.org.id, isActive: true, creciValidUntil: { lt: new Date() } } });
  return inf(`${n} — ${n > 0 ? "alerta 🪪 DEVE estar no dashboard" : "sem vencidos"}`);
});
define("COMP-002", "COMP", "P3", "Contratos com espécie >30k sem COAF", async () => {
  const dep = needOrg(); if (dep) return dep;
  const n = await prisma.contract.count({ where: { organizationId: ctx.org.id, cashAmount: { gt: 30000 }, coafReportedAt: null } });
  return inf(`${n} — ${n > 0 ? "alerta 🚨 DEVE estar no dashboard" : "nenhum pendente"}`);
});

/* ============================================================
 * SEC — segurança de acesso
 * ============================================================ */
for (const path of ["/painel", "/painel/financeiro", "/painel/usuarios", "/cliente"]) {
  define(`SEC-${String(REGISTRY.length).padStart(3, "0")}`, "SEC", "P0", `Auth: ${path} exige login`, async () => {
    const r = await get(path);
    if (r.status >= 300 && r.status < 400 && (r.location.includes("login") || r.location === "/")) return pass();
    if (r.status === 200) return fail("ABERTO sem sessão — middleware!");
    return inf(`HTTP ${r.status}`);
  });
}
define("SEC-100", "SEC", "P1", "Stripe webhook rejeita chamada sem assinatura", async () => {
  const wh = await post("/api/stripe/webhook", "{}");
  return wh.status >= 400 && wh.status < 500 ? pass(`HTTP ${wh.status}`)
    : fail(wh.status === 0 ? `REDE: ${wh.err}` : `HTTP ${wh.status} (esperado 4xx)`);
});

/* ============================================================
 * INT — integridade dos dados
 * ============================================================ */
define("INT-001", "INT", "P0", "Zero referências cruzadas entre tenants (6 relações)", async () => {
  const leaks = await prisma.$queryRawUnsafe(`
    SELECT 'Lead→Property' AS rel, count(*)::int AS n FROM "Lead" l JOIN "Property" p ON l."propertyId"=p.id WHERE l."organizationId"<>p."organizationId"
    UNION ALL SELECT 'Document→Property', count(*)::int FROM "Document" d JOIN "Property" p ON d."propertyId"=p.id WHERE d."organizationId" IS NOT NULL AND d."organizationId"<>p."organizationId"
    UNION ALL SELECT 'RentalContract→Property', count(*)::int FROM "RentalContract" r JOIN "Property" p ON r."propertyId"=p.id WHERE r."organizationId"<>p."organizationId"
    UNION ALL SELECT 'Proposal→Property', count(*)::int FROM "Proposal" pr JOIN "Property" p ON pr."propertyId"=p.id WHERE pr."organizationId"<>p."organizationId"
    UNION ALL SELECT 'Commission→Contract', count(*)::int FROM "Commission" c JOIN "Contract" k ON c."contractId"=k.id WHERE c."organizationId"<>k."organizationId"
    UNION ALL SELECT 'FinanceEntry→Property', count(*)::int FROM "FinanceEntry" f JOIN "Property" p ON f."propertyId"=p.id WHERE f."organizationId"<>p."organizationId"`);
  const dirty = leaks.filter((r) => r.n > 0);
  return dirty.length === 0 ? pass("6 relações limpas")
    : fail("VAZAMENTO: " + dirty.map((r) => `${r.rel}:${r.n}`).join(" · "));
});
define("INT-002", "INT", "P1", "Locação: consistência de pagamentos/repasses", async () => {
  const dep = needOrg(); if (dep) return dep;
  const incons = await prisma.$queryRawUnsafe(`
    SELECT 'PAGO sem paidAt' AS k, count(*)::int AS n FROM "RentPayment" WHERE "organizationId"='${ctx.org.id}' AND status='PAGO' AND "paidAt" IS NULL
    UNION ALL SELECT 'repasse sem valor', count(*)::int FROM "RentPayment" WHERE "organizationId"='${ctx.org.id}' AND "repasseAt" IS NOT NULL AND "repasseValue" IS NULL`);
  const dirty = incons.filter((r) => r.n > 0);
  return dirty.length === 0 ? pass() : fail(dirty.map((r) => `${r.k}:${r.n}`).join(" · "));
});
define("INT-003", "INT", "P3", "Retrato dos dados do tenant", async () => {
  const dep = needOrg(); if (dep) return dep;
  const w = { organizationId: ctx.org.id };
  const [props, leads, contacts, agents, contracts, rentals, docs, fin] = await Promise.all([
    prisma.property.count({ where: w }), prisma.lead.count({ where: w }),
    prisma.contact.count({ where: w }), prisma.agent.count({ where: { ...w, isActive: true } }),
    prisma.contract.count({ where: w }), prisma.rentalContract.count({ where: w }),
    prisma.document.count({ where: w }), prisma.financeEntry.count({ where: w }),
  ]);
  return inf(`${props} imóveis · ${leads} leads · ${contacts} contatos · ${agents} corretores · ${contracts} vendas · ${rentals} locações · ${docs} docs · ${fin} lançamentos`);
});

/* ============================================================
 * EXECUÇÃO
 * ============================================================ */
const executionId = `HC-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`;
console.log(`\n🔥 SMOKE CHECK — ${BASE} · tenant: ${TENANT} · ${executionId}\n`);

const results = [];
for (const c of REGISTRY) {
  if (ONLY_CAT && c.category !== ONLY_CAT && !c.id.startsWith(ONLY_CAT)) continue;
  const t0 = Date.now();
  let r;
  try { r = await c.fn(); }
  catch (e) { r = fail(String(e.message).replace(/\n/g, " ").slice(0, 160)); }
  const durationMs = Date.now() - t0;
  let st = r.st;
  if (st === "PASS" && durationMs > SLOW_MS) st = "WARN";
  results.push({ ...c, fn: undefined, st, detail: r.detail ?? "", durationMs });
}
await prisma.$disconnect();

/* ---------------- score & veredito ---------------- */
const executed = results.filter((r) => ["PASS", "FAIL", "WARN"].includes(r.st));
const totalWeight = executed.reduce((s, r) => s + WEIGHT[r.severity], 0) || 1;
const failWeight = executed.filter((r) => r.st === "FAIL").reduce((s, r) => s + WEIGHT[r.severity], 0);
let score = Math.round(1000 * (1 - failWeight / totalWeight)) / 10;
const p0fail = results.some((r) => r.st === "FAIL" && r.severity === "P0");
const p1fail = results.some((r) => r.st === "FAIL" && r.severity === "P1");
if (p0fail) score = Math.min(score, 25);
const anyFail = results.some((r) => r.st === "FAIL");
const verdict = p0fail || p1fail ? "CRITICAL" : anyFail ? "DEGRADED" : "HEALTHY";

/* ---------------- console report ---------------- */
const ICON = { PASS: "🟢", FAIL: "🔴", WARN: "🟡", SKIP: "⚪", INFO: "🔵" };
let lastCat = "";
for (const r of results) {
  if (r.category !== lastCat) { const _cn = catName(r.category); console.log(`├──── ${_cn} ${"─".repeat(Math.max(2, 52 - _cn.length))}┤`); lastCat = r.category; }
  console.log(`${ICON[r.st]} ${r.st.padEnd(4)} │ [${r.severity}] ${r.id} · ${r.name}${r.detail ? ` — ${r.detail}` : ""} (${r.durationMs}ms)`);
}
const count = (st) => results.filter((r) => r.st === st).length;
console.log(`\n═══ HEALTH SCORE: ${score}% · ${verdict} ═══`);
console.log(`${count("PASS")} PASS · ${count("FAIL")} FAIL · ${count("WARN")} WARN · ${count("SKIP")} SKIP · ${count("INFO")} INFO`);
const slow = [...executed].sort((a, b) => b.durationMs - a.durationMs).slice(0, 3);
console.log(`Mais lentos: ${slow.map((r) => `${r.id} ${r.durationMs}ms`).join(" · ")}`);

/* ---------------- GitHub Job Summary ---------------- */
if (process.env.GITHUB_STEP_SUMMARY) {
  const badge = verdict === "HEALTHY" ? "🟢" : verdict === "DEGRADED" ? "🟡" : "🔴";
  const cats = [...new Set(results.map((r) => r.category))];
  let md = `\n## ${badge} Smoke Check · ${TENANT} — **${score}%** · ${verdict}\n\n`;
  md += `Execution \`${executionId}\` · ${count("PASS")} PASS / ${count("FAIL")} FAIL / ${count("WARN")} WARN / ${count("SKIP")} SKIP\n\n`;
  md += `| Categoria | Resultado |\n|---|---|\n`;
  for (const cat of cats) {
    const rs = results.filter((r) => r.category === cat);
    const p = rs.filter((r) => r.st === "PASS" || r.st === "WARN").length;
    const f = rs.filter((r) => r.st === "FAIL").length;
    md += `| ${catName(cat)} | ${f > 0 ? "🔴" : "🟢"} ${p}/${rs.filter((r) => r.st !== "SKIP" && r.st !== "INFO").length} pass${f ? ` · **${f} FAIL**` : ""} |\n`;
  }
  const fails = results.filter((r) => r.st === "FAIL");
  if (fails.length) {
    md += `\n### 🚨 Falhas\n`;
    for (const f of fails) md += `- **[${f.severity}] ${f.id}** ${f.name} — ${f.detail} (${f.durationMs}ms)\n`;
  }
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}

/* ---------------- JSON histórico ---------------- */
if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({
    executionId, tenant: TENANT, base: BASE, timestamp: new Date().toISOString(),
    score, verdict, totals: { pass: count("PASS"), fail: count("FAIL"), warn: count("WARN"), skip: count("SKIP"), info: count("INFO") },
    checks: results.map(({ id, category, severity, name, st, detail, durationMs }) => ({ id, category, severity, name, status: st, detail, durationMs })),
  }, null, 2));
}

process.exit(verdict === "HEALTHY" ? 0 : verdict === "DEGRADED" ? 1 : 2);
