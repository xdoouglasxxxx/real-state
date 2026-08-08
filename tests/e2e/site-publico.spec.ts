import { test, expect } from "@playwright/test";

/** E2E 01 — Jornada pública do visitante (roda sem credenciais).
 *  O robô: abre o site → escolhe um imóvel → preenche o formulário de visita
 *  (marcando o consentimento LGPD) → confere a confirmação.
 *  Rode com --headed para assistir. Cria 1 lead real "E2E Robô" no tenant do
 *  domínio raiz — útil depois para conferir score/rodízio na ficha. */

test.describe("Site público", () => {
  test("home carrega com vitrine", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/./); // tem título
    // pelo menos um card de imóvel clicável na vitrine
    // (não usar texto "R$": o select de filtro tem options ocultas com R$ que enganam o .first())
    await expect(page.locator('a[href^="/imovel/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test("visitante agenda visita em um imóvel (com consentimento LGPD)", async ({ page }) => {
    // 1. Vitrine
    await page.goto("/imoveis");
    const firstCard = page.locator('a[href^="/imovel/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    // 2. Página do imóvel
    await expect(page).toHaveURL(/\/imovel\//);
    await expect(page.locator("text=/R\\$/").first()).toBeVisible();

    // 3. Formulário de visita
    const form = page.locator("form", { has: page.locator('input[name="name"]') }).first();
    await form.scrollIntoViewIfNeeded();
    await form.locator('input[name="name"]').fill("E2E Robô Playwright");
    await form.locator('input[name="phone"]').fill("11955550101");
    const msg = form.locator('textarea[name="message"], input[name="message"]');
    if (await msg.count()) await msg.first().fill("Teste automatizado E2E — pode desconsiderar este lead.");

    // 4. Consentimento LGPD (obrigatório desde a Onda 4.5)
    const consent = form.locator('input[type="checkbox"]').first();
    await expect(consent, "checkbox de consentimento LGPD deve existir no form").toBeVisible();
    await consent.check();

    // 5. Envia e confere a confirmação (?enviado=1 ou mensagem de sucesso)
    await form.locator('button[type="submit"]').click();
    await page.waitForURL(/enviado=1|obrigado/i, { timeout: 20000 }).catch(() => {});
    const success = page.locator("text=/recebemos|enviado|obrigado|em breve/i").first();
    const urlOk = /enviado=1/.test(page.url());
    expect(urlOk || (await success.isVisible().catch(() => false)),
      "após enviar, deve haver confirmação (?enviado=1 ou mensagem)").toBeTruthy();
  });

  test("formulário NÃO envia sem o consentimento LGPD", async ({ page }) => {
    await page.goto("/imoveis");
    await page.locator('a[href^="/imovel/"]').first().click();
    const form = page.locator("form", { has: page.locator('input[name="name"]') }).first();
    await form.locator('input[name="name"]').fill("E2E Sem Consentimento");
    await form.locator('input[name="phone"]').fill("11955550102");
    await form.locator('button[type="submit"]').click();
    // o checkbox required segura o submit: continuamos na página do imóvel, sem ?enviado=1
    await page.waitForTimeout(1500);
    expect(page.url()).not.toMatch(/enviado=1/);
  });

  test("login com senha errada é recusado", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"], input[name="email"], input[name="user"]').first().fill("robo@e2e.test");
    await page.locator('input[type="password"]').first().fill("senha-errada-de-proposito");
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    // não pode ter entrado no painel
    expect(page.url()).not.toMatch(/\/painel/);
  });
});

/** E2E 02 — Jornada logada (exemplo, desativada por padrão).
 *  Para ativar: defina as envs E2E_EMAIL e E2E_PASS (um usuário do tenant demo)
 *  e remova o .skip — o robô loga, abre o lead recém-criado e confere o score. */
test.describe.skip("Painel (exige credenciais via env)", () => {
  test("lead do robô nasceu com score por regras", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(process.env.E2E_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.E2E_PASS!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/painel/);
    await page.goto("/painel/leads");
    await page.locator("text=E2E Robô Playwright").first().click();
    // score inicial por regras: não pode ser "FRIO · 0"
    await expect(page.locator("text=/FRIO · 0/")).toHaveCount(0);
  });
});
