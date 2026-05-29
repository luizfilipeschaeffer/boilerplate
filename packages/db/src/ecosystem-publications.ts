import { prisma } from "./client";
import { writePlatformConfigAudit } from "./platform-audit";
import type {
  EcosystemModerationStatus,
  EcosystemPublicationKind,
  EcosystemPublicationRow,
} from "./ecosystem-labels";

export type {
  EcosystemModerationStatus,
  EcosystemPublicationKind,
  EcosystemPublicationRow,
} from "./ecosystem-labels";
export {
  ECOSYSTEM_KIND_LABELS,
  ECOSYSTEM_MODERATION_LABELS,
} from "./ecosystem-labels";

const DEFAULT_COMMUNITY_SEED: Array<
  Omit<
    EcosystemPublicationRow,
    | "id"
    | "manifest"
    | "reviewNotes"
    | "reviewedAt"
    | "reviewedByPlatformUserId"
    | "submittedAt"
    | "updatedAt"
  >
> = [
  {
    kind: "module",
    externalId: "example-module",
    name: "Example Module",
    description:
      "Módulo de exemplo da comunidade com contrato v1, event handlers e repository.",
    publisherName: "Comunidade Boilerplate",
    publisherEmail: null,
    packageName: "@boilerplate-community/example-module",
    packagePath: "community/example-module",
    category: null,
    moderationStatus: "pending_review",
    trustLevel: "community",
    availableToTenants: false,
  },
  {
    kind: "integrator",
    externalId: "example-messaging",
    name: "Example Messaging",
    description:
      "Integrador de exemplo (mock) com healthCheck e configSchema.",
    publisherName: "Comunidade Boilerplate",
    publisherEmail: null,
    packageName: "@boilerplate-community/example-integrator",
    packagePath: "community/example-integrator",
    category: "messaging",
    moderationStatus: "pending_review",
    trustLevel: "community",
    availableToTenants: false,
  },
];

function mapRow(row: {
  id: string;
  kind: string;
  externalId: string;
  name: string;
  description: string | null;
  publisherName: string | null;
  publisherEmail: string | null;
  packageName: string | null;
  packagePath: string | null;
  category: string | null;
  manifest: unknown;
  moderationStatus: string;
  reviewNotes: string | null;
  trustLevel: string;
  availableToTenants: boolean;
  reviewedAt: Date | null;
  reviewedByPlatformUserId: string | null;
  submittedAt: Date;
  updatedAt: Date;
}): EcosystemPublicationRow {
  return {
    ...row,
    kind: row.kind as EcosystemPublicationKind,
    moderationStatus: row.moderationStatus as EcosystemModerationStatus,
  };
}

export async function ensureEcosystemPublicationsSeeded(): Promise<void> {
  for (const item of DEFAULT_COMMUNITY_SEED) {
    await prisma.ecosystemPublication.upsert({
      where: {
        kind_externalId: {
          kind: item.kind,
          externalId: item.externalId,
        },
      },
      create: {
        ...item,
        manifest: {},
      },
      update: {},
    });
  }
}

export async function listEcosystemPublications(opts?: {
  kind?: EcosystemPublicationKind;
  moderationStatus?: EcosystemModerationStatus;
}): Promise<EcosystemPublicationRow[]> {
  const rows = await prisma.ecosystemPublication.findMany({
    where: {
      kind: opts?.kind,
      moderationStatus: opts?.moderationStatus,
    },
    orderBy: [{ moderationStatus: "asc" }, { submittedAt: "desc" }],
  });
  return rows.map(mapRow);
}

export async function listApprovedCommunityModules(): Promise<EcosystemPublicationRow[]> {
  return listEcosystemPublications({
    kind: "module",
    moderationStatus: "approved",
  });
}

export async function listApprovedCommunityIntegrators(): Promise<EcosystemPublicationRow[]> {
  return listEcosystemPublications({
    kind: "integrator",
    moderationStatus: "approved",
  });
}

export async function isCommunityModuleApproved(moduleId: string): Promise<boolean> {
  const row = await prisma.ecosystemPublication.findUnique({
    where: {
      kind_externalId: { kind: "module", externalId: moduleId },
    },
  });
  return row?.moderationStatus === "approved" && row.availableToTenants;
}

export async function isCommunityIntegratorApproved(
  integratorId: string,
): Promise<boolean> {
  const row = await prisma.ecosystemPublication.findUnique({
    where: {
      kind_externalId: { kind: "integrator", externalId: integratorId },
    },
  });
  return row?.moderationStatus === "approved" && row.availableToTenants;
}

/** Publicações oficiais passam; itens da comunidade exigem aprovação. */
export async function isEcosystemItemAvailableToTenants(
  kind: EcosystemPublicationKind,
  externalId: string,
): Promise<boolean> {
  const row = await prisma.ecosystemPublication.findUnique({
    where: { kind_externalId: { kind, externalId } },
  });
  if (!row) return true;
  return row.moderationStatus === "approved" && row.availableToTenants;
}

export async function updateEcosystemPublicationModeration(input: {
  id: string;
  moderationStatus: EcosystemModerationStatus;
  reviewNotes?: string | null;
  actorPlatformUserId: string;
}): Promise<EcosystemPublicationRow> {
  const approved = input.moderationStatus === "approved";

  const row = await prisma.ecosystemPublication.update({
    where: { id: input.id },
    data: {
      moderationStatus: input.moderationStatus,
      reviewNotes: input.reviewNotes ?? null,
      availableToTenants: approved,
      trustLevel: approved ? "verified" : "community",
      reviewedAt: new Date(),
      reviewedByPlatformUserId: input.actorPlatformUserId,
    },
  });

  await writePlatformConfigAudit({
    entityType: "ecosystem_publication",
    entityId: row.id,
    action: input.moderationStatus,
    actorPlatformUserId: input.actorPlatformUserId,
    diff: {
      externalId: row.externalId,
      kind: row.kind,
      reviewNotes: input.reviewNotes ?? null,
    },
  });

  return mapRow(row);
}
