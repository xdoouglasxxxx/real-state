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
const sect = (title) => results.push(["SECT", title, ""]);

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

const post = async (path, body = "") => {
  try {
    const headers = { "user-agent": "smoke-check", "content-type": "application/json" };
    if (HOST) headers.host = HOST;
    const res = await fetch(BASE + path, { method: "POST", body, redirect: "manual", headers });
    return { status: res.status };
  } catch (e) { return { status: 0, err: String(e.cause?.code ?? e.message) }; }
};

sect("REPO LOCAL");
/* ================= REPO LOCAL: fantasmas na raiz ================= */
{
  const ghosts = [];
  if (existsSync("schema.prisma")) ghosts.push("schema.prisma");
  for (const f of ["actions.ts", "contract-render.ts", "PrintButton.tsx", "page.tsx"]) {
    if (existsSync(f)) ghosts.push(f);
  }
  try {
    const { readdirSync } = await import("node:fs");
    for (const f of readdirSync(".")) if (/^\d+_.*\.sql$/.test(f)) ghosts.push(f);
  } catch {}
  ghosts.length === 0
    ? ok("Raiz do repo limpa (sem schema/sql/código fantasma)")
    : bad("FANTASMAS NA RAIZ DO REPO", ghosts.join(", ") + " — o Prisma prioriza schema.prisma da raiz!");
}

let org = null;
try {
  org = await prisma.organization.findFirst({ where: { slug: TENANT }, select: { id: true, name: true } });
  org ? ok("Tenant encontrado no banco", org.name) : bad("Tenant encontrado no banco", `slug '${TENANT}' não existe`);
} catch (e) { bad("Conexão com o banco", String(e.message).slice(0, 120)); }

sect("BANCO · MIGRAÇÕES");
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
    SELECT 1 FROM pg_constraint WHERE conname='RentPayment_financeEntryId_fkey'`);
  fk.length ? ok("Migração 19: FK RentPayment→FinanceEntry") : bad("Migração 19: FK RentPayment→FinanceEntry", "constraint ausente");
} catch (e) { bad("Migração 19 (FK)", String(e.message).slice(0, 120)); }

try {
  const t21 = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.tables WHERE table_name='ContractTemplate'`);
  t21.length ? ok("Migração 21: tabela ContractTemplate") : bad("Migração 21: ContractTemplate", "tabela ausente");
} catch (e) { bad("Migração 21 (query)", String(e.message).slice(0, 120)); }

try {
  const c22 = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM information_schema.columns WHERE table_name='Organization' AND column_name='financingRates'`);
  c22.length ? ok("Migração 22: coluna financingRates") : bad("Migração 22: financingRates", "coluna ausente");
} catch (e) { bad("Migração 22 (query)", String(e.message).slice(0, 120)); }

try {
  const legacy = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE (table_name='Document' AND column_name IN ('organizationId','uploadedBy'))
       OR (table_name='Commission' AND column_name='paidAmount')`);
  legacy.length === 3 ? ok("Migrações 15/17: Document.org/uploadedBy + Commission.paidAmount")
    : bad("Migrações 15/17", `encontradas ${legacy.length}/3 colunas`);
  const dk = await prisma.$queryRawUnsafe(`
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid
    WHERE t.typname='DocKind' AND e.enumlabel='ONUS'`);
  dk.length ? ok("Migração 16: DocKind estendido (ONUS...)") : bad("Migração 16: DocKind", "ONUS ausente");
} catch (e) { bad("Migrações 15-17 (query)", String(e.message).slice(0, 120)); }

try {
  if (org) {
    const tpls = await prisma.contractTemplate.count({ where: { organizationId: org.id } });
    tpls >= 2 ? ok("Gerador: modelos do tenant", `${tpls} modelos (venda+locação)`)
      : skip("Gerador: modelos do tenant", "0 — abra /painel/modelos uma vez (eles nascem no 1º acesso)");
    const rates = await prisma.organization.findFirst({ where: { id: org.id }, select: { financingRates: true } });
    const n = Array.isArray(rates?.financingRates) ? rates.financingRates.length : 0;
    n > 0 ? ok("Simulador: taxas por banco cadastradas", `${n} banco(s)`)
      : skip("Simulador: taxas por banco", "0 — cadastre em Configurações → Taxas de financiamento");
    const rental = await prisma.rentalContract.findFirst({
      where: { organizationId: org.id }, select: { id: true },
    });
    rental ? info("Gerador locação: teste manual", `/painel/locacao/${rental.id}/documento → 📄 🖨`)
      : skip("Gerador locação", "nenhum contrato de locação — crie um para gerar o documento");
  }
} catch (e) { bad("Gerador/Simulador (queries)", String(e.message).slice(0, 120)); }

