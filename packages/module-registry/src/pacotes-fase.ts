import type { Fase } from "@boilerplate/shared";

/** Pacote base por maturidade (PRD §6.4 — simplificado para MVP). */
export const PACOTES_POR_FASE: Record<Fase, string[]> = {
  1: [
    "core-catalogo",
    "core-clientes",
    "core-vendas",
    "fiscal-core",
    "aprendiz",
  ],
  2: [
    "core-catalogo",
    "core-clientes",
    "core-vendas",
    "core-estoque-basico",
    "core-ranking",
    "fiscal-core",
    "aprendiz",
  ],
  3: [
    "core-catalogo",
    "core-clientes",
    "core-vendas",
    "core-estoque-basico",
    "core-ranking",
    "fiscal-core",
    "aprendiz",
  ],
  4: [
    "core-catalogo",
    "core-clientes",
    "core-vendas",
    "core-estoque-basico",
    "core-ranking",
    "fiscal-core",
    "aprendiz",
  ],
};
