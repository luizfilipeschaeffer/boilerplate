export type EcosystemPublicationKind = "module" | "integrator";

export type EcosystemModerationStatus =
  | "pending_review"
  | "approved"
  | "changes_requested"
  | "rejected";

export type EcosystemPublicationRow = {
  id: string;
  kind: EcosystemPublicationKind;
  externalId: string;
  name: string;
  description: string | null;
  publisherName: string | null;
  publisherEmail: string | null;
  packageName: string | null;
  packagePath: string | null;
  category: string | null;
  manifest: unknown;
  moderationStatus: EcosystemModerationStatus;
  reviewNotes: string | null;
  trustLevel: string;
  availableToTenants: boolean;
  reviewedAt: Date | null;
  reviewedByPlatformUserId: string | null;
  submittedAt: Date;
  updatedAt: Date;
};

export const ECOSYSTEM_MODERATION_LABELS: Record<EcosystemModerationStatus, string> = {
  pending_review: "Aguardando revisão",
  approved: "Aprovado",
  changes_requested: "Ajustes solicitados",
  rejected: "Rejeitado",
};

export const ECOSYSTEM_KIND_LABELS: Record<EcosystemPublicationKind, string> = {
  module: "Módulo",
  integrator: "Integrador",
};
