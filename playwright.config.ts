import { defineConfig } from "@playwright/test";

/** E2E — Imobiliária OS.
 *  Rodar:  npx playwright test --headed   (para VER o robô)
 *  Alvo:   BASE_URL (padrão: produção no domínio raiz). */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "https://maisonstate.vercel.app",
    ignoreHTTPSErrors: true, // sub-subdomínios .vercel.app não têm cert válido
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "pt-BR",
  },
});
