import type { TipoNegocio } from "@boilerplate/shared";

/** Módulos adicionais por tipo de negócio (PRD §5.5 / matriz fase 1). */
export const PACOTES_POR_TIPO: Partial<Record<TipoNegocio, string[]>> = {
  pessoa_fisica: [],
  varejo: [
    "core-estoque-basico",
    "core-ranking",
    "fin-fluxo-caixa",
    "ops-vendedores",
    "rel-basico",
    "segment-moda",
  ],
  atacado: [],
  fornecedor: [],
  distribuidor: [],
  transportadora: [],
  fabricante: [],
  industria: [],
  produtor_rural: [],
};

/** Módulos ainda não implementados — geram `modulo_demanda`. */
export const MODULOS_PLANNED = new Set([
  "ops-tabela-preco",
  "ops-multi-depot",
  "ops-frota",
  "fin-contas-pagar",
]);
