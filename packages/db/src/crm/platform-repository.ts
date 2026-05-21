import type {
  CrmBoardRecord,
  CrmNote,
  CrmPipelineStage,
  CrmRecordKind,
  CrmRepository,
  CreateLeadInput,
} from "@boilerplate/crm";
import type { Fase } from "@boilerplate/shared";
import { prisma } from "../client";
import { setOrganizationModules } from "../organization";

const PIPELINE_STAGES: CrmPipelineStage[] = [
  "lead",
  "trial",
  "active",
  "expansion",
  "churn_risk",
];

function asPipelineStage(value: string): CrmPipelineStage {
  return PIPELINE_STAGES.includes(value as CrmPipelineStage)
    ? (value as CrmPipelineStage)
    : "trial";
}

function asFase(value: number): Fase {
  if (value >= 1 && value <= 4) return value as Fase;
  return 1;
}

function orgToRecord(
  org: Awaited<ReturnType<typeof loadOrganizations>>[number],
): CrmBoardRecord {
  return {
    id: org.id,
    kind: "organization",
    title: org.name,
    subtitle: org.tipoNegocio,
    phase: asFase(org.phase),
    pipelineStage: asPipelineStage(org.crmStage),
    moduleIds: org.modulosAtivos.map((m) => m.moduloId),
    moduleDemandIds: org.moduloDemanda.map((m) => m.moduloId),
    meta: {
      slug: org.slug,
      tipoNegocio: org.tipoNegocio,
      segmentoAtuacao: org.segmentoAtuacao,
      memberCount: org._count.memberships,
      hasCnpj: org.hasCnpj,
      cnpj: org.cnpj,
      fiscalReady: org.fiscalReady,
      schemaName: org.schemaName,
      createdAt: org.createdAt.toISOString(),
    },
  };
}

function leadToRecord(lead: Awaited<ReturnType<typeof loadLeads>>[number]): CrmBoardRecord {
  return {
    id: lead.id,
    kind: "lead",
    title: lead.name,
    subtitle: lead.email ?? undefined,
    phase: asFase(lead.estimatedPhase ?? 1),
    pipelineStage: asPipelineStage(lead.crmStage),
    moduleIds: [],
    meta: {
      tipoNegocio: lead.tipoNegocio,
      email: lead.email,
    },
  };
}

async function loadOrganizations() {
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      modulosAtivos: true,
      moduloDemanda: true,
      _count: { select: { memberships: true } },
    },
  });
}

async function loadLeads() {
  return prisma.platformLead.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export function createPlatformCrmRepository(): CrmRepository {
  return {
    context: "platform",

    async listBoardRecords(): Promise<CrmBoardRecord[]> {
      const [orgs, leads] = await Promise.all([loadOrganizations(), loadLeads()]);
      return [...leads.map(leadToRecord), ...orgs.map(orgToRecord)];
    },

    async updatePhase(id: string, kind: CrmRecordKind, phase: Fase): Promise<void> {
      if (kind === "organization") {
        await prisma.organization.update({
          where: { id },
          data: { phase },
        });
      } else {
        await prisma.platformLead.update({
          where: { id },
          data: { estimatedPhase: phase },
        });
      }
    },

    async updatePipelineStage(
      id: string,
      kind: CrmRecordKind,
      stage: CrmPipelineStage,
    ): Promise<void> {
      if (kind === "organization") {
        await prisma.organization.update({
          where: { id },
          data: { crmStage: stage },
        });
      } else {
        await prisma.platformLead.update({
          where: { id },
          data: { crmStage: stage },
        });
      }
    },

    async updateModules(id: string, moduleIds: string[]): Promise<void> {
      await setOrganizationModules(id, moduleIds);
    },

    async listNotes(id: string, kind: CrmRecordKind): Promise<CrmNote[]> {
      const where =
        kind === "organization"
          ? { organizationId: id }
          : { platformLeadId: id };

      const rows = await prisma.platformCrmNote.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const userIds = rows
        .map((r) => r.platformUserId)
        .filter((x): x is string => Boolean(x));
      const users =
        userIds.length > 0
          ? await prisma.platformUser.findMany({
              where: { id: { in: userIds } },
              select: { id: true, name: true },
            })
          : [];
      const byId = new Map(users.map((u) => [u.id, u.name]));

      return rows.map((r) => ({
        id: r.id,
        body: r.body,
        createdAt: r.createdAt,
        authorName: r.platformUserId ? (byId.get(r.platformUserId) ?? null) : null,
      }));
    },

    async addNote(
      id: string,
      kind: CrmRecordKind,
      body: string,
      authorId?: string,
    ): Promise<void> {
      await prisma.platformCrmNote.create({
        data: {
          body,
          platformUserId: authorId ?? null,
          ...(kind === "organization"
            ? { organizationId: id }
            : { platformLeadId: id }),
        },
      });
    },

    async createLead(input: CreateLeadInput): Promise<CrmBoardRecord> {
      const lead = await prisma.platformLead.create({
        data: {
          name: input.name,
          email: input.email ?? null,
          tipoNegocio: input.tipoNegocio ?? null,
          estimatedPhase: input.estimatedPhase ?? 1,
          crmStage: "lead",
        },
      });
      return leadToRecord(lead);
    },
  };
}

/** Backfill crm_stage para organizações existentes */
export async function backfillOrganizationCrmStages(): Promise<void> {
  const orgs = await prisma.organization.findMany({
    include: { modulosAtivos: true },
  });
  for (const org of orgs) {
    const stage =
      org.modulosAtivos.length > 0 ? "active" : org.crmStage || "trial";
    if (org.crmStage !== stage) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { crmStage: stage },
      });
    }
  }
}
