"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { moveLeadStage } from "@/app/painel/leads/actions";

const STAGES = [
  ["NEW", "Novo"], ["CONTACTED", "Contatado"], ["VISIT", "Visita"],
  ["PROPOSAL", "Proposta"], ["FINANCING", "Financiamento"],
  ["CONTRACT", "Contrato"], ["WON", "Ganho"],
] as const;

const SOURCE: Record<string, string> = {
  SITE: "Site", INSTAGRAM: "Instagram", FACEBOOK: "Facebook", WHATSAPP: "WhatsApp",
  GOOGLE: "Google", INDICACAO: "Indicação", PORTAL: "Portal", OUTRO: "Outro",
};

type Lead = { id: string; stage: string; source: string; name: string; phone: string; property: string; agent: string; score?: number };

const temp = (score?: number) =>
  score == null ? null : score >= 70 ? ["🔥", "Quente"] : score >= 40 ? ["🌤", "Morno"] : ["❄️", "Frio"];

export default function LeadsBoard({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [over, setOver] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onDrop = (stage: string, e: React.DragEvent) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/lead");
    if (!id) return;
    // otimista: move na tela na hora, persiste em background
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)));
    startTransition(() => { moveLeadStage(id, stage); });
  };

  const wa = (phone: string, name: string) =>
    `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${name.split(" ")[0]}! Aqui é da imobiliária — vi seu interesse e queria te ajudar. 😊`)}`;

  return (
    <div className="kanban">
      {STAGES.map(([stage, label]) => {
        const col = leads.filter((l) => l.stage === stage);
        return (
          <div
            key={stage}
            className={"kcol" + (over === stage ? " kover" : "")}
            onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => onDrop(stage, e)}
          >
            <h3>{label} · {col.length}</h3>
            {col.map((l) => (
              <div
                key={l.id}
                className="kcard kdrag"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/lead", l.id)}
              >
                <strong>{l.name}{temp(l.score) && <span title={`Score ${l.score} · ${temp(l.score)![1]}`} style={{ marginLeft: ".35rem", fontSize: ".85em" }}>{temp(l.score)![0]}</span>}</strong>
                <span>{l.property}</span><br />
                <span>{l.agent}</span>
                <div className="kcard-foot">
                  <em>{SOURCE[l.source] ?? l.source}</em>
                  <span className="kacts">
                    {l.phone && (
                      <a href={wa(l.phone, l.name)} target="_blank" rel="noopener" title="Chamar no WhatsApp"
                         onClick={(e) => e.stopPropagation()}>💬</a>
                    )}
                    <Link href={`/painel/leads/${l.id}`} title="Abrir ficha">↗</Link>
                  </span>
                </div>
              </div>
            ))}
            {col.length === 0 && <p className="kempty">Arraste leads para cá</p>}
          </div>
        );
      })}
    </div>
  );
}
