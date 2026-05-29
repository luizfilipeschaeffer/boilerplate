"use server";

import {
  createInstallationToken,
  createSelfHostedInstallation,
  updateSelfHostedInstallationStatus,
  type InstallationStatus,
} from "@boilerplate/db/self-hosted";
import { requirePlatformModule } from "@/lib/platform-access";
import { revalidatePath } from "next/cache";

export async function createInstallationTokenAction(input: {
  organizationId: string;
  name: string;
}) {
  await requirePlatformModule("instalacoes");

  const name = input.name.trim() || "Instalação principal";
  if (!input.organizationId) {
    return { ok: false as const, error: "Selecione uma organização." };
  }

  const { installationId, installationToken } = await createSelfHostedInstallation({
    organizationId: input.organizationId,
    name,
  });

  revalidatePath("/instalacoes");

  return {
    ok: true as const,
    installationId,
    installationToken,
    expiresInHours: 24,
  };
}

export async function issueInstallationTokenAction(input: {
  installationId: string;
  organizationId: string;
}) {
  await requirePlatformModule("instalacoes");

  if (!input.installationId || !input.organizationId) {
    return { ok: false as const, error: "Instalação inválida." };
  }

  const { token } = await createInstallationToken({
    organizationId: input.organizationId,
    installationId: input.installationId,
  });

  return {
    ok: true as const,
    installationToken: token,
    expiresInHours: 24,
  };
}

export async function setInstallationStatusAction(input: {
  installationId: string;
  status: InstallationStatus;
}) {
  await requirePlatformModule("instalacoes");

  const allowed: InstallationStatus[] = [
    "pending",
    "active",
    "suspended",
    "revoked",
  ];
  if (!allowed.includes(input.status)) {
    return { ok: false as const, error: "Status inválido." };
  }

  await updateSelfHostedInstallationStatus(input.installationId, input.status);
  revalidatePath("/instalacoes");
  revalidatePath(`/instalacoes/${input.installationId}`);

  return { ok: true as const };
}
