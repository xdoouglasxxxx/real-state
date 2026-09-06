import { requireAdmin } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { updateOrganization, saveFinancingRates, regenerateFeedToken } from "./actions";
import type { FinancingRate } from "@/lib/financing";

export const dynamic = "force-dynamic";

export default async function Configuracoes({ searchParams }: { searchParams: { salvo?: string } }) {
  const { org: tenant } = await requireAdmin();
  let org: any = tenant;
  try {
    org = (await prisma.organization.findUnique({
      where: { id: tenant.id },
      include: { domains: { where: { isPrimary: true }, take: 1 } },
    })) ?? tenant;
  } catch {}

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "sua-plataforma.com.br";
  // Mesma resolução da rota do feed: domínio próprio > subdomínio > raiz da plataforma
  const feedBase = org.domains?.[0]?.host
    ? `https://${org.domains[0].host}`
    : process.env.NEXT_PUBLIC_ROOT_DOMAIN && !process.env.NEXT_PUBLIC_ROOT_DOMAIN.includes("localhost")
      ? `https://${org.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
      : "https://maisonstate.vercel.app";
  const existingRates: FinancingRate[] = Array.isArray((org as any).financingRates)
    ? (org as any).financingRates : [];
  const rateRows = Array.from({ length: 10 }, (_, i): FinancingRate =>
    existingRates[i] ?? { banco: "", taxa: 0 });

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

      <form action={regenerateFeedToken} className="pform" style={{ marginTop: "1.5rem" }}>
        <section>
          <h2>Integração com portais (feed XML)</h2>
          <p className="pform-hint">
            URL que o portal (ZAP, VivaReal, OLX/Canal Pro...) lê periodicamente para
            importar seus imóveis à venda. Cadastre a URL no painel do portal — o custo
            do anúncio é do plano que você já tem com ele. Regenerar o token invalida
            as URLs antigas.
          </p>
          {org.feedToken ? (
            <div className="pgrid">
              <label className="span4">ZAP / VivaReal / OLX (formato VRSync)
                <input readOnly value={`${feedBase}/api/feed/vrsync?token=${org.feedToken}`} />
              </label>
              <label className="span4">Formato genérico (outros portais)
                <input readOnly value={`${feedBase}/api/feed/generic?token=${org.feedToken}`} />
              </label>
            </div>
          ) : (
            <p className="pform-hint">
              Nenhum token gerado ainda — clique abaixo para criar as URLs do feed.
            </p>
          )}
          <div className="pform-footer">
            <button className="btn-outline" type="submit">
              {org.feedToken ? "Regenerar token (invalida as URLs atuais)" : "Gerar URLs do feed"}
            </button>
          </div>
        </section>
      </form>

      <form action={saveFinancingRates} className="pform" style={{ marginTop: "1.5rem" }}>
        <section>
          <h2>Taxas de financiamento</h2>
          <p className="pform-hint">
            Exibidas no simulador da ficha do imóvel — o corretor seleciona o banco e o campo de
            juros é preenchido automaticamente. Deixe em branco as linhas não usadas. Taxa entre
            1% e 30%; nome do banco até 40 caracteres; máximo 10 entradas.
          </p>
          <div className="pgrid">
            {rateRows.map((r, i) => (
              <>
                <label key={`b${i}`}>Banco {i + 1}
                  <input name={`banco_${i}`} defaultValue={r.banco} maxLength={40} placeholder="ex.: Caixa" />
                </label>
                <label key={`t${i}`}>Taxa (% a.a.)
                  <input name={`taxa_${i}`} type="number" step={0.01} min={0} max={30}
                    defaultValue={r.taxa > 0 ? r.taxa : ""} placeholder="ex.: 10.49" />
                </label>
              </>
            ))}
          </div>
          <div className="pform-footer">
            <button className="btn-solid" type="submit">Salvar taxas</button>
          </div>
        </section>
      </form>
    </>
  );
}
