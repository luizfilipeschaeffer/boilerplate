export interface PrecoModulo {
  moduleId: string;
  precoMensalCentavos: number;
}

/** Tabela inicial — evoluir para DB */
export const TABELA_PRECOS: PrecoModulo[] = [
  { moduleId: "fiscal-nfce", precoMensalCentavos: 3500 },
  { moduleId: "fiscal-nfe", precoMensalCentavos: 4000 },
  { moduleId: "fiscal-cte", precoMensalCentavos: 4500 },
  { moduleId: "fiscal-sped", precoMensalCentavos: 3000 },
];

export function calcularMensalidade(modulosAtivos: string[]): number {
  return modulosAtivos.reduce((sum, id) => {
    const preco = TABELA_PRECOS.find((p) => p.moduleId === id);
    return sum + (preco?.precoMensalCentavos ?? 0);
  }, 0);
}
