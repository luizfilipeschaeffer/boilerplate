import type { TipoNegocio } from "@boilerplate/shared";
import type { DiagnosticoInput } from "@boilerplate/db";
import { resolveDeclaredPhase } from "@/lib/diagnostico/phase-labels";

/** Campos de diagnóstico do negócio (cadastro + onboarding). */
/** Campos já respondidos no cadastro conversacional (evita perguntas repetidas). */
export type CadastroAnswered = Partial<
  Record<
    | "orgName"
    | "tipoNegocio"
    | "marketSegment"
    | "temPontoFixo"
    | "vendasMes"
    | "temFuncionarios"
    | "possuiCnpj"
    | "cnpj"
    | "emiteNota"
    | "faseConfirm"
    | "faseEscolhida",
    boolean
  >
>;

export type DiagnosticoDraft = {
  name: string;
  email: string;
  organizationName: string;
  tipoNegocio: TipoNegocio;
  marketSegmentSlug: string;
  diagnosedPhase: number | null;
  declaredPhase: number | null;
  temPontoFixo: boolean;
  vendasMes: DiagnosticoInput["vendasMes"];
  temFuncionarios: boolean;
  possuiCnpj: boolean;
  cnpj: string;
  emiteNota: "sim" | "nao" | "nao_sei";
  cadastroAnswered?: CadastroAnswered;
};

export const EMPTY_DIAGNOSTICO_DRAFT: DiagnosticoDraft = {
  name: "",
  email: "",
  organizationName: "",
  tipoNegocio: "varejo",
  marketSegmentSlug: "varejo",
  diagnosedPhase: null,
  declaredPhase: null,
  temPontoFixo: false,
  vendasMes: "ate50",
  temFuncionarios: false,
  possuiCnpj: false,
  cnpj: "",
  emiteNota: "nao",
};

export function cadastroAnsweredFromPayload(
  payload: Record<string, unknown>,
): CadastroAnswered {
  const org =
    typeof payload.organizationName === "string" &&
    payload.organizationName.trim().length >= 2;
  return {
    orgName: org,
    tipoNegocio: typeof payload.tipoNegocio === "string",
    marketSegment:
      typeof payload.marketSegmentSlug === "string" &&
      payload.marketSegmentSlug.length > 0,
    temPontoFixo: "temPontoFixo" in payload,
    vendasMes: typeof payload.vendasMes === "string",
    temFuncionarios: "temFuncionarios" in payload,
    possuiCnpj: "possuiCnpj" in payload,
    cnpj:
      "cnpj" in payload &&
      typeof payload.cnpj === "string" &&
      payload.cnpj.trim().length > 0,
    emiteNota:
      payload.emiteNota === "sim" ||
      payload.emiteNota === "nao" ||
      payload.emiteNota === "nao_sei",
  };
}

export function mergeDiagnosticoDraft(
  base: DiagnosticoDraft,
  partial: Partial<DiagnosticoDraft> | Record<string, unknown> | null,
  opts?: { fromCadastro?: boolean },
): DiagnosticoDraft {
  if (!partial || typeof partial !== "object") return base;
  const p = partial as Partial<DiagnosticoDraft>;
  const cadastroAnswered = opts?.fromCadastro
    ? {
        ...base.cadastroAnswered,
        ...cadastroAnsweredFromPayload(partial as Record<string, unknown>),
      }
    : base.cadastroAnswered;

  return {
    ...base,
    name: typeof p.name === "string" ? p.name : base.name,
    email: typeof p.email === "string" ? p.email : base.email,
    organizationName:
      typeof p.organizationName === "string"
        ? p.organizationName
        : base.organizationName,
    tipoNegocio:
      typeof p.tipoNegocio === "string"
        ? (p.tipoNegocio as TipoNegocio)
        : base.tipoNegocio,
    marketSegmentSlug:
      typeof p.marketSegmentSlug === "string"
        ? p.marketSegmentSlug
        : base.marketSegmentSlug,
    diagnosedPhase:
      typeof p.diagnosedPhase === "number" ? p.diagnosedPhase : base.diagnosedPhase,
    declaredPhase:
      typeof p.declaredPhase === "number" ? p.declaredPhase : base.declaredPhase,
    temPontoFixo:
      typeof p.temPontoFixo === "boolean" ? p.temPontoFixo : base.temPontoFixo,
    vendasMes:
      typeof p.vendasMes === "string"
        ? (p.vendasMes as DiagnosticoDraft["vendasMes"])
        : base.vendasMes,
    temFuncionarios:
      typeof p.temFuncionarios === "boolean"
        ? p.temFuncionarios
        : base.temFuncionarios,
    possuiCnpj:
      typeof p.possuiCnpj === "boolean" ? p.possuiCnpj : base.possuiCnpj,
    cnpj: typeof p.cnpj === "string" ? p.cnpj : base.cnpj,
    emiteNota:
      p.emiteNota === "sim" || p.emiteNota === "nao" || p.emiteNota === "nao_sei"
        ? p.emiteNota
        : base.emiteNota,
    cadastroAnswered,
  };
}

export function wasAnsweredInCadastro(
  draft: DiagnosticoDraft,
  step: keyof CadastroAnswered,
): boolean {
  return Boolean(draft.cadastroAnswered?.[step]);
}

export function draftToOnboardingInput(draft: DiagnosticoDraft) {
  return {
    name: draft.name.trim(),
    email: draft.email.trim().toLowerCase(),
    organizationName: draft.organizationName.trim(),
    tipoNegocio: draft.tipoNegocio,
    segmentoAtuacao: draft.marketSegmentSlug,
    declaredPhase: resolveDeclaredPhase(draft),
    temPontoFixo: draft.temPontoFixo,
    vendasMes: draft.vendasMes,
    temFuncionarios: draft.temFuncionarios,
    possuiCnpj: draft.possuiCnpj,
    cnpj: draft.possuiCnpj && draft.cnpj.trim() ? draft.cnpj.trim() : null,
    emiteNota:
      draft.emiteNota === "sim"
        ? true
        : draft.emiteNota === "nao"
          ? false
          : null,
  };
}

export function knownFromCadastroSummary(d: DiagnosticoDraft): string[] {
  const parts: string[] = [];
  const a = d.cadastroAnswered;
  if (!a) return parts;
  if (a.orgName) parts.push(`negócio “${d.organizationName.trim()}”`);
  if (a.tipoNegocio) parts.push("tipo de atividade");
  if (a.temPontoFixo) parts.push("ponto fixo");
  if (a.vendasMes) parts.push("volume de vendas");
  if (a.temFuncionarios) parts.push("equipe");
  if (a.possuiCnpj) parts.push("CNPJ");
  if (a.emiteNota) parts.push("nota fiscal");
  return parts;
}
