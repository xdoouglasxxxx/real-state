export default function AgentHighlights({ agents = [] }) {
  return (
    <section className="section tight">
      <div className="section-head">
        <p className="eyebrow">Quem atende você</p>
        <h2>Nossa <em>equipe</em></h2>
      </div>
      <div className="grid-3">
        {agents.map((a) => (
          <article className="agent" key={a.id}>
            <img src={a.photo} alt={a.name} loading="lazy" />
            <h3>{a.name}</h3>
            <p>{a.role} · {a.creci}</p>
            <span className="agent-phone">{a.phone}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
