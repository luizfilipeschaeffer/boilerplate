import { registerAllModules, getAllModules } from "@boilerplate/module-registry";
import type { Fase, TipoNegocio } from "@boilerplate/shared";
import { prisma } from "./client";

export type ModuloDemandaRow = {
  moduloId: string;
  count: number;
  byTipo: { tipoNegocio: string; count: number }[];
};

export type FunnelStageCount = {
  stage: string;
  label: string;
  count: number;
};

export type TipoInteresseRow = {
  tipoId: string;
  count: number;
};

export type MatrixCoverageCell = {
  fase: Fase;
  tipo: TipoNegocio;
  totalModules: number;
  implemented: number;
  scaffold: number;
  coveragePct: number;
};

export type TenantHealthRow = {
  organizationId: string;
  name: string;
  tipoNegocio: string;
  phase: number;
  crmStage: string;
  healthScore: number;
  healthLabel: "saudável" | "atenção" | "risco";
  activeModules: number;
  demandCount: number;
  daysSinceLastEvent: number | null;
};

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  trial: "Trial",
  active: "Ativo",
  expansion: "Expansão",
  churn_risk: "Risco de churn",
};

const TIPOS: TipoNegocio[] = [
  "pessoa_fisica",
  "varejo",
  "atacado",
  "fornecedor",
  "distribuidor",
  "transportadora",
  "fabricante",
  "industria",
  "produtor_rural",
];

const FASES: Fase[] = [1, 2, 3, 4];

export async function getInsightsDemanda(): Promise<ModuloDemandaRow[]> {
  const rows = await prisma.moduloDemanda.findMany({
    include: {
      organization: { select: { tipoNegocio: true } },
    },
  });
  const byModule = new Map<
    string,
    { count: number; tipo: Map<string, number> }
  >();

  for (const row of rows) {
    const cur = byModule.get(row.moduloId) ?? {
      count: 0,
      tipo: new Map<string, number>(),
    };
    cur.count += 1;
    const t = row.organization.tipoNegocio;
    cur.tipo.set(t, (cur.tipo.get(t) ?? 0) + 1);
    byModule.set(row.moduloId, cur);
  }

  return [...byModule.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([moduloId, data]) => ({
      moduloId,
      count: data.count,
      byTipo: [...data.tipo.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([tipoNegocio, count]) => ({ tipoNegocio, count })),
    }));
}

export async function getInsightsTipoInteresse(): Promise<TipoInteresseRow[]> {
  const orgs = await prisma.organization.findMany({
    where: { tipoNegocioInteresse: { not: null } },
    select: { tipoNegocioInteresse: true },
  });
  const counts = new Map<string, number>();
  for (const o of orgs) {
    const id = o.tipoNegocioInteresse!;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([tipoId, count]) => ({ tipoId, count }));
}

export async function getInsightsFunnel(): Promise<FunnelStageCount[]> {
  const [leadCount, orgs] = await Promise.all([
    prisma.platformLead.count(),
    prisma.organization.groupBy({
      by: ["crmStage"],
      _count: { id: true },
    }),
  ]);

  const orgByStage = new Map(orgs.map((o) => [o.crmStage, o._count.id]));
  const stages = [
    { stage: "lead", label: STAGE_LABELS.lead, count: leadCount },
    { stage: "trial", label: STAGE_LABELS.trial, count: orgByStage.get("trial") ?? 0 },
    { stage: "active", label: STAGE_LABELS.active, count: orgByStage.get("active") ?? 0 },
    {
      stage: "expansion",
      label: STAGE_LABELS.expansion,
      count: orgByStage.get("expansion") ?? 0,
    },
    {
      stage: "churn_risk",
      label: STAGE_LABELS.churn_risk,
      count: orgByStage.get("churn_risk") ?? 0,
    },
  ];
  return stages;
}

