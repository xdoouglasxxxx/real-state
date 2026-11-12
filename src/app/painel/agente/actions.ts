"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/perm";
import { resolveSuggestion } from "@/lib/agent-day";

/**
 * "Marcar como feito" / "Dispensar" uma sugestão do Agente do dia: grava uma anotação na timeline do lead
 * (sem tabela nova) e esconde a sugestão por alguns dias. Toda a regra (posse, duplicata, janela) está em
 * `resolveSuggestion`, que é testada; aqui só se lê o formulário e se volta para a tela.
 */
export async function resolveSuggestionAction(formData: FormData) {
  const ctx = await requirePanel();
  const input = {
    kind: String(formData.get("kind") ?? ""),
    entityId: String(formData.get("entityId") ?? ""),
    leadId: String(formData.get("leadId") ?? ""),
    outcome: String(formData.get("outcome") ?? ""),
  };
  let result = "erro";
  try {
    const r = await resolveSuggestion(
      prisma,
      { orgId: ctx.org.id, agentId: ctx.agentId, isAgent: ctx.isAgent, author: ctx.master ? "Master (plataforma)" : ctx.email },
      input,
    );
    result = r === "created" ? "1" : r === "duplicate" ? "dup" : "erro";
    if (r === "created") revalidatePath(`/painel/leads/${input.leadId}`);
  } catch (e) {
    console.error("resolveSuggestionAction:", e);
  }
  revalidatePath("/painel/agente");
  redirect(`/painel/agente?feito=${result}`);
}
