import type { Fase, TipoNegocio } from "@boilerplate/shared";
import { getModule } from "./registry";
import { PACOTES_FISCAL_POR_TIPO } from "./pacotes-fiscal";
import { PACOTES_POR_FASE } from "./pacotes-fase";
import { MODULOS_PLANNED, PACOTES_POR_TIPO } from "./pacotes-tipo";

export type PrioridadeModulo = "obrigatorio" | "recomendado" | "opcional" | "futuro";

export interface ModuloRecomendacao {
  moduleId: string;
  prioridade: PrioridadeModulo;
  motivo: string;
}

export interface DiagnosticoInput {
  tipoNegocio: TipoNegocio;
  segmentoAtuacao?: string | null;
  temPontoFixo: boolean;
  vendasMes: "ate50" | "50a200" | "200a1000" | "acima1000";
  temFuncionarios: boolean;
  emiteNota: boolean | null;
  possuiCnpj: boolean;
  cnpj?: string | null;
}

export function classificarFase(input: DiagnosticoInput): Fase {
  let score = 0;
  if (input.temPontoFixo) score += 1;
  if (input.vendasMes === "50a200") score += 1;
  if (input.vendasMes === "200a1000") score += 2;
  if (input.vendasMes === "acima1000") score += 3;
  if (input.temFuncionarios) score += 1;
  if (input.emiteNota) score += 2;
  if (score <= 1) return 1;
  if (score <= 3) return 2;
  if (score <= 5) return 3;
  return 4;
}

function intersectarPacotes(fase: Fase, tipo: TipoNegocio): string[] {
  const baseFase = new Set(PACOTES_POR_FASE[fase]);
  const extrasTipo = PACOTES_POR_TIPO[tipo] ?? [];
  const ids = new Set<string>();

  for (const id of baseFase) ids.add(id);
  for (const id of extrasTipo) {
    if (baseFase.has(id) || fase >= 2 || id.startsWith("core-")) {
      ids.add(id);
    }
  }

  if (fase >= 2) {
    for (const id of extrasTipo) ids.add(id);
  }

  return [...ids];
}

function fiscalParaTipo(
  fase: Fase,
  tipo: TipoNegocio,
  possuiCnpj: boolean,
): string[] {
  if (tipo === "pessoa_fisica" && !possuiCnpj) return [];
  if (fase < 3) return [];
  const pacote = PACOTES_FISCAL_POR_TIPO[tipo] ?? [];
  return ["fiscal-core", ...pacote];
}

export function recomendarModulos(
  fase: Fase,
  tipo: TipoNegocio,
  opts?: { possuiCnpj?: boolean },
): ModuloRecomendacao[] {
  const possuiCnpj = opts?.possuiCnpj ?? false;
  const candidatos = new Set(intersectarPacotes(fase, tipo));
  for (const id of fiscalParaTipo(fase, tipo, possuiCnpj)) {
    candidatos.add(id);
  }

  const result: ModuloRecomendacao[] = [];

  for (const moduleId of candidatos) {
    const def = getModule(moduleId);
    if (!def) continue;

    if (MODULOS_PLANNED.has(moduleId)) {
      result.push({
        moduleId,
        prioridade: "futuro",
        motivo: "Módulo planejado — registrando interesse",
      });
      continue;
    }

    const prioridade: PrioridadeModulo =
      def.implementationStatus === "scaffold"
        ? fase >= 3 && moduleId.startsWith("fiscal-")
          ? "recomendado"
          : moduleId.startsWith("fiscal-")
            ? "opcional"
            : "obrigatorio"
        : "obrigatorio";

    result.push({
      moduleId,
      prioridade,
      motivo:
        prioridade === "obrigatorio"
          ? "Pacote base do diagnóstico"
          : "Módulo complementar para seu perfil",
    });
  }

  return result.sort((a, b) => {
    const order = { obrigatorio: 0, recomendado: 1, opcional: 2, futuro: 3 };
    return order[a.prioridade] - order[b.prioridade];
  });
}

export function modulosParaAtivar(recomendacoes: ModuloRecomendacao[]): string[] {
  return recomendacoes
    .filter((r) => r.prioridade !== "futuro")
    .map((r) => r.moduleId);
}

export function modulosDemanda(recomendacoes: ModuloRecomendacao[]): string[] {
  return recomendacoes
    .filter((r) => r.prioridade === "futuro")
    .map((r) => r.moduleId);
}
