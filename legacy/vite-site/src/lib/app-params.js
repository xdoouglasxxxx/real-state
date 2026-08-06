/* Parâmetros do app — usados apenas quando conectado ao Base44 real. */
export const appParams = {
  appId: import.meta.env.VITE_BASE44_APP_ID ?? "",
  token: import.meta.env.VITE_BASE44_TOKEN ?? "",
  functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION ?? "",
  appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL ?? "",
};
