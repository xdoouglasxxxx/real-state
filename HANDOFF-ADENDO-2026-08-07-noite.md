# HANDOFF — ADENDO 07/08/2026 (noite) — Auditoria via Claude Code

Anexar junto do HANDOFF.md principal na próxima sessão.

## O que aconteceu
Douglas instalou o **Claude Code** (VS Code/terminal) e conduziu uma auditoria
completa de segurança/qualidade com ele, sob supervisão desta frente.
**4 commits publicados** (main): `security` (C1,C2,H1-H4,M4) → `forms`
(M1,M2,M3,M5) → `fix: storage e documentos` (B1-B4,B6,B7,Q1,Q2) →
`feat: L1,L2,L3`. Zero mudança de schema, zero dependência nova.

## Correções relevantes para o mapa mental do código
- **C1 (IDOR real):** `saveProperty`/`deleteMany` de mídia agora validam tenant
  via findFirst antes de gravar — o buraco existia mesmo após a Onda 3.
- Auth: senha master em `timingSafeStringEqual`; **AUTH_SECRET agora é
  obrigatória em produção (throw)**; cookie `tenant_preview` httpOnly.
- Site público: `tourUrl` validado server-side; iframe do tour só renderiza
  hosts conhecidos (matterport/youtube/vimeo/kuula) com sandbox.
- Novos módulos: `src/lib/validators.ts` (isValidEmail) e `src/lib/doc-kinds.ts`
  (KIND_LABEL/DOC_KINDS únicos). `globals.css` ganhou `.span3`.
- storage.ts: `safeFileName` preserva extensão; deleteObject checa res.ok;
  actions de documentos redirecionam erro real; JuridicalDocs filtra por orgId.
- financeiro: toggleFinancePaid atômico (updateMany condicional).
- notify: logs sem PII (LGPD).

## REGRAS DE NEGÓCIO NOVAS (decididas e em produção)
1. **Rodízio v2:** corretor ATIVO do imóvel de interesse recebe o lead direto;
   rodízio é fallback. Timeline diferencia "corretor responsável pelo imóvel"
   × "rodízio". (`pickAgentRoundRobin(orgId, propertyId?)` em assign.ts)
2. **Lead de imóvel vendido/reservado:** vínculo preservado + nota automática
   "⚠ Imóvel já estava vendido/reservado..." (+ wantSimilar) + pill na ficha.
   Motor de similares = roadmap (Onda 5).
3. **Perfil do contato no lead manual:** BUYER/OWNER/BOTH (enum ContactKind
   real — não existe INVESTOR). Contato existente não é sobrescrito.

## Convenções novas de operação
- `CLAUDE.md` criado na raiz do repo — manual do Claude Code (regras
  inegociáveis, armadilhas, padrões de segurança, regras de negócio).
- Divisão de trabalho: Claude Code = fixes/auditoria/refactor local com
  aprovação diff a diff; sessões Claude.ai = módulos, arquitetura, banco, demo.
- Push sempre manual do Douglas. Commits longos: Write + `git commit -F`.
- Erro pré-existente conhecido: build local falha no Stripe por node_modules
  local (resolver com `npm install`); Vercel builda verde.

## Pendências que atravessam para a próxima sessão
- [ ] Douglas: push do commit 921f575 (L1-L3) + smoke test das 3 regras no demo
- [ ] Stripe: conta + env vars (STRIPE.md) · WhatsApp Meta · onboarding 5 clientes
- [ ] Próximas frentes (escolha): Onda 4.3 Contratos+assinatura digital ·
      Stripe ao vivo · domínio por tenant
- [ ] Radar do auditor: testes automatizados p/ actions (IDOR/race) — avaliar
      na Onda 6; motor de similares (infra pronta) — Onda 5
