/** Opção de resposta rápida no chat do Aprendiz. */
export type ChoiceOption = {
  value: string;
  label: string;
  /** Texto exibido ao tocar em "Saiba mais" (popover). */
  description?: string;
};
