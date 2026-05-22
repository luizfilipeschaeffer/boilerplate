/**
 * Gera chave de idempotência no browser. `crypto.randomUUID` exige contexto
 * seguro (HTTPS ou localhost); em HTTP na LAN usamos fallback.
 */
export function createIdempotencyKey(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
