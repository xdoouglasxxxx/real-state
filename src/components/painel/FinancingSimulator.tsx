"use client";
import { useState } from "react";
import { MCMV_TETO_IMOVEL, ITBI_PCT, ESCRITURA_REGISTRO_PCT } from "@/lib/financing";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Simulador de financiamento — cálculo local (Price e SAC), sem API externa.
 *  Ferramenta de conversa do corretor com o cliente; não é proposta de crédito. */
export default function FinancingSimulator({ price }: { price: number }) {
  const [valor, setValor] = useState(Math.round(price));
  const [entradaPct, setEntradaPct] = useState(20);
  const [fgts, setFgts] = useState(0);
  const [taxaAA, setTaxaAA] = useState(11.5);
  const [anos, setAnos] = useState(30);

  const entradaBase = valor * (entradaPct / 100);
  const entradaTotal = entradaBase + fgts;
  const financiado = Math.max(0, valor - entradaTotal);
  const n = Math.max(1, anos * 12);
  const i = Math.pow(1 + taxaAA / 100, 1 / 12) - 1; // taxa efetiva mensal

  // PRICE: parcela fixa
  const price1 = i > 0 ? (financiado * i) / (1 - Math.pow(1 + i, -n)) : financiado / n;
  // SAC: amortização constante — primeira e última parcelas
  const amort = financiado / n;
  const sacFirst = amort + financiado * i;
  const sacLast  = amort + amort * i;
  // renda mínima: pior caso entre Price e 1ª SAC (regra dos 30%)
  const rendaMin = Math.max(price1, sacFirst) / 0.3;

  // custos de aquisição (ITBI + escritura + registro)
  const custos = valor * (ITBI_PCT + ESCRITURA_REGISTRO_PCT);
  const investimentoTotal = entradaTotal + custos;

  const mcmv = valor <= MCMV_TETO_IMOVEL;

  const Field = ({ label, value, onChange, suffix, step = 1, min = 0 }: any) => (
    <label>{label}
      <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
        <input type="number" value={value} step={step} min={min}
          onChange={(e) => onChange(Number(e.target.value) || 0)} />
        {suffix && <span style={{ color: "var(--stone)", fontSize: ".85rem" }}>{suffix}</span>}
      </div>
    </label>
  );

  return (
    <section className="ficha-box" style={{ marginTop: "1.4rem" }}>
      <h2>🏦 Simulador de financiamento</h2>
      <div className="pgrid" style={{ marginBottom: "1rem" }}>
        <Field label="Valor do imóvel" value={valor} onChange={setValor} step={10000} />
        <Field label="Entrada" value={entradaPct} onChange={setEntradaPct} suffix="%" step={5} />
        <Field label="FGTS (R$)" value={fgts} onChange={setFgts} step={5000} />
        <Field label="Juros ao ano" value={taxaAA} onChange={setTaxaAA} suffix="% a.a." step={0.5} />
        <Field label="Prazo" value={anos} onChange={setAnos} suffix="anos" step={5} min={1} />
      </div>

      <div className="kpis" style={{ marginBottom: ".6rem" }}>
        <div className="kpi">
          <strong>{fmt(entradaTotal)}</strong>
          <span>entrada total{fgts > 0 ? ` (${entradaPct}% + FGTS ${fmt(fgts)})` : ` (${entradaPct}%)`}</span>
        </div>
        <div className="kpi"><strong>{fmt(financiado)}</strong><span>valor financiado</span></div>
        <div className="kpi"><strong>{fmt(price1)}</strong><span>parcela fixa (Price) · {n}x</span></div>
        <div className="kpi"><strong>{fmt(sacFirst)}</strong><span>1ª parcela (SAC) · cai até {fmt(sacLast)}</span></div>
        <div className="kpi"><strong>{fmt(rendaMin)}</strong><span>renda familiar mínima (pior caso · 30%)</span></div>
      </div>

      <div className="kpis" style={{ marginBottom: ".8rem" }}>
        <div className="kpi">
          <strong>{fmt(custos)}</strong>
          <span>custos de cartório e impostos (ITBI ~3% + escritura + registro ~1,5%)</span>
        </div>
        <div className="kpi">
          <strong>{fmt(investimentoTotal)}</strong>
          <span>investimento total estimado (entrada + custos)</span>
        </div>
      </div>

      {mcmv && (
        <p className="pform-hint" style={{ marginBottom: ".8rem" }}>
          💡 Este imóvel pode se enquadrar no Minha Casa Minha Vida — juros reduzidos e
          possibilidade de subsídio conforme a faixa de renda familiar. Simule as condições
          oficiais com o correspondente/banco.
        </p>
      )}

      <p style={{ color: "var(--stone)", fontSize: ".78rem" }}>
        Simulação aproximada para conversa com o cliente (não inclui seguros e taxas do banco;
        não é proposta de crédito). Custos de cartório e impostos variam por município —
        imóveis no MCMV costumam ter redução. Ajuste a taxa conforme o banco do dia.
      </p>
    </section>
  );
}
