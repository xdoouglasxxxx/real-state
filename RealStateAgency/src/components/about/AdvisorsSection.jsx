import AdvisorCard from "./AdvisorCard";

export default function AdvisorsSection({ agents = [] }) {
  return (
    <section className="section tight" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <div className="grid-3">
        {agents.map((a) => <AdvisorCard key={a.id} agent={a} />)}
      </div>
    </section>
  );
}