/* ================= HTTP: páginas públicas ================= */
sect("SITE PÚBLICO");
try {
  for (const [path, mustHave, label] of [
    ["/", "", "Home"],
    ["/imoveis", "", "Vitrine /imoveis"],
    ["/sobre", "", "Página /sobre"],
    ["/blog", "", "Blog"],
    ["/criar", "", "Página /criar (signup)"],
    ["/login", "", "Página /login"],
  ]) {
    const r = await get(path);
    if (r.status !== 200) bad(label, r.status === 0 ? `REDE: ${r.err}` : `HTTP ${r.status}`);
    else if (mustHave && !r.body.includes(mustHave)) bad(label, `200 mas sem '${mustHave}'`);
    else ok(label);
  }
  // Home contém o nome do tenant (tolerante: logos quebram o nome em spans/caixa alta)
  if (org?.name) {
    const home = await get("/");
    const parts = org.name.split(/\s+/).filter((w) => w.length > 2);
    const found = parts.every((w) => new RegExp(w, "i").test(home.body));
    found ? ok("Home exibe a marca do tenant", org.name)
      : info("Home: marca do tenant não localizada no HTML", `'${org.name}' — cosmético, conferir visualmente`);
  }
  const sm = await get("/sitemap.xml");
  sm.status === 200 && sm.body.includes("/imovel/") ? ok("Sitemap com imóveis") : bad("Sitemap", `HTTP ${sm.status}`);
  const rb = await get("/robots.txt");
  rb.status === 200 ? ok("robots.txt") : bad("robots.txt", `HTTP ${rb.status}`);
} catch (e) { bad("Site público", String(e.message).slice(0, 120)); }

// Vitrine: SOLD oculto (regra da Onda 2)
try {
  if (org) {
    const sold = await prisma.property.findFirst({
      where: { organizationId: org.id, status: "SOLD" }, select: { title: true },
    });
    if (!sold) skip("Vitrine: imóvel VENDIDO oculto", "nenhum SOLD no tenant");
    else {
      const listing = await get("/imoveis");
      listing.status === 200 && !listing.body.includes(sold.title)
        ? ok("Vitrine: imóvel VENDIDO oculto", sold.title)
        : bad("Vitrine: VENDIDO visível!", sold.title);
    }
  }
} catch (e) { bad("Vitrine SOLD (query)", String(e.message).slice(0, 120)); }

