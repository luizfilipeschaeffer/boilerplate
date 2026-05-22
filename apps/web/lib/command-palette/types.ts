export type CommandPaletteItem = {
  id: string;
  group: string;
  label: string;
  description?: string;
  href: string;
  /** Texto usado pelo cmdk para filtrar (label + palavras-chave). */
  keywords: string;
};
