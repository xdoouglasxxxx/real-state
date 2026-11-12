import { prisma } from "@/lib/prisma";
import { addTenantDomain, verifyTenantDomain, removeTenantDomain } from "@/app/painel/configuracoes/actions";
import { domainsEnabled, getDomainStatus, isApexHost, type DomainStatus } from "@/lib/vercel-domains";

// [sucesso?, texto]
const FLASH: Record<string, [boolean, string]> = {
  ok: [true, "Domínio adicionado. Crie o registro de DNS indicado abaixo e clique em “Verificar”."],
  ativo: [true, "✔ Domínio ativo! O site já responde nele — o certificado SSL é emitido automaticamente."],
  removido: [true, "Domínio removido."],
  dns: [false, "Posse confirmada, mas o DNS ainda não aponta para a plataforma. A propagação pode levar de minutos a algumas horas."],
  txt: [false, "Ainda não foi possível confirmar a posse do domínio. Confira o registro TXT indicado abaixo."],
  invalido: [false, "Domínio inválido. Use algo como www.suaimobiliaria.com.br (sem https:// e sem barras)."],
  reservado: [false, "Este endereço pertence à plataforma e não pode ser conectado."],
  desativado: [false, "A conexão automática de domínio ainda não está habilitada nesta plataforma."],
  limite: [false, "Muitas tentativas seguidas. Aguarde um pouco e tente de novo."],
  max: [false, "Limite de 3 domínios por imobiliária atingido. Remova um para adicionar outro."],
  duplicado: [false, "Este domínio já está conectado à sua imobiliária."],
  emuso: [false, "Este domínio já está em uso por outra imobiliária."],
  vercel: [false, "A hospedagem não aceitou o domínio agora. Confira o endereço e tente novamente."],
  naoencontrado: [false, "Domínio não encontrado."],
  interno: [false, "Não foi possível concluir agora. Tente novamente em instantes."],
};

function badge(st?: DomainStatus): { text: string; ok: boolean } {
  if (!st || st.verified === null) return { text: "Status indisponível", ok: false };
  if (!st.verified) return { text: "Aguardando verificação (TXT)", ok: false };
  if (st.misconfigured === false) return { text: "Ativo", ok: true };
  return { text: "Aguardando DNS", ok: false };
}

export default async function DomainsSection({
  orgId, slug, root, flash, code,
}: { orgId: string; slug: string; root: string; flash?: string; code?: string }) {
  let domains: { id: string; host: string; isPrimary: boolean }[] = [];
  try {
    domains = await prisma.domain.findMany({
      where: { organizationId: orgId }, orderBy: { host: "asc" },
      select: { id: true, host: true, isPrimary: true },
    });
  } catch { /* tabela inacessível: mostra só o endereço padrão */ }

  const enabled = domainsEnabled();
  const statuses = enabled ? await Promise.all(domains.map((d) => getDomainStatus(d.host))) : [];
  const msg = flash ? FLASH[flash] : undefined;
  const safeCode = String(code ?? "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);

  return (
    <div className="pform" id="dominio" style={{ marginTop: "1.5rem" }}>
      <section>
        <h2>Domínio próprio</h2>
        <p className="pform-hint">
          Endereço padrão: <strong>{slug}.{root}</strong>. Você pode conectar o domínio da sua imobiliária
          (ex.: <strong>www.suaimobiliaria.com.br</strong>): adicione abaixo, crie o registro de DNS indicado no
          provedor onde registrou o domínio e clique em “Verificar”. O certificado SSL é emitido automaticamente.
        </p>

        {msg && (
          <p className={msg[0] ? "ok" : "pform-error"} style={{ margin: ".8rem 0" }}>
            {msg[1]}{flash === "vercel" && safeCode ? ` (código: ${safeCode})` : ""}
          </p>
        )}

        {domains.map((d, i) => {
          const st = statuses[i];
          const b = badge(st);
          const sub = d.host.split(".")[0];
          return (
            <div className="ficha-box" key={d.id} style={{ marginTop: ".9rem" }}>
              <div style={{ display: "flex", gap: ".8rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div>
                  <strong>{d.host}</strong>{d.isPrimary && <span className="pill" style={{ marginLeft: ".6rem" }}>principal</span>}
                </div>
                <span className="pill" style={b.ok ? { borderColor: "#5a8a5a", color: "#8fc98f" } : undefined}>{b.text}</span>
              </div>

              {enabled && !b.ok && (
                <>
                  <p className="pform-hint" style={{ marginTop: ".8rem" }}>Crie estes registros no DNS do seu domínio:</p>
                  <table className="table" style={{ marginTop: ".4rem" }}>
                    <thead><tr><th>Tipo</th><th>Nome</th><th>Valor</th></tr></thead>
                    <tbody>
                      {isApexHost(d.host)
                        ? <tr><td>A</td><td>@</td><td>{st?.ipv4}</td></tr>
                        : <tr><td>CNAME</td><td>{sub}</td><td>{st?.cname}</td></tr>}
                      {st?.verification.map((v) => (
                        <tr key={v.domain + v.value}><td>{v.type}</td><td>{v.domain}</td><td style={{ wordBreak: "break-all" }}>{v.value}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <div style={{ display: "flex", gap: ".6rem", marginTop: ".9rem", flexWrap: "wrap" }}>
                {enabled && (
                  <form action={verifyTenantDomain}>
                    <input type="hidden" name="id" value={d.id} />
                    <button className="btn-outline" type="submit">Verificar</button>
                  </form>
                )}
                <form action={removeTenantDomain}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="btn-outline" type="submit">Remover</button>
                </form>
              </div>
            </div>
          );
        })}

        {enabled ? (
          domains.length < 3 && (
            <form action={addTenantDomain} style={{ marginTop: "1.2rem" }}>
              <div className="pgrid">
                <label className="span3">Conectar um domínio
                  <input name="host" placeholder="www.suaimobiliaria.com.br" required maxLength={253} autoComplete="off" />
                </label>
              </div>
              <div className="pform-footer">
                <button className="btn-solid" type="submit">Conectar domínio</button>
              </div>
            </form>
          )
        ) : (
          <p className="pform-hint" style={{ marginTop: "1rem" }}>
            A conexão automática de domínio ainda não está habilitada nesta plataforma
            (exige VERCEL_API_TOKEN e VERCEL_PROJECT_ID — veja DOMINIOS.md). Enquanto isso, fale com o suporte.
          </p>
        )}
      </section>
    </div>
  );
}
