"use server";

import {
  ensureEcosystemPublicationsSeeded,
  listEcosystemPublications,
  updateEcosystemPublicationModeration,
  type EcosystemModerationStatus,
} from "@boilerplate/db";
import { revalidatePath } from "next/cache";
import { requirePlatformModule } from "@/lib/platform-access";
import { canModerateEcosystem } from "./can-moderate-ecosystem";

export async function loadCommunityPublicationsData() {
  const ctx = await requirePlatformModule("platform-comunidade");
  await ensureEcosystemPublicationsSeeded();
  const publications = await listEcosystemPublications();
  return {
    publications,
    canModerate: canModerateEcosystem(ctx.platformRole),
  };
}

export async function moderatePublicationAction(input: {
  id: string;
  moderationStatus: EcosystemModerationStatus;
  reviewNotes?: string;
}) {
  const ctx = await requirePlatformModule("platform-comunidade");
  if (!canModerateEcosystem(ctx.platformRole)) {
    throw new Error("Sem permissão para moderar publicações da comunidade.");
  }

  if (
    (input.moderationStatus === "changes_requested" ||
      input.moderationStatus === "rejected") &&
    !input.reviewNotes?.trim()
  ) {
    throw new Error("Informe um comentário para o desenvolvedor.");
  }

  const result = await updateEcosystemPublicationModeration({
    id: input.id,
    moderationStatus: input.moderationStatus,
    reviewNotes: input.reviewNotes?.trim() || null,
    actorPlatformUserId: ctx.userId,
  });

  revalidatePath("/comunidade");
  return result;
}
