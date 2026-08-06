import type { Metadata } from "next";
import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { getAgents } from "@/lib/data";

export const metadata: Metadata = { title: "Sobre" };

export default async function Sobre() {
  const org = await getTenant();
  const agents = await getAgents(org.id);
  return (
    <main className="page">
      <div className="page-head">
        <p className="eyebrow">Desde 2012</p>
        <h1>Uma casa não se vende.<br /><em>Se apresenta.</em></h1>
        <p className="lead">
          A {org.name} nasceu de uma convicção simples: imóveis de alto padrão pedem o mesmo
          cuidado na venda que tiveram na construção. Somos uma equipe enxuta, com carteira
          selecionada e atendimento que começa e termina com a mesma pessoa.
        </p>
      </div>

      <div className="grid-3">
        {agents.map((a: any) => (
          <article className="agent" key={a.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.photoUrl} alt={a.name} loading="lazy" />
            <h3>{a.name}</h3>
            <p>{a.creci}{a.bio ? ` · ${a.bio}` : ""}</p>
            <span className="agent-phone">{a.phone}</span>
          </article>
        ))}
      </div>

      <section className="cta" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div>
          <h2>Vamos <em>conversar</em>?</h2>
          <p>Conte o que você procura — ou o que quer vender.</p>
        </div>
        <Link className="btn-solid" href="/vender">Falar com a equipe</Link>
      </section>
    </main>
  );
}
