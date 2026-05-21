import type { DiagnosticoDraft } from "@/lib/diagnostico/draft";
import type { DiagnosticoStepId } from "@/lib/diagnostico/steps-shared";
import type { SignupDraft, SignupStepId } from "@/lib/signup-chat/steps";

export type ChatMessage = {
  id: string;
  role: "aprendiz" | "user";
  content: string;
  /** Passo associado à mensagem (pergunta ou resposta). */
  stepId?: string;
};

export type StepHistoryEntry<TStepId extends string, TDraft> = {
  stepId: TStepId;
  draftBefore: TDraft;
  rawValue: string;
};

/** Valor bruto para pré-preencher o campo ao voltar e corrigir. */
export function getSignupStepRawValue(
  stepId: SignupStepId,
  draft: SignupDraft,
): string {
  switch (stepId) {
    case "name":
      return draft.name;
    case "email":
      return draft.email;
    case "emailCode":
      return "";
    case "orgName":
      return draft.organizationName;
    case "cnpj":
      return draft.cnpj;
    default:
      return "";
  }
}

export function getDiagnosticoStepRawValue(
  stepId: DiagnosticoStepId,
  draft: DiagnosticoDraft,
): string {
  switch (stepId) {
    case "orgName":
      return draft.organizationName;
    case "cnpj":
      return draft.cnpj;
    default:
      return "";
  }
}

export function truncateMessagesToStep(
  messages: ChatMessage[],
  stepId: string,
): ChatMessage[] {
  const idx = messages.findLastIndex(
    (m) => m.role === "aprendiz" && m.stepId === stepId,
  );
  if (idx < 0) return messages;
  return messages.slice(0, idx + 1);
}

export function getOnboardingStepRawValue(
  stepId: string,
  draft: DiagnosticoDraft,
): string {
  if (stepId === "orgName" || stepId === "cnpj") {
    return getDiagnosticoStepRawValue(stepId, draft);
  }
  return "";
}
