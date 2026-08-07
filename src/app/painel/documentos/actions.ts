"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerUp, requireAdmin } from "@/lib/perm";
import { storageEnabled, signedUploadUrl, deleteObject, safeFileName } from "@/lib/storage";

const DOC_KINDS = ["MATRICULA", "IPTU", "ESCRITURA", "ONUS", "LAUDO", "CONTRATO", "PROCURACAO", "COMPROVANTE", "RG", "CPF", "OUTRO"] as const;

/** Passo 1 (chamado pelo uploader): gera a URL assinada para o navegador
 *  enviar o arquivo DIRETO ao bucket — o PDF nunca passa pelo nosso servidor. */
export async function prepareDocumentUpload(fileName: string) {
  const ctx = await requireManagerUp();
  if (!storageEnabled()) return { error: "storage_off" as const };
  const path = `${ctx.org.id}/${Date.now()}-${safeFileName(fileName || "documento.pdf")}`;
  const uploadUrl = await signedUploadUrl(path);
  if (!uploadUrl) return { error: "sign_failed" as const };
  return { uploadUrl, path };
}

/** Passo 2: registra o documento no banco (após o upload concluir). */
export async function registerDocument(input: {
  path: string; name: string; kind: string;
  propertyId?: string | null; contractId?: string | null; financeEntryId?: string | null;
}) {
  const ctx = await requireManagerUp();
  const kind = DOC_KINDS.includes(input.kind as any) ? input.kind : "OUTRO";
  const name = String(input.name ?? "").trim().slice(0, 120) || "Documento";
  if (!input.path?.startsWith(`${ctx.org.id}/`)) return { error: "path_invalido" as const };

  try {
    // Blindagem: vínculos só DESTE tenant
    const [propOk, contractOk, finOk] = await Promise.all([
      input.propertyId ? prisma.property.findFirst({ where: { id: input.propertyId, organizationId: ctx.org.id }, select: { id: true } }) : null,
      input.contractId ? prisma.contract.findFirst({ where: { id: input.contractId, organizationId: ctx.org.id }, select: { id: true } }) : null,
      input.financeEntryId ? prisma.financeEntry.findFirst({ where: { id: input.financeEntryId, organizationId: ctx.org.id }, select: { id: true } }) : null,
    ]);
    await prisma.document.create({
      data: {
        organizationId: ctx.org.id,
        propertyId: propOk?.id ?? null,
        contractId: contractOk?.id ?? null,
        financeEntryId: finOk?.id ?? null,
        kind: kind as any, name,
        fileUrl: input.path, // caminho no bucket (download sempre via URL assinada)
        uploadedBy: ctx.master ? "Master (plataforma)" : ctx.email,
      },
    });
  } catch (e) {
    console.error("registerDocument:", e);
    return { error: "interno" as const };
  }
  revalidatePath("/painel/documentos");
  revalidatePath("/painel/financeiro");
  return { ok: true as const };
}

/** Excluir documento (admin): apaga o registro e o arquivo do bucket. */
export async function deleteDocument(formData: FormData) {
  const ctx = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  try {
    const doc = await prisma.document.findFirst({ where: { id, organizationId: ctx.org.id } });
    if (doc) {
      await prisma.document.delete({ where: { id: doc.id } });
      if (!doc.fileUrl.startsWith("http")) await deleteObject(doc.fileUrl);
    }
  } catch (e) { console.error("deleteDocument:", e); }
  revalidatePath("/painel/documentos");
  redirect("/painel/documentos");
}
