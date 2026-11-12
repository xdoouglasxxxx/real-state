"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerUp } from "@/lib/perm";

/** "R$ 1.250.000,50" → 1250000.5  (mesmo parse do MoneyInput/financeiro). */
const parseMoney = (v: FormDataEntryValue | null) =>
  Number(String(v ?? "").replace(/[^\d,]/g, "").replace(",", "."));

/** Salva (ou limpa) a meta da imobiliária e a de cada corretor para um mês. */
export async function saveGoals(formData: FormData) {
  const { org } = await requireManagerUp();

  const ym = String(formData.get("ym") ?? "");
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym);
  if (!m || Number(m[1]) < 2020 || Number(m[1]) > 2100) redirect("/painel/metas?erro=1");
  const year = Number(m![1]);
  const month = Number(m![2]);

  let ok = true;
  try {
    // Só corretores DESTA imobiliária entram (nunca confiar em id vindo do form).
    const agents = await prisma.agent.findMany({
      where: { organizationId: org.id }, select: { id: true },
    });
    const targets: (string | null)[] = [null, ...agents.map((a) => a.id)]; // null = meta da imobiliária

    for (const agentId of targets) {
      const field = agentId ? `goal_${agentId}` : "goal_org";
      if (!formData.has(field)) continue; // campo ausente (ex.: corretor inativo) = não mexe
      const n = parseMoney(formData.get(field));
      const existing = await prisma.goal.findFirst({
        where: { organizationId: org.id, agentId, year, month },
      });

      if (!n || n < 0) { // vazio/zero = remove a meta do mês
        if (existing) await prisma.goal.delete({ where: { id: existing.id } });
        continue;
      }
      if (n >= 1e12) continue; // estoura Decimal(14,2)
      const targetAmount = n.toFixed(2);
      if (existing) await prisma.goal.update({ where: { id: existing.id }, data: { targetAmount } });
      else await prisma.goal.create({ data: { organizationId: org.id, agentId, year, month, targetAmount } });
    }
  } catch (e) {
    console.error("saveGoals:", e);
    ok = false;
  }

  revalidatePath("/painel");
  revalidatePath("/painel/metas");
  redirect(`/painel/metas?ym=${ym}&${ok ? "salvo=1" : "erro=2"}`);
}
