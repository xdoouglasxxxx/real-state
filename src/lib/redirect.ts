/** redirect() do Next lança exceção de controle; se cair num catch, precisa ser relançada. */
export const rethrowRedirect = (e: unknown) => {
  if (e && typeof e === "object" && "digest" in e && String((e as any).digest).startsWith("NEXT_REDIRECT")) throw e;
};
