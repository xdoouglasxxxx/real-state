/**
 * Funil de conversão do período: de todos os leads CRIADOS no período, quantos CHEGARAM
 * até cada etapa. "Chegou" = a etapa atual ou qualquer etapa de destino que o lead já teve
 * no histórico (mudanças de etapa gravadas). Lead perdido conta até onde chegou.
 * Funções puras, testadas em tests/unit/funnel.test.ts.
 */
export const FUNNEL_STAGES = ["NEW", "CONTACTED", "VISIT", "PROPOSAL", "FINANCING", "CONTRACT", "WON"] as const;

export const FUNNEL_LABEL: Record<string, string> = {
  NEW: "Leads", CONTACTED: "Contatados", VISIT: "Visitas", PROPOSAL: "Propostas",
  FINANCING: "Financiamento", CONTRACT: "Contratos", WON: "Vendas",
};

export type FunnelStep = {
  stage: string;
  label: string;
  count: number;
  /** % de quem estava na etapa anterior (null na primeira) */
  pctOfPrev: number | null;
  /** % do total de leads do período */
  pctOfTotal: number;
};

const idx = (stage: string) => (FUNNEL_STAGES as readonly string[]).indexOf(stage);

/** Etapa mais avançada que o lead já alcançou (0 = só entrou). */
export function maxStageIndex(currentStage: string, reachedStages: string[]): number {
  let best = Math.max(0, idx(currentStage)); // LOST/desconhecida → -1 → 0
  for (const s of reachedStages) best = Math.max(best, idx(s));
  return best;
}

export function buildFunnel(
  leads: { id: string; stage: string }[],
  changes: { leadId: string; to: string }[],
): FunnelStep[] {
  const reached = new Map<string, string[]>();
  for (const c of changes) {
    const list = reached.get(c.leadId);
    if (list) list.push(c.to); else reached.set(c.leadId, [c.to]);
  }
  const counts = new Array(FUNNEL_STAGES.length).fill(0) as number[];
  for (const l of leads) {
    const top = maxStageIndex(l.stage, reached.get(l.id) ?? []);
    for (let k = 0; k <= top; k++) counts[k]++;
  }
  const total = counts[0];
  return FUNNEL_STAGES.map((stage, k) => ({
    stage,
    label: FUNNEL_LABEL[stage],
    count: counts[k],
    pctOfPrev: k === 0 ? null : counts[k - 1] > 0 ? Math.round((100 * counts[k]) / counts[k - 1]) : 0,
    pctOfTotal: total > 0 ? Math.round((100 * counts[k]) / total) : 0,
  }));
}

/**
 * Passagem com a menor conversão (onde mais se perde). Só concorre quem tem base de pelo menos
 * `minBase` leads na etapa de origem: "0% de 1 lead" é ruído, não perda. Se nenhuma passagem tem
 * base suficiente, vale qualquer uma com base > 0. null se não há dados.
 */
export function worstStep(steps: FunnelStep[], minBase = 5): { fromIndex: number; toIndex: number; pct: number } | null {
  const pick = (floor: number) => {
    let best: { fromIndex: number; toIndex: number; pct: number } | null = null;
    for (let k = 1; k < steps.length; k++) {
      if (steps[k - 1].count < floor) continue;
      const pct = steps[k].pctOfPrev ?? 0;
      if (!best || pct < best.pct) best = { fromIndex: k - 1, toIndex: k, pct };
    }
    return best;
  };
  return pick(minBase) ?? pick(1);
}