// Tour virtual: iframe só com sandbox + host confiável (fix H3)
try {
  if (org) {
    const col = await prisma.$queryRawUnsafe(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='Property' AND column_name IN ('tourUrl','tour','virtualTourUrl','videoUrl') LIMIT 1`);
    if (!col.length) skip("Tour virtual (H3)", "campo de tour não encontrado no Property");
    else {
      const c = col[0].column_name;
      const rows = await prisma.$queryRawUnsafe(`
        SELECT "slug", "title" FROM "Property"
        WHERE "organizationId"='${org.id}' AND "${c}" IS NOT NULL
          AND "status"::text IN ('FOR_SALE','EXCLUSIVE','RESERVED') LIMIT 1`);
      if (!rows.length) skip("Tour virtual (H3)", "nenhum imóvel com tour visível");
      else {
        const pg2 = await get(`/imovel/${rows[0].slug}`);
        if (pg2.status !== 200) bad("Tour virtual (H3)", `HTTP ${pg2.status}`);
        else if (!pg2.body.includes("<iframe")) info("Tour virtual (H3)", "iframe não renderizado (host fora da lista? verificar)");
        else {
          const sandboxed = /<iframe[^>]+sandbox/i.test(pg2.body);
          const goodHost = /(matterport|youtube|youtu\.be|vimeo|kuula)/i.test(pg2.body);
          sandboxed && goodHost ? ok("Tour virtual com sandbox + host confiável", rows[0].title)
            : bad("Tour virtual (H3)", `sandbox: ${sandboxed} · host confiável: ${goodHost}`);
        }
      }
    }
  }
} catch (e) { bad("Tour H3 (query)", String(e.message).replace(/\n/g, " ").slice(0, 140)); }

sect("FORMULÁRIOS · LGPD");
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

sect("LOCAÇÃO · CONTRATOS · SIMULADOR");
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

/* ============ Badge MCMV na vitrine (Simulador v2) ============ */
try {
  if (org) {
    const cheap = await prisma.property.findFirst({
      where: { organizationId: org.id, status: { in: ["FOR_SALE", "EXCLUSIVE"] }, price: { lte: 500000 } },
      select: { title: true, slug: true },
    });
    if (!cheap) skip("Badge MCMV na vitrine", "nenhum imóvel ≤ R$ 500k à venda no tenant");
    else {
      const listing = await get("/imoveis");
      const pg = await get(`/imovel/${cheap.slug}`);
      const inList = listing.status === 200 && /MCMV/i.test(listing.body);
      const inPage = pg.status === 200 && /MCMV/i.test(pg.body);
      inList && inPage ? ok("Badge MCMV na vitrine e na página", cheap.title)
        : bad("Badge MCMV", `listagem: ${inList ? "ok" : "ausente"} · página: ${inPage ? "ok" : "ausente"} (${cheap.title})`);
    }
  }
} catch (e) { bad("Badge MCMV (query)", String(e.message).slice(0, 120)); }

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
      // Só leads pós-Onda 4.5 (lgpdConsentAt existe = criados depois do deploy do score)
      const last = await prisma.$queryRawUnsafe(`
        SELECT co."name", l."propertyId", l."${c}" AS score, l."createdAt"
        FROM "Lead" l JOIN "Contact" co ON co."id" = l."contactId"
        WHERE l."organizationId" = '${org.id}' AND l."source"::text = 'SITE'
          AND l."lgpdConsentAt" IS NOT NULL
        ORDER BY l."createdAt" DESC LIMIT 5`);
      if (!last.length) skip("Score inicial por regras", "nenhum lead SITE pós-4.5 — envie um pelo formulário e rode de novo");
      else {
        const zeroWithProp = last.filter((l) => l.propertyId && Number(l.score ?? 0) === 0);
        zeroWithProp.length === 0
          ? ok("Score inicial por regras", `últimos: ${last.map((l) => `${l.name}=${l.score}`).join(", ")}`)
          : bad("Score inicial por regras", `lead(s) NOVOS com imóvel e score 0: ${zeroWithProp.map((l) => `${l.name} (${new Date(l.createdAt).toLocaleDateString("pt-BR")})`).join(", ")} — bug real no createLead`);
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

sect("COMPLIANCE · SCORE");
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

sect("SEGURANÇA");
for (const path of ["/painel", "/painel/financeiro", "/painel/usuarios", "/cliente"]) {
  const r = await get(path);
  r.status >= 300 && r.status < 400 && (r.location.includes("login") || r.location === "/")
    ? ok(`Auth: ${path} exige login`)
    : r.status === 200
      ? bad(`Auth: ${path} ABERTO sem sessão!`, "verifique o middleware")
      : info(`Auth: ${path}`, `HTTP ${r.status}`);
}
{
  const wh = await post("/api/stripe/webhook", "{}");
  wh.status >= 400 && wh.status < 500
    ? ok("Stripe webhook rejeita chamada sem assinatura", `HTTP ${wh.status}`)
    : bad("Stripe webhook", wh.status === 0 ? `REDE: ${wh.err}` : `HTTP ${wh.status} (esperado 4xx)`);
}

sect("INTEGRIDADE MULTI-TENANT (banco)");
try {
  const leaks = await prisma.$queryRawUnsafe(`
    SELECT 'Lead→Property' AS rel, count(*)::int AS n FROM "Lead" l JOIN "Property" p ON l."propertyId"=p.id WHERE l."organizationId"<>p."organizationId"
    UNION ALL SELECT 'Document→Property', count(*)::int FROM "Document" d JOIN "Property" p ON d."propertyId"=p.id WHERE d."organizationId" IS NOT NULL AND d."organizationId"<>p."organizationId"
    UNION ALL SELECT 'RentalContract→Property', count(*)::int FROM "RentalContract" r JOIN "Property" p ON r."propertyId"=p.id WHERE r."organizationId"<>p."organizationId"
    UNION ALL SELECT 'Proposal→Property', count(*)::int FROM "Proposal" pr JOIN "Property" p ON pr."propertyId"=p.id WHERE pr."organizationId"<>p."organizationId"
    UNION ALL SELECT 'Commission→Contract', count(*)::int FROM "Commission" c JOIN "Contract" k ON c."contractId"=k.id WHERE c."organizationId"<>k."organizationId"
    UNION ALL SELECT 'FinanceEntry→Property', count(*)::int FROM "FinanceEntry" f JOIN "Property" p ON f."propertyId"=p.id WHERE f."organizationId"<>p."organizationId"`);
  const dirty = leaks.filter((r) => r.n > 0);
  dirty.length === 0
    ? ok("Zero referências cruzadas entre tenants (6 relações auditadas)")
    : bad("VAZAMENTO ENTRE TENANTS", dirty.map((r) => `${r.rel}:${r.n}`).join(" · "));
} catch (e) { bad("Integridade multi-tenant (query)", String(e.message).slice(0, 120)); }

try {
  if (org) {
    const incons = await prisma.$queryRawUnsafe(`
      SELECT 'PAGO sem paidAt' AS k, count(*)::int AS n FROM "RentPayment" WHERE "organizationId"='${org.id}' AND status='PAGO' AND "paidAt" IS NULL
      UNION ALL SELECT 'repasse sem valor', count(*)::int FROM "RentPayment" WHERE "organizationId"='${org.id}' AND "repasseAt" IS NOT NULL AND "repasseValue" IS NULL`);
    const dirty = incons.filter((r) => r.n > 0);
    dirty.length === 0 ? ok("Locação: consistência de pagamentos/repasses")
      : bad("Locação: inconsistências", dirty.map((r) => `${r.k}:${r.n}`).join(" · "));
  }
} catch (e) { bad("Consistência locação (query)", String(e.message).slice(0, 120)); }

sect("RETRATO DOS DADOS");
try {
  if (org) {
    const w = { organizationId: org.id };
    const [props, leads, contacts, agents, users, contracts, rentals, docs, fin] = await Promise.all([
      prisma.property.count({ where: w }), prisma.lead.count({ where: w }),
      prisma.contact.count({ where: w }), prisma.agent.count({ where: { ...w, isActive: true } }),
      prisma.user.count({ where: w }).catch(() => -1), prisma.contract.count({ where: w }),
      prisma.rentalContract.count({ where: w }), prisma.document.count({ where: w }),
      prisma.financeEntry.count({ where: w }),
    ]);
    info("Volumes do tenant", `${props} imóveis · ${leads} leads · ${contacts} contatos · ${agents} corretores ativos · ${users >= 0 ? users + " usuários · " : ""}${contracts} contratos venda · ${rentals} locações · ${docs} docs · ${fin} lançamentos`);
  }
} catch (e) { info("Volumes (query)", String(e.message).slice(0, 100)); }

/* ================= RELATÓRIO ================= */
await prisma.$disconnect();
const pad = (s, n) => String(s).padEnd(n);
console.log("┌──────┬" + "─".repeat(58) + "┐");
for (const [st, name, detail] of results) {
  if (st === "SECT") { console.log(`├──── ${name} ${"─".repeat(Math.max(2, 50 - name.length))}┤`); continue; }
  const icon = st === "PASS" ? "🟢" : st === "FAIL" ? "🔴" : st === "SKIP" ? "⚪" : "🔵";
  console.log(`${icon} ${pad(st, 4)} │ ${name}${detail ? ` — ${detail}` : ""}`);
}
const fails = results.filter((r) => r[0] === "FAIL").length;
const passes = results.filter((r) => r[0] === "PASS").length;
console.log("└──────┴" + "─".repeat(58) + "┘");
console.log(`\n${passes} PASS · ${fails} FAIL · ${results.filter((r) => r[0] === "SKIP").length} SKIP`);
console.log("\n⚠ Roteiro MANUAL (exige login, ~5 min):");
console.log("  1. /painel/modelos → conferir os 2 modelos jurídicos;");
console.log("  2. Contrato de locação → 📄 Gerar contrato → 🖨 (o troféu!);");
console.log("  3. Ficha de imóvel ≤ 500k → simulador: select Banco, FGTS, selo MCMV, custos de cartório;");
console.log("  4. Rescindir um contrato → banner de multa + lançamento Previsto;");
console.log("  5. Botão 'Marcar COAF comunicado' apagando o alerta do dashboard.");
process.exit(fails > 0 ? 1 : 0);
