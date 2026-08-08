/**
 * HEALTH HISTORY — leitor do histórico do Daily Health Check.
 * Analisa os JSONs baixados dos artifacts do GitHub Actions e responde:
 * tendência do score, regressões (passava→falhou), consertos, drift de
 * performance (mesmo check ficando mais lento) e candidatos a flaky.
 *
 * Uso:
 *   1. GitHub → Actions → run → Artifacts → baixe os healthcheck-N.zip
 *   2. Extraia os .json na pasta  health-history/  (na raiz do repo)
 *   3. node scripts/health-history.mjs           (ou --dir outra/pasta)
 * 100% local e somente-leitura.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const DIR = arg("dir", "health-history");

if (!existsSync(DIR)) {
  console.error(`Pasta '${DIR}' não existe. Baixe os artifacts do GitHub e extraia os .json nela.`);
  process.exit(2);
}
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
if (!files.length) { console.error(`Nenhum .json em '${DIR}'.`); process.exit(2); }

const runs = files.map((f) => {
  try { return JSON.parse(readFileSync(join(DIR, f), "utf8")); } catch { return null; }
}).filter(Boolean).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

const tenants = [...new Set(runs.map((r) => r.tenant))];
const fmt = (ts) => new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const VBADGE = { HEALTHY: "🟢", DEGRADED: "🟡", CRITICAL: "🔴" };

for (const tenant of tenants) {
  const serie = runs.filter((r) => r.tenant === tenant);
  console.log(`\n═══════════ ${tenant} — ${serie.length} execuções ═══════════`);

  /* ---- tendência ---- */
  console.log("\n📈 TENDÊNCIA");
  for (const r of serie) {
    const bar = "█".repeat(Math.round(r.score / 5)).padEnd(20, "░");
    console.log(`  ${fmt(r.timestamp)} │ ${bar} ${String(r.score).padStart(5)}% ${VBADGE[r.verdict] ?? ""} ${r.verdict}` +
      ` · ${r.totals.fail} fail · ${r.totals.warn} warn`);
  }

  if (serie.length < 2) { console.log("\n  (com 2+ execuções aparecem regressões, consertos e drift de performance)"); continue; }
  const prev = serie[serie.length - 2], curr = serie[serie.length - 1];
  const byId = (run) => Object.fromEntries(run.checks.map((c) => [c.id, c]));
  const P = byId(prev), C = byId(curr);

  /* ---- regressões e consertos (última vs anterior) ---- */
  const regressions = Object.values(C).filter((c) => c.status === "FAIL" && P[c.id] && P[c.id].status !== "FAIL");
  const fixed = Object.values(C).filter((c) => c.status === "PASS" && P[c.id] && P[c.id].status === "FAIL");
  console.log(`\n🔍 ÚLTIMA vs ANTERIOR (${fmt(prev.timestamp)} → ${fmt(curr.timestamp)})`);
  if (regressions.length) for (const c of regressions) console.log(`  🚨 REGRESSÃO [${c.severity}] ${c.id} ${c.name} — ${c.detail}`);
  if (fixed.length) for (const c of fixed) console.log(`  ✅ CONSERTADO ${c.id} ${c.name}`);
  if (!regressions.length && !fixed.length) console.log("  sem mudanças de status ✔");

  /* ---- drift de performance ---- */
  const drift = Object.values(C).filter((c) => {
    const p = P[c.id];
    return p && c.durationMs > 500 && p.durationMs > 0 && c.durationMs > p.durationMs * 1.5;
  }).sort((a, b) => b.durationMs - a.durationMs).slice(0, 5);
  if (drift.length) {
    console.log("\n🐢 DRIFT DE PERFORMANCE (>50% mais lento que a execução anterior)");
    for (const c of drift) console.log(`  ${c.id} ${c.name}: ${P[c.id].durationMs}ms → ${c.durationMs}ms`);
  }

  /* ---- flaky (oscila em 3+ execuções) ---- */
  if (serie.length >= 3) {
    const flaky = [];
    const ids = [...new Set(serie.flatMap((r) => r.checks.map((c) => c.id)))];
    for (const id of ids) {
      const hist = serie.map((r) => r.checks.find((c) => c.id === id)?.status).filter(Boolean);
      const flips = hist.slice(1).filter((s, i) => (s === "FAIL") !== (hist[i] === "FAIL")).length;
      if (flips >= 2) flaky.push(`${id} (${hist.join("→")})`);
    }
    if (flaky.length) {
      console.log("\n🎲 CANDIDATOS A FLAKY (oscilam PASS/FAIL)");
      for (const f of flaky) console.log(`  ${f}`);
    }
  }

  /* ---- top lentos da última ---- */
  const slow = [...curr.checks].sort((a, b) => b.durationMs - a.durationMs).slice(0, 3);
  console.log(`\n⏱ MAIS LENTOS (última): ${slow.map((c) => `${c.id} ${c.durationMs}ms`).join(" · ")}`);
}
console.log("\nDica de leitura: verdict → FAILs por severidade → regressões → drift. O drift é o problema chegando de fininho.\n");
