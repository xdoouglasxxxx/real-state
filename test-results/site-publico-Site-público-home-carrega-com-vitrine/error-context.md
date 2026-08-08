# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: site-publico.spec.ts >> Site público >> home carrega com vitrine
- Location: tests\e2e\site-publico.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('text=/R\\$\\s?[\\d.,]+/').first()
Expected: visible
Received: hidden
Timeout:  15000ms

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('text=/R\\$\\s?[\\d.,]+/').first()
    33 × locator resolved to <option value="0-1000000">Até R$ 1 mi</option>
       - unexpected value "hidden"

```

```yaml
- navigation:
  - link "MAISON PRIME IMÓVEIS":
    - /url: /
    - text: MAISON
    - emphasis: PRIME IMÓVEIS
  - link "Imóveis":
    - /url: /imoveis
  - link "Vender":
    - /url: /vender
  - link "Sobre":
    - /url: /sobre
  - link "Blog":
    - /url: /blog
  - link "Entrar":
    - /url: /login
  - link "Ver imóveis":
    - /url: /imoveis
- main:
  - paragraph: Maison Prime Imóveis · Imóveis de alto padrão
  - heading "Bem-vindo ao seu próximo lar" [level=1]:
    - text: Bem-vindo ao seu
    - emphasis: próximo
    - text: lar
  - text: Eu quero comprar
  - combobox "Tipo de imóvel":
    - option "qualquer imóvel" [selected]
    - option "Casa"
    - option "Apartamento"
  - text: em
  - combobox "Região":
    - option "todas as regiões" [selected]
    - option "Paraíso"
    - option "Alto de Pinheiros"
    - option "Vila Mariana"
    - option "Brooklin"
    - option "Vila Madalena"
    - option "Jardins"
    - option "Granja Viana"
    - option "Morumbi"
    - option "Campo Belo"
    - option "Moema"
    - option "Interior de SP — Itu"
    - option "Higienópolis"
    - option "Perdizes"
    - option "Pinheiros"
    - option "Alphaville"
    - option "Vila Nova Conceição"
    - option "Itaim Bibi"
  - text: por
  - combobox "Faixa de preço":
    - option "Qualquer preço" [selected]
    - option "Até R$ 1 mi"
    - option "R$ 1 – 3 mi"
    - option "R$ 3 – 6 mi"
    - option "Acima de R$ 6 mi"
  - button "Buscar imóveis"
  - paragraph: Seleção da semana
  - heading "Imóveis em destaque" [level=2]:
    - text: Imóveis em
    - emphasis: destaque
  - link "Jardim Atelier À venda Jardins · São Paulo Jardim Atelier R$ 8.070.000 3 quartos · 3 banheiros · 375 m²":
    - /url: /imovel/jardim-atelier-43
    - img "Jardim Atelier"
    - text: À venda
    - paragraph: Jardins · São Paulo
    - heading "Jardim Atelier" [level=3]
    - paragraph: R$ 8.070.000
    - paragraph: 3 quartos · 3 banheiros · 375 m²
  - link "Casa Central À venda Jardins · São Paulo Casa Central R$ 2.750.000 4 quartos · 4 banheiros · 126 m²":
    - /url: /imovel/casa-central-22
    - img "Casa Central"
    - text: À venda
    - paragraph: Jardins · São Paulo
    - heading "Casa Central" [level=3]
    - paragraph: R$ 2.750.000
    - paragraph: 4 quartos · 4 banheiros · 126 m²
  - link "Edifício Toscana À venda Pinheiros · São Paulo Edifício Toscana R$ 3.130.000 4 quartos · 3 banheiros · 203 m²":
    - /url: /imovel/edificio-toscana-56
    - img "Edifício Toscana"
    - text: À venda
    - paragraph: Pinheiros · São Paulo
    - heading "Edifício Toscana" [level=3]
    - paragraph: R$ 3.130.000
    - paragraph: 4 quartos · 3 banheiros · 203 m²
  - link "Ver todos os imóveis":
    - /url: /imoveis
  - paragraph: Especialistas de bairro
  - heading "Conhecemos cada esquina" [level=2]:
    - text: Conhecemos cada
    - emphasis: esquina
  - link "Jardins Jardins Clássico e arborizado":
    - /url: /imoveis?location=Jardins
    - img "Jardins"
    - heading "Jardins" [level=3]
    - text: Clássico e arborizado
  - link "Itaim Bibi Itaim Bibi Skyline e conveniência":
    - /url: /imoveis?location=Itaim%20Bibi
    - img "Itaim Bibi"
    - heading "Itaim Bibi" [level=3]
    - text: Skyline e conveniência
  - link "Alphaville Alphaville Espaço e privacidade":
    - /url: /imoveis?location=Alphaville
    - img "Alphaville"
    - heading "Alphaville" [level=3]
    - text: Espaço e privacidade
  - link "Riviera de São Lourenço Riviera de São Lourenço Pé na areia":
    - /url: /imoveis?location=Riviera%20de%20S%C3%A3o%20Louren%C3%A7o
    - img "Riviera de São Lourenço"
    - heading "Riviera de São Lourenço" [level=3]
    - text: Pé na areia
  - paragraph: Como trabalhamos
  - heading "Serviço completo, do começo ao fim" [level=2]:
    - text: Serviço completo,
    - emphasis: do começo ao fim
  - heading "Compra assessorada" [level=3]
  - paragraph: Curadoria de imóveis dentro do seu perfil, visitas acompanhadas e negociação em seu nome.
  - heading "Venda estratégica" [level=3]
  - paragraph: Precificação por análise comparativa, produção visual profissional e divulgação segmentada.
  - heading "Avaliação de mercado" [level=3]
  - paragraph: Estudo de valor em 48 h com base em transações reais da região — sem custo.
  - heading "Assessoria jurídica" [level=3]
  - paragraph: Due diligence, contratos e escritura conduzidos por equipe própria, do início ao fim.
  - strong: 14 anos
  - text: de mercado
  - strong: R$ 2,1 bi
  - text: em vendas
  - strong: 640+
  - text: famílias atendidas
  - strong: 31 dias
  - text: tempo médio de venda
  - paragraph: Quem atende você
  - heading "Nossa equipe" [level=2]:
    - text: Nossa
    - emphasis: equipe
  - article:
    - img "Flávia Prado"
    - heading "Flávia Prado" [level=3]
    - paragraph: CRECI 151.856
    - text: (11) 98100-9415
  - article:
    - img "Bianca Oliveira"
    - heading "Bianca Oliveira" [level=3]
    - paragraph: CRECI 156.636
    - text: (11) 97943-8442
  - article:
    - img "Isabela Pereira"
    - heading "Isabela Pereira" [level=3]
    - paragraph: CRECI 127.285
    - text: (11) 99482-8427
  - article:
    - img "Vinícius Rezende"
    - heading "Vinícius Rezende" [level=3]
    - paragraph: CRECI 183.448
    - text: (11) 97812-3383
  - article:
    - img "Mariana Castro"
    - heading "Mariana Castro" [level=3]
    - paragraph: CRECI 178.262
    - text: (11) 96283-1416
  - article:
    - img "Sérgio Dias"
    - heading "Sérgio Dias" [level=3]
    - paragraph: CRECI 108.551
    - text: (11) 96197-4605
  - article:
    - img "Rafael Campos"
    - heading "Rafael Campos" [level=3]
    - paragraph: CRECI 142.877
    - text: (11) 97050-3371
  - article:
    - img "Renata Lima"
    - heading "Renata Lima" [level=3]
    - paragraph: CRECI 126.628
    - text: (11) 98253-9175
  - article:
    - img "Camila Queiroz"
    - heading "Camila Queiroz" [level=3]
    - paragraph: CRECI 148.879
    - text: (11) 98526-7885
  - article:
    - img "Marcelo Esteves"
    - heading "Marcelo Esteves" [level=3]
    - paragraph: CRECI 164.385
    - text: (11) 99506-3348
  - article:
    - img "Lucas Oliveira"
    - heading "Lucas Oliveira" [level=3]
    - paragraph: CRECI 182.661
    - text: (11) 98188-4286
  - article:
    - img "Paulo Lima"
    - heading "Paulo Lima" [level=3]
    - paragraph: CRECI 153.474
    - text: (11) 99598-4877
  - article:
    - img "Camila Machado"
    - heading "Camila Machado" [level=3]
    - paragraph: CRECI 169.285
    - text: (11) 97668-3456
  - article:
    - img "Débora Dias"
    - heading "Débora Dias" [level=3]
    - paragraph: CRECI 107.574
    - text: (11) 99786-5470
  - article:
    - img "Bruno Souza"
    - heading "Bruno Souza" [level=3]
    - paragraph: CRECI 185.183
    - text: (11) 97428-5451
  - article:
    - img "Corretor2026"
    - heading "Corretor2026" [level=3]
    - paragraph
  - article:
    - img "teste"
    - heading "teste" [level=3]
    - paragraph: teste
    - text: teste
  - article:
    - img "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    - heading "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" [level=3]
    - paragraph
  - article:
    - img "teste"
    - heading "teste" [level=3]
    - paragraph
  - heading "Pensando em vender?" [level=2]:
    - text: Pensando em
    - emphasis: vender
    - text: "?"
  - paragraph: Avaliamos seu imóvel sem custo e apresentamos um plano de venda em até 48 horas.
  - link "Solicitar avaliação":
    - /url: /vender
  - img "Casa moderna de madeira e pedra com piscina ao entardecer"
