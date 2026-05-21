/** Campos extras sugeridos por módulo de segmento (Fase 2). */
export type SegmentCatalogHint = {
  moduleId: string;
  label: string;
  fields: { key: string; label: string; placeholder?: string }[];
};

export const SEGMENT_CATALOG_HINTS: SegmentCatalogHint[] = [
  {
    moduleId: "segment-moda",
    label: "Moda",
    fields: [
      { key: "tamanho", label: "Tamanho", placeholder: "P, M, G…" },
      { key: "cor", label: "Cor", placeholder: "Azul, estampado…" },
      { key: "colecao", label: "Coleção", placeholder: "Verão 2026" },
    ],
  },
  {
    moduleId: "segment-alimentacao",
    label: "Alimentação",
    fields: [
      { key: "validade", label: "Validade", placeholder: "DD/MM/AAAA" },
      { key: "lote", label: "Lote", placeholder: "Lote interno" },
      { key: "unidade", label: "Unidade", placeholder: "kg, un, cx" },
    ],
  },
];

export function hintsForActiveModules(moduleIds: string[]): SegmentCatalogHint[] {
  const set = new Set(moduleIds);
  return SEGMENT_CATALOG_HINTS.filter((h) => set.has(h.moduleId));
}
