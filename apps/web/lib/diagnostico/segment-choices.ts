import type { ChoiceOption } from "@/lib/diagnostico/steps-shared";

const FALLBACK: ChoiceOption[] = [
  { value: "varejo", label: "Varejo" },
  { value: "alimentacao_food", label: "Alimentação / Food Service" },
  { value: "moda_vestuario", label: "Moda e Vestuário" },
  { value: "prestador_servicos", label: "Prestador de Serviços" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "agronegocio", label: "Agronegócio" },
  { value: "outros", label: "Outros" },
];

let cached: ChoiceOption[] = [...FALLBACK];

export function setMarketSegmentChoices(choices: ChoiceOption[]): void {
  cached = choices.length > 0 ? choices : FALLBACK;
}

export function getMarketSegmentChoices(): ChoiceOption[] {
  return cached;
}