- contentinfo:
  - link "MAISON PRIME IMÓVEIS":
    - /url: /
    - text: MAISON
    - emphasis: PRIME IMÓVEIS
  - link "Imóveis":
    - /url: /imoveis
  - link "Vender":
    - /url: /vender
  - link "Sobre":
    - /url: /sobre
  - link "Blog":
    - /url: /blog
  - link "Privacidade":
    - /url: /privacidade
  - link "Termos":
    - /url: /termos
  - link "Acessibilidade":
    - /url: /acessibilidade
  - link "Entrar":
    - /url: /login
  - text: © 2026 Maison Prime Imóveis · CRECI-SP 31.744-J (11) 4004-8899
  - link "Para imobiliárias — crie o seu site como este →":
    - /url: /criar
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | /** E2E 01 — Jornada pública do visitante (roda sem credenciais).
  4  |  *  O robô: abre o site → escolhe um imóvel → preenche o formulário de visita
  5  |  *  (marcando o consentimento LGPD) → confere a confirmação.
  6  |  *  Rode com --headed para assistir. Cria 1 lead real "E2E Robô" no tenant do
  7  |  *  domínio raiz — útil depois para conferir score/rodízio na ficha. */
  8  | 
  9  | test.describe("Site público", () => {
  10 |   test("home carrega com vitrine", async ({ page }) => {
  11 |     await page.goto("/");
  12 |     await expect(page).toHaveTitle(/./); // tem título
  13 |     // pelo menos um card de imóvel com preço em R$
> 14 |     await expect(page.locator("text=/R\\$\\s?[\\d.,]+/").first()).toBeVisible({ timeout: 15000 });
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  15 |   });
  16 | 
  17 |   test("visitante agenda visita em um imóvel (com consentimento LGPD)", async ({ page }) => {
  18 |     // 1. Vitrine
  19 |     await page.goto("/imoveis");
  20 |     const firstCard = page.locator('a[href^="/imovel/"]').first();
  21 |     await expect(firstCard).toBeVisible({ timeout: 15000 });
  22 |     await firstCard.click();
  23 | 
  24 |     // 2. Página do imóvel
  25 |     await expect(page).toHaveURL(/\/imovel\//);
  26 |     await expect(page.locator("text=/R\\$/").first()).toBeVisible();
  27 | 
  28 |     // 3. Formulário de visita
  29 |     const form = page.locator("form", { has: page.locator('input[name="name"]') }).first();
  30 |     await form.scrollIntoViewIfNeeded();
  31 |     await form.locator('input[name="name"]').fill("E2E Robô Playwright");
  32 |     await form.locator('input[name="phone"]').fill("11955550101");
  33 |     const msg = form.locator('textarea[name="message"], input[name="message"]');
  34 |     if (await msg.count()) await msg.first().fill("Teste automatizado E2E — pode desconsiderar este lead.");
  35 | 
  36 |     // 4. Consentimento LGPD (obrigatório desde a Onda 4.5)
  37 |     const consent = form.locator('input[type="checkbox"]').first();
  38 |     await expect(consent, "checkbox de consentimento LGPD deve existir no form").toBeVisible();
  39 |     await consent.check();
  40 | 
  41 |     // 5. Envia e confere a confirmação (?enviado=1 ou mensagem de sucesso)
  42 |     await form.locator('button[type="submit"]').click();
  43 |     await page.waitForURL(/enviado=1|obrigado/i, { timeout: 20000 }).catch(() => {});
  44 |     const success = page.locator("text=/recebemos|enviado|obrigado|em breve/i").first();
  45 |     const urlOk = /enviado=1/.test(page.url());
  46 |     expect(urlOk || (await success.isVisible().catch(() => false)),
  47 |       "após enviar, deve haver confirmação (?enviado=1 ou mensagem)").toBeTruthy();
  48 |   });
  49 | 
  50 |   test("formulário NÃO envia sem o consentimento LGPD", async ({ page }) => {
  51 |     await page.goto("/imoveis");
  52 |     await page.locator('a[href^="/imovel/"]').first().click();
  53 |     const form = page.locator("form", { has: page.locator('input[name="name"]') }).first();
  54 |     await form.locator('input[name="name"]').fill("E2E Sem Consentimento");
  55 |     await form.locator('input[name="phone"]').fill("11955550102");
  56 |     await form.locator('button[type="submit"]').click();
  57 |     // o checkbox required segura o submit: continuamos na página do imóvel, sem ?enviado=1
  58 |     await page.waitForTimeout(1500);
  59 |     expect(page.url()).not.toMatch(/enviado=1/);
  60 |   });
  61 | 
  62 |   test("login com senha errada é recusado", async ({ page }) => {
  63 |     await page.goto("/login");
  64 |     await page.locator('input[type="email"], input[name="email"], input[name="user"]').first().fill("robo@e2e.test");
  65 |     await page.locator('input[type="password"]').first().fill("senha-errada-de-proposito");
  66 |     await page.locator('button[type="submit"]').first().click();
  67 |     await page.waitForTimeout(2000);
  68 |     // não pode ter entrado no painel
  69 |     expect(page.url()).not.toMatch(/\/painel/);
  70 |   });
  71 | });
  72 | 
  73 | /** E2E 02 — Jornada logada (exemplo, desativada por padrão).
  74 |  *  Para ativar: defina as envs E2E_EMAIL e E2E_PASS (um usuário do tenant demo)
  75 |  *  e remova o .skip — o robô loga, abre o lead recém-criado e confere o score. */
  76 | test.describe.skip("Painel (exige credenciais via env)", () => {
  77 |   test("lead do robô nasceu com score por regras", async ({ page }) => {
  78 |     await page.goto("/login");
  79 |     await page.locator('input[type="email"]').fill(process.env.E2E_EMAIL!);
  80 |     await page.locator('input[type="password"]').fill(process.env.E2E_PASS!);
  81 |     await page.locator('button[type="submit"]').click();
  82 |     await page.waitForURL(/\/painel/);
  83 |     await page.goto("/painel/leads");
  84 |     await page.locator("text=E2E Robô Playwright").first().click();
  85 |     // score inicial por regras: não pode ser "FRIO · 0"
  86 |     await expect(page.locator("text=/FRIO · 0/")).toHaveCount(0);
  87 |   });
  88 | });
  89 | 
```