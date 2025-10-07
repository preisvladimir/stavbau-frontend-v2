/** Ořeže řetězec; prázdný → undefined. */
export const trimToUndef = (v?: string | null): string | undefined => {
  const t = (v ?? "").trim();
  return t ? t : undefined;
};