/** Download seguro: qualquer papel do PAINEL, sempre via URL assinada de 1h. */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPanelContext } from "@/lib/perm";
import { signedDownloadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ctx = await getPanelContext();
  if (!ctx || ctx.role === "CLIENT") return new NextResponse("não autorizado", { status: 401 });

  const doc = await prisma.document.findFirst({
    where: { id: params.id, organizationId: ctx.org.id },
    select: { fileUrl: true },
  });
  if (!doc) return new NextResponse("não encontrado", { status: 404 });
  if (doc.fileUrl.startsWith("http")) return NextResponse.redirect(doc.fileUrl);

  const url = await signedDownloadUrl(doc.fileUrl);
  if (!url) return new NextResponse("storage indisponível", { status: 503 });
  return NextResponse.redirect(url);
}
