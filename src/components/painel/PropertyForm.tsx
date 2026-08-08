import { saveProperty } from "@/app/painel/actions";
import PhotoUploader from "./PhotoUploader";

type Agent = { id: string; name: string };

export default function PropertyForm({
  property, agents, erro,
}: { property?: any; agents: Agent[]; erro?: string }) {
  const p = property ?? {};
  return (
    <form action={saveProperty} className="pform">
      {p.id && <input type="hidden" name="id" value={p.id} />}

      {erro === "1" && <p className="pform-error">Preencha ao menos Título e Preço.</p>}
      {erro === "2" && <p className="pform-error">Erro ao salvar. Verifique os dados e tente de novo.</p>}

      <section>
        <h2>Informações principais</h2>
        <div className="pgrid">
          <label className="span2">Título*
            <input name="title" defaultValue={p.title ?? ""} required placeholder="Ex.: Casa do Vale" maxLength={200} />
          </label>
          <label>Tipo*
            <select name="type" defaultValue={p.type ?? "HOUSE"}>
              <option value="HOUSE">Casa</option>
              <option value="APARTMENT">Apartamento</option>
              <option value="LAND">Terreno</option>
              <option value="COMMERCIAL">Comercial</option>
              <option value="FARM">Fazenda/Sítio</option>
            </select>
          </label>
          <label>Status
            <select name="status" defaultValue={p.status ?? "FOR_SALE"}>
              <option value="DRAFT">Rascunho (não publica)</option>
              <option value="FOR_SALE">À venda</option>
              <option value="EXCLUSIVE">Exclusivo</option>
              <option value="RESERVED">Reservado</option>
              <option value="SOLD">Vendido</option>
            </select>
          </label>
          <label>Preço (R$)*
            <input name="price" type="number" step="0.01" min="0" defaultValue={p.price ?? ""} required />
          </label>
          <label>Condomínio (R$/mês)
            <input name="condoFee" type="number" step="0.01" min="0" defaultValue={p.condoFee ?? ""} />
          </label>
          <label>IPTU (R$/ano)
            <input name="iptuYearly" type="number" step="0.01" min="0" defaultValue={p.iptuYearly ?? ""} />
          </label>
          <label>Corretor responsável
            <select name="agentId" defaultValue={p.agentId ?? ""}>
              <option value="">— Sem corretor —</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          <label className="span2 check">
            <input type="checkbox" name="isFeatured" defaultChecked={Boolean(p.isFeatured)} />
            Destaque na home
          </label>
          <label className="span4">Descrição
            <textarea name="description" rows={5} defaultValue={p.description ?? ""}
              placeholder="Descreva o imóvel — ambientes, acabamentos, diferenciais..." maxLength={5000} />
          </label>
        </div>
      </section>

      <section>
        <h2>Características</h2>
        <div className="pgrid">
          <label>Quartos<input name="bedrooms" type="number" min="0" defaultValue={p.bedrooms ?? ""} /></label>
          <label>Suítes<input name="suites" type="number" min="0" defaultValue={p.suites ?? ""} /></label>
          <label>Banheiros<input name="bathrooms" type="number" min="0" defaultValue={p.bathrooms ?? ""} /></label>
          <label>Vagas<input name="parkingSpaces" type="number" min="0" defaultValue={p.parkingSpaces ?? ""} /></label>
          <label>Área útil (m²)<input name="areaM2" type="number" min="0" defaultValue={p.areaM2 ?? ""} /></label>
          <label className="span4">Comodidades (separadas por vírgula)
            <input name="features" defaultValue={(p.features ?? []).join(", ")}
              placeholder="Piscina aquecida, Adega, Home theater, Energia solar" maxLength={500} />
          </label>
        </div>
      </section>

      <section>
        <h2>Localização</h2>
        <div className="pgrid">
          <label>Bairro/Região<input name="neighborhood" defaultValue={p.neighborhood ?? ""} maxLength={100} /></label>
          <label>Cidade<input name="city" defaultValue={p.city ?? ""} maxLength={100} /></label>
          <label>UF<input name="state" maxLength={2} defaultValue={p.state ?? "SP"} /></label>
          <label>CEP<input name="zipcode" defaultValue={p.zipcode ?? ""} maxLength={9} /></label>
          <label className="span2">Endereço (interno — não aparece no site)
            <input name="address" defaultValue={p.address ?? ""} maxLength={300} />
          </label>
          <label>Latitude<input name="latitude" type="number" step="any" defaultValue={p.latitude ?? ""} /></label>
          <label>Longitude<input name="longitude" type="number" step="any" defaultValue={p.longitude ?? ""} /></label>
        </div>
        <p className="pform-hint">Com latitude/longitude preenchidas, o mapa aparece na página do imóvel. Pegue no Google Maps: clique com o botão direito no local → copiar coordenadas.</p>
      </section>

      <section>
        <h2>Fotos e tour virtual</h2>
        <PhotoUploader initial={p.images ?? []} />
        <label className="pform-tour">URL do tour virtual (Matterport, Kuula...)
          <input name="tourUrl" defaultValue={p.tourUrl ?? ""} placeholder="https://my.matterport.com/show/?m=..." maxLength={500} />
        </label>
      </section>

      <section>
        <h2>SEO (opcional)</h2>
        <div className="pgrid">
          <label className="span2">Título para o Google
            <input name="seoTitle" defaultValue={p.seoTitle ?? ""} placeholder="Deixe vazio para gerar automático" maxLength={70} />
          </label>
          <label className="span2">Descrição para o Google
            <input name="seoDescription" defaultValue={p.seoDescription ?? ""} placeholder="Deixe vazio para gerar automático" maxLength={160} />
          </label>
        </div>
      </section>

      <div className="pform-footer">
        <button className="btn-solid" type="submit">{p.id ? "Salvar alterações" : "Cadastrar imóvel"}</button>
      </div>
    </form>
  );
}
