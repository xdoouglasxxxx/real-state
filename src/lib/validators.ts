/** Helper de validação reutilizável — importável de server actions e pages. */

/** E-mail razoável: local@domain.tld (não implementa RFC-5321 completa, exclui os casos absurdos). */
export const isValidEmail = (e: string): boolean =>
  /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(e);