export async function getInsightsMatrixCoverage(): Promise<{
  cells: MatrixCoverageCell[];
  overallPct: number;
}> {
  registerAllModules();
  const modules = getAllModules();
  const implemented = modules.filter(
    (m) => m.implementationStatus === "implemented",
  ).length;
  const total = modules.length;
  const overallPct =
    total === 0 ? 0 : Math.round((implemented / total) * 100);

  const cells: MatrixCoverageCell[] = [];
  for (const fase of FASES) {
    for (const tipo of TIPOS) {
      const eligible = modules.filter(
        (m) =>
          m.faseMinima <= fase &&
          (!m.tiposNegocioElegiveis ||
            m.tiposNegocioElegiveis.length === 0 ||
            m.tiposNegocioElegiveis.includes(tipo)),
      );
      const impl = eligible.filter(
        (m) => m.implementationStatus === "implemented",
      ).length;
      const scaf = eligible.filter(
        (m) => m.implementationStatus === "scaffold",
      ).length;
      const t = eligible.length;
      cells.push({
        fase,
        tipo,
        totalModules: t,
        implemented: impl,
        scaffold: scaf,
        coveragePct: t === 0 ? 0 : Math.round((impl / t) * 100),
      });
    }
  }

  return { cells, overallPct };
}

function computeHealthScore(input: {
  crmStage: string;
  activeModules: number;
  demandCount: number;
  daysSinceLastEvent: number | null;
}): { score: number; label: TenantHealthRow["healthLabel"] } {
  let score = 70;
  if (input.crmStage === "active" || input.crmStage === "expansion") {
    score += 15;
  } else if (input.crmStage === "churn_risk") {
    score -= 35;
  } else if (input.crmStage === "trial") {
    score += 5;
  }
  score += Math.min(input.activeModules * 3, 15);
  if (input.demandCount > 3) score -= 10;
  if (input.daysSinceLastEvent == null) score -= 15;
  else if (input.daysSinceLastEvent > 30) score -= 25;
  else if (input.daysSinceLastEvent > 14) score -= 10;
  else if (input.daysSinceLastEvent <= 7) score += 10;

  score = Math.max(0, Math.min(100, score));
  const label: TenantHealthRow["healthLabel"] =
    score >= 70 ? "saudável" : score >= 45 ? "atenção" : "risco";
  return { score, label };
}

export async function getInsightsTenantHealth(): Promise<TenantHealthRow[]> {
  const orgs = await prisma.organization.findMany({
    include: {
      modulosAtivos: true,
      moduloDemanda: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const orgIds = orgs.map((o) => o.id);
  const lastEvents =
    orgIds.length === 0
      ? []
      : await prisma.domainEvent.groupBy({
          by: ["organizationId"],
          where: { organizationId: { in: orgIds } },
          _max: { createdAt: true },
        });
  const lastByOrg = new Map(
    lastEvents.map((e) => [e.organizationId, e._max.createdAt]),
  );

  const now = Date.now();
  return orgs.map((o) => {
    const last = lastByOrg.get(o.id);
    const daysSinceLastEvent = last
      ? Math.floor((now - last.getTime()) / 86400000)
      : null;
    const { score, label } = computeHealthScore({
      crmStage: o.crmStage,
      activeModules: o.modulosAtivos.length,
      demandCount: o.moduloDemanda.length,
      daysSinceLastEvent,
    });
    return {
      organizationId: o.id,
      name: o.name,
      tipoNegocio: o.tipoNegocio,
      phase: o.phase,
      crmStage: o.crmStage,
      healthScore: score,
      healthLabel: label,
      activeModules: o.modulosAtivos.length,
      demandCount: o.moduloDemanda.length,
      daysSinceLastEvent,
    };
  });
}

export async function buildInsightsExportCsv(): Promise<string> {
  const [demanda, funnel, health, tipoInteresse] = await Promise.all([
    getInsightsDemanda(),
    getInsightsFunnel(),
    getInsightsTenantHealth(),
    getInsightsTipoInteresse(),
  ]);

  const lines: string[] = [
    "# Demanda de módulos",
    "modulo_id,total",
    ...demanda.map((d) => `${d.moduloId},${d.count}`),
    "",
    "# Funil",
    "stage,count",
    ...funnel.map((f) => `${f.stage},${f.count}`),
    "",
    "# Health tenants",
    "org_id,nome,score,label,modulos_ativos,demanda,dias_sem_evento",
    ...health.map(
      (h) =>
        `${h.organizationId},${JSON.stringify(h.name)},${h.healthScore},${h.healthLabel},${h.activeModules},${h.demandCount},${h.daysSinceLastEvent ?? ""}`,
    ),
    "",
    "# Tipo negócio interesse (planned)",
    "tipo_id,count",
    ...tipoInteresse.map((t) => `${t.tipoId},${t.count}`),
  ];
  return lines.join("\n");
}
