import { prisma } from "./prisma";
import { DEMO_PROPERTIES } from "./demo-data";
import { getSiteSummary, summaryFromProperties, type SiteSummary } from "./site-data";

/** Resumo do tenant para o site. Com banco: dados reais (falha vira vazio, NUNCA dado de demonstração). Sem banco: demo. */
export async function loadSiteSummary(orgId: string): Promise<SiteSummary> {
  if (process.env.DATABASE_URL) {
    try { return await getSiteSummary(prisma, orgId); }
    catch (e) { console.error("loadSiteSummary:", e); return { availableCount: 0, hoods: [], agentsCount: 0 }; }
  }
  return summaryFromProperties(DEMO_PROPERTIES, 3);
}
