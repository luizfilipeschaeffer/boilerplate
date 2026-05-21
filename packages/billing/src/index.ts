export interface PrecoModulo {
  moduleId: string;
  precoMensalCentavos: number;
  faseMinima?: number;
  cobrancaAvulsa?: boolean;
}

/** Fallback estático quando DB indisponível (testes / SSR sem prisma) */
export const TABELA_PRECOS_FALLBACK: PrecoModulo[] = [
  { moduleId: "fiscal-nfce", precoMensalCentavos: 3500 },
  { moduleId: "fiscal-nfe", precoMensalCentavos: 4000 },
  { moduleId: "fiscal-cte", precoMensalCentavos: 4500 },
  { moduleId: "fiscal-sped", precoMensalCentavos: 3000 },
];

/** @deprecated use calcularMensalidadeFromDb em @boilerplate/db */
export const TABELA_PRECOS = TABELA_PRECOS_FALLBACK;

export function calcularMensalidade(
  modulosAtivos: string[],
  tabela: PrecoModulo[] = TABELA_PRECOS_FALLBACK,
): number {
  return modulosAtivos.reduce((sum, id) => {
    const preco = tabela.find((p) => p.moduleId === id);
    return sum + (preco?.precoMensalCentavos ?? 0);
  }, 0);
}

export function formatCentavosBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
