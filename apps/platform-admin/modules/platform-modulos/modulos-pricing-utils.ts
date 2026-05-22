export function centsToReaisInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

export function reaisInputToCents(value: string): number {
  const n = Number(value.replace(",", ".").replace(/[^\d.]/g, ""));
  return Math.round((Number.isFinite(n) ? n : 0) * 100);
}

/** Slug estável para id de plano/bundle (ex.: "Plano Pro" → "plano-pro"). */
export function normalizePricingId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
