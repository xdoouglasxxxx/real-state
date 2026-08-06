import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import MissionSection from "@/components/about/MissionSection";
import AdvisorsSection from "@/components/about/AdvisorsSection";
import CredentialsSection from "@/components/about/CredentialsSection";

export default function About() {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    base44.entities.Agent.list().then(setAgents);
  }, []);

  return (
    <main className="page">
      <MissionSection />
      <CredentialsSection />
      <AdvisorsSection agents={agents} />

      <section className="cta tight" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div>
          <h2>Vamos <em>conversar</em>?</h2>
          <p>Conte o que você procura — ou o que quer vender.</p>
        </div>
        <Link className="btn-solid" to="/vender">Falar com a equipe</Link>
      </section>
    </main>
  );
}
