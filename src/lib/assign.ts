import { prisma } from "./prisma";

/**
 * Distribuição automática (rodízio justo):
 * escolhe o corretor ATIVO com MENOS leads recebidos nos últimos 30 dias.
 * Empate: quem está há mais tempo sem receber. Sem corretores: retorna null.
 */
export async function pickAgentRoundRobin(orgId: string) {
  const since = new Date(Date.now() - 30 * 86400000);
  const agents = await prisma.agent.findMany({
    where: { organizationId: orgId, isActive: true },
    select: {
      id: true, name: true, phone: true, createdAt: true,
      _count: { select: { leads: { where: { createdAt: { gte: since } } } } },
      leads: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!agents.length) return null;

  agents.sort((a, b) => {
    const diff = a._count.leads - b._count.leads;
    if (diff !== 0) return diff;
    const lastA = a.leads[0]?.createdAt?.getTime() ?? 0;
    const lastB = b.leads[0]?.createdAt?.getTime() ?? 0;
    return lastA - lastB; // há mais tempo sem receber vem primeiro
  });
  return agents[0];
}
