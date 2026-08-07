/** Download do cliente: só documentos dos CONTRATOS das negociações DELE. */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/auth";
import { signedDownloadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const org = await getTenant();
  const session = getSession();
  if (!session || session.orgId !== org.id || session.role !== "CLIENT") {
    return new NextResponse("não autorizado", { status: 401 });
  }

  // O documento precisa pertencer a um contrato cuja proposta é de um contato com o e-mail do cliente
  const doc = await prisma.document.findFirst({
    where: {
      id: params.id,
      organizationId: org.id,
      contract: {
        proposal: {
          contact: { organizationId: org.id, email: { equals: session.email, mode: "insensitive" } },
        },
      },
    },
    select: { fileUrl: true },
  });
  if (!doc) return new NextResponse("não encontrado", { status: 404 });
  if (doc.fileUrl.startsWith("http")) return NextResponse.redirect(doc.fileUrl);

  const url = await signedDownloadUrl(doc.fileUrl);
  if (!url) return new NextResponse("storage indisponível", { status: 503 });
  return NextResponse.redirect(url);
}
