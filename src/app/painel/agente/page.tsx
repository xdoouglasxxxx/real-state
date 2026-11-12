import type { Metadata } from "next";
import Link from "next/link";
import { requirePanel } from "@/lib/perm";
import { prisma } from "@/lib/prisma";
import { getAgentDay, type AgentDay, type Suggestion } from "@/lib/agent-day";
import { toggleTask } from "../leads/actions";
import { resolveSuggestionAction } from "./actions";
import styles from "@/components/painel/AgentDay.module.css";

export const metadata: Metadata = { title: "Agente do dia" };
export const dynamic = "force-dynamic";

const FEEDBACK: Record<string, { ok: boolean; text: string }> = {
  "1": { ok: true, text: "✔ Registrado na timeline do lead — a sugestão some por alguns dias." },
  dup: { ok: true, text: "Isso já estava registrado — nada foi duplicado." },
  erro: { ok: false, text: "Não foi possível registrar agora. Tente de novo." },
};

function Card({ s }: { s: Suggestion }) {
  const canResolve = !!s.leadId && !!s.entityId && (s.kind === "lead_frio" || s.kind === "contrato" || s.kind === "visita");
  const resolveBtn = (outcome: "done" | "dismiss", label: string, cls: string) => (
    <form action={resolveSuggestionAction}>
      <input type="hidden" name="kind" value={s.kind} />
      <input type="hidden" name="entityId" value={s.entityId ?? ""} />
      <input type="hidden" name="leadId" value={s.leadId ?? ""} />
      <input type="hidden" name="outcome" value={outcome} />
      <button type="submit" className={cls}>{label}</button>
    </form>
  );
  return (
    <section className={styles.card} aria-label={s.title}>
      <span className={styles.tag}>{s.tag}</span>
      <h2 className={styles.title}>{s.title}</h2>
      <p className={styles.why}>{s.why}</p>
      {s.draft && (
        <details className={styles.draft}>
          <summary>Ver rascunho da mensagem</summary>
          <p>{s.draft}</p>
        </details>
      )}
      <div className={styles.actions}>
        {s.wa && <a className={`btn-solid ${styles.small}`} href={s.wa} target="_blank" rel="noopener noreferrer">Abrir no WhatsApp</a>}
        {s.draft && !s.wa && <span className={styles.nophone}>Sem telefone válido no cadastro — copie o rascunho.</span>}
        {s.href && <Link className={`btn-outline ${styles.small}`} href={s.href}>{s.hrefLabel}</Link>}
        {canResolve && resolveBtn("done", "Marcar como feito", `btn-outline ${styles.small}`)}
        {canResolve && resolveBtn("dismiss", "Dispensar", styles.quiet)}
      </div>
    </section>
  );
}

export default async function AgenteDoDia({ searchParams }: { searchParams: { feito?: string } }) {
  const ctx = await requirePanel();
  let day: AgentDay | null = null;
  if (process.env.DATABASE_URL) {
    day = await getAgentDay(prisma, ctx.org.id, { agentId: ctx.agentId, isAgent: ctx.isAgent }, ctx.org.name)
      .catch((e) => { console.error("agente do dia:", e); return null; });
  }
  const fb = searchParams.feito ? FEEDBACK[searchParams.feito] : undefined;
  const unlinked = ctx.isAgent && !ctx.agentId; // corretor sem perfil vinculado: o aviso explica, e "tudo em dia" seria enganoso
  const empty = !unlinked && !!day && day.suggestions.length === 0 && day.tasks.length === 0;

  return (
    <>
      <div className="phead"><h1>Agente do dia</h1></div>
      <p className={styles.intro}>
        {ctx.isAgent ? "As sugestões de hoje para os seus leads, visitas e imóveis. " : "As sugestões de hoje para a imobiliária. "}
        Elas vêm dos dados do sistema, por regras. <strong>Nada é enviado sozinho:</strong> você lê o rascunho e envia pelo WhatsApp.
      </p>

      {unlinked && (
        <p className="pform-error">Seu usuário ainda não está vinculado a um perfil de corretor — peça ao administrador (Usuários → seu cadastro).</p>
      )}
      {fb && <p className={fb.ok ? "ok" : "pform-error"} style={{ marginBottom: "1rem" }}>{fb.text}</p>}
      {!day && <p className="pform-error">{process.env.DATABASE_URL ? "Não foi possível carregar as sugestões agora. Tente de novo em instantes." : "Modo demonstração: conecte o banco para ver as sugestões."}</p>}
      {empty && <p className={styles.empty}>Tudo em dia por hoje: nenhum contrato parado, lead esfriando, visita de amanhã ou tarefa vencida. 🎉</p>}

      {day && day.suggestions.length > 0 && (
        <div className={styles.list}>
          {day.suggestions.map((s) => <Card key={s.key} s={s} />)}
        </div>
      )}
      {day && day.coldTotal > day.coldShown && (
        <p className={styles.more}>Mostrando {day.coldShown} de {day.coldTotal} leads esfriando — os mais antigos primeiro. Resolva alguns e os próximos entram.</p>
      )}

      {day && day.tasks.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Tarefas de hoje e atrasadas</h2>
          <ul className={styles.tasks}>
            {day.tasks.map((t) => (
              <li key={t.id} className={styles.task}>
                <form action={toggleTask}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="back" value="agente" />
                  <button type="submit" className="panel-link" style={{ padding: 0 }} title="Concluir tarefa">☐</button>
                </form>
                <span>
                  {t.title}{t.contactName ? <> — <Link href={`/painel/leads/${t.leadId}`} style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>{t.contactName}</Link></> : null}
                  <span className={t.overdue ? styles.late : undefined} style={t.overdue ? undefined : { color: "var(--stone)" }}>
                    {" "}· {new Date(t.dueAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}{t.overdue ? " · atrasada" : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {day && (
        <p className={styles.foot}>
          Regras: contrato aguardando assinatura há 5+ dias · lead novo/contatado sem movimento há 72h+ · visitas de amanhã (horário de Brasília) ·
          imóvel disponível há 90+ dias sem visita · tarefas vencidas ou de hoje.
          {day.hiddenCount > 0 ? ` ${day.hiddenCount} ${day.hiddenCount === 1 ? "sugestão já resolvida está escondida" : "sugestões já resolvidas estão escondidas"} por alguns dias.` : ""}
        </p>
      )}
    </>
  );
}
