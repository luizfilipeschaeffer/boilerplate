import type { TipoNegocio } from "@boilerplate/shared";
import type { DiagnosticoInput } from "@boilerplate/db";
import {
  type DiagnosticoDraft,
  EMPTY_DIAGNOSTICO_DRAFT,
  draftToOnboardingInput,
} from "@/lib/diagnostico/draft";
import { TIPOS_NEGOCIO, VENDAS_MES_OPTIONS } from "@/lib/tipos-negocio";

export { draftToOnboardingInput };

export type SignupStepId =
  | "welcome"
  | "name"
  | "email"
  | "emailCode"
  | "orgName"
  | "tipoNegocio"
  | "temPontoFixo"
  | "vendasMes"
  | "temFuncionarios"
  | "possuiCnpj"
  | "cnpj"
  | "emiteNota"
  | "summary";

export type SignupDraft = DiagnosticoDraft;

export const INITIAL_SIGNUP_DRAFT: SignupDraft = { ...EMPTY_DIAGNOSTICO_DRAFT };

export type StepKind = "text" | "email" | "code" | "choices" | "info";

export type ChoiceOption = { value: string; label: string };

export type SignupStepDef = {
  id: SignupStepId;
  kind: StepKind;
  prompt: string | ((draft: SignupDraft) => string);
  placeholder?: string;
  choices?: ChoiceOption[] | ((draft: SignupDraft) => ChoiceOption[]);
  validate?: (value: string, draft: SignupDraft) => string | null;
  skip?: (draft: SignupDraft) => boolean;
  next: (draft: SignupDraft) => SignupStepId | null;
};

function firstName(name: string): string {
  const n = name.trim().split(/\s+/)[0];
  return n || "você";
}

export const SIGNUP_STEPS: SignupStepDef[] = [
  {
    id: "welcome",
    kind: "info",
    prompt:
      "Olá! Eu sou o Aprendiz — ainda estou te conhecendo. Cada resposta sua me ajuda a entender seu negócio e montar um painel do seu jeito. Podemos começar?",
    next: () => "name",
  },
  {
    id: "name",
    kind: "text",
    prompt:
      "Primeiro, quem está por aí? Me conta seu nome — como você prefere ser chamado(a).",
    placeholder: "Seu nome",
    validate: (v) =>
      v.trim().length < 2
        ? "Preciso de pelo menos 2 letras no seu nome para te reconhecer."
        : null,
    next: () => "email",
  },
  {
    id: "email",
    kind: "email",
    prompt: (d) =>
      `Prazer, ${firstName(d.name)}! Qual e-mail você usa no dia a dia? Por segurança preciso confirmar que é seu — em seguida envio um código rápido para esse endereço.`,
    placeholder: "voce@empresa.com",
    validate: (v) => {
      const e = v.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return "Esse e-mail não parece certo — pode conferir?";
      }
      return null;
    },
    next: () => "emailCode",
  },
  {
    id: "emailCode",
    kind: "code",
    prompt: (d) =>
      `Enviei um código de 6 dígitos para ${d.email || "seu e-mail"}. Quando chegar, digite aqui para continuarmos nossa conversa.`,
    placeholder: "000000",
    validate: (v) => {
      const digits = v.replace(/\D/g, "");
      if (digits.length !== 6) {
        return "O código tem 6 números — confira na caixa de entrada (e no spam).";
      }
      return null;
    },
    next: () => "orgName",
  },
  {
    id: "orgName",
    kind: "text",
    prompt: (d) =>
      `Anotado, ${firstName(d.name)}. E o negócio — como se chama? Pode ser marca, loja ou nome fantasia.`,
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
      "Estou aprendendo o perfil do seu negócio. Em qual dessas opções ele se encaixa melhor?",
    choices: TIPOS_NEGOCIO.map((t) => ({ value: t.value, label: t.label })),
    next: () => "temPontoFixo",
  },
  {
    id: "temPontoFixo",
    kind: "choices",
    prompt:
      "Você trabalha com um lugar fixo — loja, escritório, galpão — que o cliente pode visitar?",
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
      "Mais uma coisa para eu calibrar sugestões: em média, quantas vendas ou pedidos você fecha por mês?",
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
    prompt: "Seu negócio já tem CNPJ? Isso me ajuda a pensar em rotinas fiscais depois.",
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
    prompt: "Última pergunta desta rodada: você já emite nota fiscal?",
    choices: [
      { value: "sim", label: "Sim, já emito" },
      { value: "nao", label: "Ainda não" },
      { value: "nao_sei", label: "Não sei / estou começando" },
    ],
    next: () => "summary",
  },
  {
    id: "summary",
    kind: "info",
    prompt: (d) =>
      `Obrigado, ${firstName(d.name)}! Já aprendi bastante sobre você e sobre “${d.organizationName.trim()}”. Vou criar sua conta e guardar tudo — daqui a pouco te encontro no painel do Aprendiz.`,
    next: () => null,
  },
];

export function getStep(id: SignupStepId): SignupStepDef {
  const step = SIGNUP_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`Step ${id} não encontrado`);
  return step;
}

export function formatUserAnswer(
  stepId: SignupStepId,
  value: string,
  draft: SignupDraft,
): string {
  const step = getStep(stepId);
  if (stepId === "emailCode") return "Código informado";
  if (step.kind === "choices" && step.choices) {
    const options =
      typeof step.choices === "function" ? step.choices(draft) : step.choices;
    return options.find((o) => o.value === value)?.label ?? value;
  }
  return value.trim();
}

export function applyAnswer(
  stepId: SignupStepId,
  value: string,
  draft: SignupDraft,
): SignupDraft {
  const v = value.trim();
  switch (stepId) {
    case "name":
      return { ...draft, name: v };
    case "email":
      return { ...draft, email: v.toLowerCase() };
    case "orgName":
      return { ...draft, organizationName: v };
    case "tipoNegocio":
      return { ...draft, tipoNegocio: v as TipoNegocio };
    case "temPontoFixo":
      return { ...draft, temPontoFixo: v === "sim" };
    case "vendasMes":
      return {
        ...draft,
        vendasMes: v as SignupDraft["vendasMes"],
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
      return { ...draft, emiteNota: v as SignupDraft["emiteNota"] };
    default:
      return draft;
  }
}

