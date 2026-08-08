import { requireAdmin } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { PLACEHOLDERS } from "@/lib/contract-render";
import { ensureDefaultTemplates, saveTemplate } from "./actions";

export const dynamic = "force-dynamic";

export default async function Modelos({ searchParams }: { searchParams: { ok?: string; erro?: string } }) {
  const ctx = await requireAdmin();
  await ensureDefaultTemplates(ctx.org.id);

  let templates: any[] = [];
  try {
    templates = await prisma.contractTemplate.findMany({
      where: { organizationId: ctx.org.id },
      orderBy: { kind: "asc" },
    });
  } catch {}

  return (
    <>
      <h1>Modelos de contrato</h1>
      <p style={{ color: "var(--stone)", marginBottom: "1.2rem", maxWidth: 760 }}>
        Estes modelos alimentam o botão "Gerar contrato" nas fichas de venda e locação. Os campos entre chaves
        duplas são preenchidos automaticamente com os dados reais da negociação. Edite o texto livremente —
        e revise com seu jurídico: os padrões trazem as cláusulas essenciais (Lei 8.245/91 para locação,
        quadro-resumo da Lei 14.825/24 para venda), mas cada operação tem suas particularidades.
      </p>

      {searchParams.ok && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Modelo salvo.</p>}
      {searchParams.erro && <p className="pform-error">Confira o nome e o corpo do modelo (mínimo 50 caracteres).</p>}

      <section className="ficha-box" style={{ marginBottom: "1.4rem" }}>
        <h2>Campos disponíveis</h2>
        {Object.entries(PLACEHOLDERS).map(([group, keys]) => (
          <p key={group} style={{ fontSize: ".85rem", marginBottom: ".4rem" }}>
            <strong style={{ color: "var(--brass)" }}>{group}:</strong>{" "}
            <span style={{ color: "var(--stone)", overflowWrap: "anywhere" }}>
              {keys.map((k) => `{{${k}}}`).join(" · ")}
            </span>
          </p>
        ))}
      </section>

      {templates.map((t) => (
        <form key={t.id} action={saveTemplate} className="pform" style={{ marginBottom: "1.6rem" }}>
          <section>
            <h2>{t.kind === "VENDA" ? "📄 Venda" : "🏠 Locação"}</h2>
            <input type="hidden" name="id" value={t.id} />
            <div className="pgrid">
              <label className="span4">Nome do modelo
                <input name="name" defaultValue={t.name} maxLength={120} required />
              </label>
              <label className="span4">Corpo do contrato
                <textarea name="body" defaultValue={t.body} rows={18} required
                          style={{ fontFamily: "ui-monospace, monospace", fontSize: ".82rem", lineHeight: 1.55 }} />
              </label>
            </div>
            {t.updatedBy && (
              <p style={{ color: "var(--stone)", fontSize: ".76rem" }}>
                Última edição por {t.updatedBy} em {new Date(t.updatedAt).toLocaleString("pt-BR")}
              </p>
            )}
            <div className="pform-footer">
              <button className="btn-solid" type="submit">Salvar modelo</button>
            </div>
          </section>
        </form>
      ))}
    </>
  );
}
