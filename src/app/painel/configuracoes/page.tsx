import { requireAdmin } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { updateOrganization } from "./actions";

export const dynamic = "force-dynamic";

export default async function Configuracoes({ searchParams }: { searchParams: { salvo?: string } }) {
  const { org: tenant } = await requireAdmin();
  let org: any = tenant;
  try {
    org = (await prisma.organization.findUnique({ where: { id: tenant.id } })) ?? tenant;
  } catch {}

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "sua-plataforma.com.br";

  return (
    <>
      <h1>Configurações</h1>
      {searchParams.salvo && <p className="ok" style={{ marginBottom: "1rem" }}>✔ Salvo — o site já reflete as mudanças.</p>}

      <form action={updateOrganization} className="pform">
        <section>
          <h2>Identidade</h2>
          <div className="pgrid">
            <label className="span2">Nome da imobiliária
              <input name="name" defaultValue={org.name} required />
            </label>
            <label className="span2">Logo (URL da imagem)
              <input name="logoUrl" defaultValue={org.logoUrl ?? ""} placeholder="https://..." />
            </label>
            <label>Cor da marca
              <input type="color" name="themeBrass" defaultValue={org.themeBrass ?? "#c6a15b"} />
            </label>
            <label>Cor de fundo
              <input type="color" name="themeInk" defaultValue={org.themeInk ?? "#17130e"} />
            </label>
            <label>Cor clara
              <input type="color" name="themeCream" defaultValue={org.themeCream ?? "#f4efe4"} />
            </label>
          </div>
        </section>

        <section>
          <h2>Dados da empresa</h2>
          <div className="pgrid">
            <label>CRECI<input name="creci" defaultValue={org.creci ?? ""} /></label>
            <label>Telefone<input name="phone" defaultValue={org.phone ?? ""} /></label>
            <label>Cidade<input name="city" defaultValue={org.city ?? ""} /></label>
            <label>E-mail público<input name="email" defaultValue={org.email ?? ""} /></label>
            <label className="span4">Endereço<input name="address" defaultValue={org.address ?? ""} /></label>
          </div>
        </section>

        <section>
          <h2>Domínio</h2>
          <p className="pform-hint">
            Endereço atual: <strong>{org.slug}.{root}</strong> (ativo quando a plataforma tiver domínio configurado).
            Conexão de domínio próprio com validação de DNS e SSL automático chega na próxima onda do roadmap.
          </p>
        </section>

        <div className="pform-footer">
          <button className="btn-solid" type="submit">Salvar configurações</button>
        </div>
      </form>
    </>
  );
}
