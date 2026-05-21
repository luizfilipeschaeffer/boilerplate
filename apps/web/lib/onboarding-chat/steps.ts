import type { DiagnosticoDraft } from "@/lib/diagnostico/draft";
import {
  knownFromCadastroSummary,
  wasAnsweredInCadastro,
} from "@/lib/diagnostico/draft";
import { TIPOS_NEGOCIO, VENDAS_MES_OPTIONS } from "@/lib/tipos-negocio";
import {
  applyDiagnosticoAnswer,
  formatDiagnosticoAnswer,
  type DiagnosticoStepId,
  type DiagnosticoStepDef,
  DIAGNOSTICO_STEP_IDS,
  getDiagnosticoStep,
} from "@/lib/diagnostico/steps-shared";

export type OnboardingStepId = "welcome" | DiagnosticoStepId | "summary";

export type OnboardingDraft = DiagnosticoDraft;

export type StepKind = "text" | "choices" | "info";

export type ChoiceOption = { value: string; label: string };

export type OnboardingStepDef = {
  id: OnboardingStepId;
  kind: StepKind;
  prompt: string | ((draft: OnboardingDraft) => string);
  placeholder?: string;
  choices?: ChoiceOption[] | ((draft: OnboardingDraft) => ChoiceOption[]);
  validate?: (value: string, draft: OnboardingDraft) => string | null;
  skip?: (draft: OnboardingDraft) => boolean;
  next: (draft: OnboardingDraft) => OnboardingStepId | null;
};

function firstName(name: string): string {
  const n = name.trim().split(/\s+/)[0];
  return n || "você";
}

const diagnosticoSteps: OnboardingStepDef[] = DIAGNOSTICO_STEP_IDS.map(
  (id) => {
    const base = getDiagnosticoStep(id);
    return {
      id,
      kind: base.kind as StepKind,
      prompt: base.prompt,
      placeholder: base.placeholder,
      choices: base.choices,
      validate: base.validate,
      skip: (draft: OnboardingDraft) => {
        if (base.skip?.(draft)) return true;
        return wasAnsweredInCadastro(draft, id);
      },
      next: (draft) => {
        const n = base.next(draft);
        if (!n) return "summary";
        return n;
      },
    };
  },
);

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: "welcome",
    kind: "info",
    prompt: (d) => {
      const known = knownFromCadastroSummary(d);
      if (known.length > 0) {
        return `Olá, ${firstName(d.name)}! No cadastro você já me contou sobre ${known.slice(0, 3).join(", ")}${known.length > 3 ? " e mais alguns detalhes" : ""}. Vou só completar o que falta para montar seu painel — pode ser rápido.`;
      }
      return `Olá, ${firstName(d.name)}! Sou o Aprendiz. Ainda não configurei seu negócio no painel — me conta um pouco sobre ele para eu personalizar tudo para você.`;
    },
    next: () => "orgName",
  },
  ...diagnosticoSteps,
  {
    id: "summary",
    kind: "info",
    prompt: (d) =>
      `Perfeito, ${firstName(d.name)}! Já sei o essencial sobre “${d.organizationName.trim()}”. Vou preparar seus módulos e te levar ao painel.`,
    next: () => null,
  },
];

export function getStep(id: OnboardingStepId): OnboardingStepDef {
  const step = ONBOARDING_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Step ${id} não encontrado`);
  return step;
}

export function formatUserAnswer(
  stepId: OnboardingStepId,
  value: string,
  draft: OnboardingDraft,
): string {
  if (stepId === "welcome" || stepId === "summary") return "";
  return formatDiagnosticoAnswer(stepId, value, draft);
}

export function applyAnswer(
  stepId: OnboardingStepId,
  value: string,
  draft: OnboardingDraft,
): OnboardingDraft {
  if (stepId === "welcome" || stepId === "summary") return draft;
  return applyDiagnosticoAnswer(stepId, value, draft);
}
