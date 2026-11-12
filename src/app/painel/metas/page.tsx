import Link from "next/link";
import { requireManagerUp } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/format";
import MoneyInput from "@/components/painel/MoneyInput";
import { saveGoals } from "./actions";

export const dynamic = "force-dynamic";

type YM = { year: number; month: number };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function parseYm(ym?: string): YM {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym ?? "");
  if (m && Number(m[1]) >= 2020 && Number(m[1]) <= 2100) return { year: Number(m[1]), month: Number(m[2]) };
  const n = new Date(); // mesma referência de mês usada pelo dashboard
  return { year: n.getFullYear(), month: n.getMonth() + 1 };
}
function shift(v: YM, delta: number): YM {
  const i = v.year * 12 + (v.month - 1) + delta;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}
const key = (v: YM) => `${v.year}-${String(v.month).padStart(2, "0")}`;
const asInput = (n: number) => (n > 0 ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "");

export default async function Metas({ searchParams }: { searchParams: { ym?: string; salvo?: string; erro?: string } }) {
  const { org } = await requireManagerUp();
  const cur = parseYm(searchParams.ym);
  const prev = shift(cur, -1);

  let agents: { id: string; name: string }[] = [];
  let goals: { agentId: string | null; targetAmount: unknown }[] = [];
  let prevGoals: { agentId: string | null; targetAmount: unknown }[] = [];
  try {
    [agents, goals, prevGoals] = await Promise.all([
      prisma.agent.findMany({ where: { organizationId: org.id, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.goal.findMany({ where: { organizationId: org.id, year: cur.year, month: cur.month }, select: { agentId: true, targetAmount: true } }),
      prisma.goal.findMany({ where: { organizationId: org.id, year: prev.year, month: prev.month }, select: { agentId: true, targetAmount: true } }),
    ]);
  } catch (e) { console.error("metas:", e); }

  const goalOf = (list: typeof goals, agentId: string | null) =>
    Number(list.find((g) => g.agentId === agentId)?.targetAmount ?? 0);

  const Row = ({ label, agentId }: { label: string; agentId: string | null }) => {
    const prevVal = goalOf(prevGoals, agentId);
    return (
      <label className="span2">{label}
        <MoneyInput name={agentId ? `goal_${agentId}` : "goal_org"} placeholder="R$ 0,00" defaultValue={asInput(goalOf(goals, agentId))} />
        {prevVal > 0 && <small style={{ color: "var(--stone)", textTransform: "none", letterSpacing: 0 }}>{MESES[prev.month - 1]}: {brl(prevVal)}</small>}
      </label>
    );
  };

  return (
    <>
      <h1>Metas de vendas</h1>
      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Metas salvas — o dashboard já reflete.</p>}
      {searchParams.erro && <p className="pform-error">Não foi possível salvar as metas. Tente novamente.</p>}

      <div style={{ display: "flex", gap: "1rem", alignItems: "center", margin: "0 0 1.2rem", flexWrap: "wrap" }}>
        <Link className="btn-outline" href={`/painel/metas?ym=${key(prev)}`}>← {MESES[prev.month - 1]}</Link>
        <strong style={{ textTransform: "capitalize", fontSize: "1.1rem" }}>{MESES[cur.month - 1]} de {cur.year}</strong>
        <Link className="btn-outline" href={`/painel/metas?ym=${key(shift(cur, 1))}`}>{MESES[shift(cur, 1).month - 1]} →</Link>
      </div>

      <form action={saveGoals} className="pform">
        <input type="hidden" name="ym" value={key(cur)} />
        <section>
          <h2>Meta de vendas do mês (em R$ vendidos)</h2>
          <p className="pform-hint">
            A meta da imobiliária alimenta a barra do Dashboard; a de cada corretor aparece no painel dele.
            Deixe em branco para não ter meta naquele mês.
          </p>
          <div className="pgrid" style={{ marginTop: "1rem" }}>
            <Row label="Imobiliária (total)" agentId={null} />
            {agents.map((a) => <Row key={a.id} label={a.name} agentId={a.id} />)}
          </div>
          {agents.length === 0 && (
            <p className="pform-hint" style={{ marginTop: ".8rem" }}>Cadastre corretores para definir metas individuais.</p>
          )}
          <div className="pform-footer">
            <button className="btn-solid" type="submit">Salvar metas</button>
          </div>
        </section>
      </form>
    </>
  );
}
