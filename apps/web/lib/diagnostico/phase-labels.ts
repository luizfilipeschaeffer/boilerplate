import { classificarFase } from "@boilerplate/module-registry";
import type { ChoiceOption } from "@/lib/chat/choice-option";
import type { DiagnosticoDraft } from "@/lib/diagnostico/draft";
import { draftToDiagnosticoInput } from "@/lib/diagnostico/draft";

export const FASE_DEFINITIONS = [
  {
    phase: 1,
    value: "1",
    label: "P1 — Começando",
    description:
      "Negócio informal ou em arranque: pouca estrutura, vendas menores, sem nota fiscal ou equipe reduzida.",
  },
  {
    phase: 2,
    value: "2",
    label: "P2 — Crescendo",
    description:
      "Já vende com regularidade, pode ter ponto ou equipe pequena. Precisa organizar processos e acompanhar resultados.",
  },
  {
    phase: 3,
    value: "3",
    label: "P3 — Estabelecido",
    description:
      "Operação estável: equipe, controle de vendas e emissão de nota. Foco em gestão, fiscal e eficiência.",
  },
  {
    phase: 4,
    value: "4",
    label: "P4 — Em escala",
    description:
      "Alto volume e estrutura madura. Prioridade em automação, integrações e operação em grande escala.",
  },
] as const;

export const FASE_OPTIONS: ChoiceOption[] = FASE_DEFINITIONS.map((f) => ({
  value: f.value,
  label: f.label,
  description: f.description,
}));

export function getFaseDefinition(phase: number) {
  return FASE_DEFINITIONS.find((f) => f.phase === phase);
}

export function computeDiagnosedPhase(draft: DiagnosticoDraft): number {
  return classificarFase(draftToDiagnosticoInput(draft));
}

export function resolveDeclaredPhase(draft: DiagnosticoDraft): number {
  if (draft.declaredPhase != null) return draft.declaredPhase;
  return computeDiagnosedPhase(draft);
}

export function faseEscolhidaPrompt(draft: DiagnosticoDraft): string {
  const fase = draft.diagnosedPhase ?? computeDiagnosedPhase(draft);
  const def = getFaseDefinition(fase);
  const nome = def?.label ?? `P${fase}`;
  return `Sugiro a fase **${nome}** para o seu negócio. Qual fase descreve melhor você hoje?`;
}
