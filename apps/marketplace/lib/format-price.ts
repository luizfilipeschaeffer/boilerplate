export function formatPrice(cents: number | null): string {
  if (cents === null) return "Sob consulta";
  if (cents === 0) return "Incluso";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
