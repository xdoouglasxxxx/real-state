export default function AdvisorCard({ agent }) {
  return (
    <article className="agent">
      <img src={agent.photo} alt={agent.name} loading="lazy" />
      <h3>{agent.name}</h3>
      <p>{agent.role} · {agent.creci}</p>
      {agent.bio && <p className="agent-bio">{agent.bio}</p>}
      <span className="agent-phone">{agent.phone}</span>
    </article>
  );
}
