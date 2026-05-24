export function toClientError(err: unknown): string {
  if (process.env.NODE_ENV === "production") {
    if (err instanceof Error && err.name === "EnvelopeDecryptError") {
      return "Credencial indisponível.";
    }
    return "Erro interno.";
  }
  if (err instanceof Error) return err.message;
  return "Erro interno.";
}

export function logServerError(scope: string, err: unknown, meta?: Record<string, unknown>): void {
  console.error(`[${scope}]`, {
    ...meta,
    err: err instanceof Error ? { name: err.name, message: err.message } : err,
  });
}
