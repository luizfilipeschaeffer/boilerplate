import { classificarFase, type DiagnosticoInput } from "@boilerplate/module-registry";
import type { DiagnosticoDraft } from "@/lib/diagnostico/draft";
import { draftToOnboardingInput } from "@/lib/diagnostico/draft";

export const FASE_OPTIONS = [
  { value: "1", label: "P1 — Informal (começando)" },
  { value: "2", label: "P2 — Crescendo" },
  { value: "3", label: "P3 — Estabelecido" },
  { value: "4", label: "P4 — Escala" },
] as const;

export function computeDiagnosedPhase(draft: DiagnosticoDraft): number {
  const input = draftToOnboardingInput(draft) as DiagnosticoInput;
  return classificarFase(input);
}

export function resolveDeclaredPhase(draft: DiagnosticoDraft): number {
  if (draft.declaredPhase != null) return draft.declaredPhase;
  return computeDiagnosedPhase(draft);
}

export function faseConfirmPrompt(draft: DiagnosticoDraft): string {
  const fase = computeDiagnosedPhase(draft);
  const labels: Record<number, string> = {
    1: "informal",
    2: "crescendo",
    3: "estabelecido",
    4: "em escala",
  };
  return `Pelo que você me contou, seu negócio está na fase **P${fase}** (${labels[fase] ?? "—"}). Isso define quais ferramentas vou preparar primeiro. Está certo?`;
}
