import { prisma } from "./prisma";

type AgentResult = { id: string; name: string; phone: string | null; fromProperty: boolean };

/**
 * Distribuição automática (rodízio justo):
 * escolhe o corretor ATIVO com MENOS leads recebidos nos últimos 30 dias.
 * Empate: quem está há mais tempo sem receber. Sem corretores: retorna null.
 *
 * L2: se propertyId for informado e o imóvel tiver corretor ativo vinculado,
 * ele recebe o lead diretamente (fromProperty=true) — rodízio só como fallback.
 */
export async function pickAgentRoundRobin(
  orgId: string,
  propertyId?: string | null,
): Promise<AgentResult | null> {
  if (propertyId) {
    const prop = await prisma.property.findFirst({
      where: { id: propertyId, organizationId: orgId },
      select: { agent: { select: { id: true, name: true, phone: true, isActive: true } } },
    });
    if (prop?.agent?.isActive) {
      return { id: prop.agent.id, name: prop.agent.name, phone: prop.agent.phone, fromProperty: true };
    }
  }

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
    return lastA - lastB;
  });
  return { id: agents[0].id, name: agents[0].name, phone: agents[0].phone, fromProperty: false };
}
