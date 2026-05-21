import type { TipoNegocio } from "@boilerplate/shared";
import type { DiagnosticoDraft } from "@/lib/diagnostico/draft";
import { TIPOS_NEGOCIO, VENDAS_MES_OPTIONS } from "@/lib/tipos-negocio";

export type DiagnosticoStepId =
  | "orgName"
  | "tipoNegocio"
  | "temPontoFixo"
  | "vendasMes"
  | "temFuncionarios"
  | "possuiCnpj"
  | "cnpj"
  | "emiteNota";

export const DIAGNOSTICO_STEP_IDS: DiagnosticoStepId[] = [
  "orgName",
  "tipoNegocio",
  "temPontoFixo",
  "vendasMes",
  "temFuncionarios",
  "possuiCnpj",
  "cnpj",
  "emiteNota",
];

export type ChoiceOption = { value: string; label: string };

export type DiagnosticoStepDef = {
  id: DiagnosticoStepId;
  kind: "text" | "choices";
  prompt: string | ((draft: DiagnosticoDraft) => string);
  placeholder?: string;
  choices?: ChoiceOption[] | ((draft: DiagnosticoDraft) => ChoiceOption[]);
  validate?: (value: string, draft: DiagnosticoDraft) => string | null;
  skip?: (draft: DiagnosticoDraft) => boolean;
  next: (draft: DiagnosticoDraft) => DiagnosticoStepId | null;
};

function firstName(name: string): string {
  const n = name.trim().split(/\s+/)[0];
  return n || "você";
}

export const DIAGNOSTICO_STEPS: DiagnosticoStepDef[] = [
  {
    id: "orgName",
    kind: "text",
    prompt: (d) =>
      `Como se chama seu negócio${d.name.trim() ? `, ${firstName(d.name)}` : ""}? Marca, loja ou nome fantasia.`,
    placeholder: "Ex.: Padaria do Centro, Loja Maria…",
    validate: (v) =>
      v.trim().length < 2
        ? "Me fala um nome com pelo menos 2 letras, por favor."
        : null,
    next: () => "tipoNegocio",
  },
  {
    id: "tipoNegocio",
    kind: "choices",
    prompt:
      "Em qual dessas opções seu negócio se encaixa melhor?",
    choices: TIPOS_NEGOCIO.map((t) => ({ value: t.value, label: t.label })),
    next: () => "temPontoFixo",
  },
  {
    id: "temPontoFixo",
    kind: "choices",
    prompt:
      "Você tem um lugar fixo — loja, escritório, galpão — que o cliente pode visitar?",
    choices: [
      { value: "sim", label: "Sim, tenho" },
      { value: "nao", label: "Não, sem ponto fixo" },
    ],
    next: () => "vendasMes",
  },
  {
    id: "vendasMes",
    kind: "choices",
    prompt:
      "Em média, quantas vendas ou pedidos você fecha por mês?",
    choices: VENDAS_MES_OPTIONS.map((o) => ({
      value: o.value,
      label: o.label,
    })),
    next: () => "temFuncionarios",
  },
  {
    id: "temFuncionarios",
    kind: "choices",
    prompt: "Hoje você tem funcionários ou colaboradores fixos no time?",
    choices: [
      { value: "sim", label: "Sim" },
      { value: "nao", label: "Não, só eu" },
    ],
    next: () => "possuiCnpj",
  },
  {
    id: "possuiCnpj",
    kind: "choices",
    prompt: "Seu negócio já tem CNPJ?",
    choices: [
      { value: "sim", label: "Sim, já tenho" },
      { value: "nao", label: "Ainda não" },
    ],
    next: (d) => (d.possuiCnpj ? "cnpj" : "emiteNota"),
  },
  {
    id: "cnpj",
    kind: "text",
    prompt:
      "Se quiser, cola o CNPJ aqui — ou digite “pular” que sigo sem ele por enquanto.",
    placeholder: "00.000.000/0001-00 ou pular",
    skip: (d) => !d.possuiCnpj,
    validate: () => null,
    next: () => "emiteNota",
  },
  {
    id: "emiteNota",
    kind: "choices",
    prompt: "Você já emite nota fiscal?",
    choices: [
      { value: "sim", label: "Sim, já emito" },
      { value: "nao", label: "Ainda não" },
      { value: "nao_sei", label: "Não sei / estou começando" },
    ],
    next: () => null,
  },
];

export function getDiagnosticoStep(id: DiagnosticoStepId): DiagnosticoStepDef {
  const step = DIAGNOSTICO_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Step ${id} não encontrado`);
  return step;
}

export function formatDiagnosticoAnswer(
  stepId: DiagnosticoStepId,
  value: string,
  draft: DiagnosticoDraft,
): string {
  const step = getDiagnosticoStep(stepId);
  if (step.kind === "choices" && step.choices) {
    const options =
      typeof step.choices === "function" ? step.choices(draft) : step.choices;
    return options.find((o) => o.value === value)?.label ?? value;
  }
  return value.trim();
}

export function applyDiagnosticoAnswer(
  stepId: DiagnosticoStepId,
  value: string,
  draft: DiagnosticoDraft,
): DiagnosticoDraft {
  const v = value.trim();
  switch (stepId) {
    case "orgName":
      return { ...draft, organizationName: v };
    case "tipoNegocio":
      return { ...draft, tipoNegocio: v as TipoNegocio };
    case "temPontoFixo":
      return { ...draft, temPontoFixo: v === "sim" };
    case "vendasMes":
      return {
        ...draft,
        vendasMes: v as DiagnosticoDraft["vendasMes"],
      };
    case "temFuncionarios":
      return { ...draft, temFuncionarios: v === "sim" };
    case "possuiCnpj":
      return {
        ...draft,
        possuiCnpj: v === "sim",
        cnpj: v === "sim" ? draft.cnpj : "",
      };
    case "cnpj":
      return {
        ...draft,
        cnpj: v.toLowerCase() === "pular" ? "" : v,
      };
    case "emiteNota":
      return { ...draft, emiteNota: v as DiagnosticoDraft["emiteNota"] };
    default:
      return draft;
  }
}
