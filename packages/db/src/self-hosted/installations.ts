import type {
  InstallationHeartbeatPayload,
  RegisterInstallationResponse,
} from "@boilerplate/platform-api";
import { prisma } from "../client";
import {
  generateSecureToken,
  hashInstallationKey,
  hashInstallationToken,
  encryptInstallationSecrets,
} from "./crypto";

export async function createInstallationToken(opts: {
  organizationId: string;
  installationId?: string;
  expiresInHours?: number;
}): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSecureToken("inst");
  const expiresAt = new Date(
    Date.now() + (opts.expiresInHours ?? 24) * 60 * 60 * 1000,
  );
  await prisma.installationToken.create({
    data: {
      organizationId: opts.organizationId,
      installationId: opts.installationId,
      tokenHash: hashInstallationToken(token),
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function createSelfHostedInstallation(opts: {
  organizationId: string;
  name: string;
}): Promise<{ installationId: string; installationToken: string }> {
  const installationKey = generateSecureToken("key");
  const inst = await prisma.selfHostedInstallation.create({
    data: {
      organizationId: opts.organizationId,
      name: opts.name,
      installationKeyHash: hashInstallationKey(installationKey),
      status: "pending",
    },
  });
  const { token } = await createInstallationToken({
    organizationId: opts.organizationId,
    installationId: inst.id,
  });
  return { installationId: inst.id, installationToken: token };
}

export async function registerInstallationFromToken(opts: {
  installationToken: string;
  publicUrl?: string;
  platformVersion: string;
}): Promise<RegisterInstallationResponse> {
  const tokenHash = hashInstallationToken(opts.installationToken);
  const row = await prisma.installationToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!row) throw new Error("INVALID_INSTALLATION_TOKEN");

  const installationKey = generateSecureToken("key");
  const oauthClientId = generateSecureToken("oauth");
  const oauthClientSecret = generateSecureToken("secret");

  let installationId = row.installationId;
  if (!installationId) {
    const inst = await prisma.selfHostedInstallation.create({
      data: {
        organizationId: row.organizationId,
        name: "Instalação principal",
        installationKeyHash: hashInstallationKey(installationKey),
        publicUrl: opts.publicUrl,
        status: "active",
        version: opts.platformVersion,
      },
    });
    installationId = inst.id;
  } else {
    await prisma.selfHostedInstallation.update({
      where: { id: installationId },
      data: {
        publicUrl: opts.publicUrl,
        status: "active",
        version: opts.platformVersion,
        installationKeyHash: hashInstallationKey(installationKey),
      },
    });
  }

  await prisma.installationToken.update({
    where: { id: row.id },
    data: { usedAt: new Date(), installationId },
  });

  await prisma.installationCredential.upsert({
    where: { installationId },
    create: {
      installationId,
      oauthClientId,
      secretsEncrypted: encryptInstallationSecrets({
        installationKey,
        oauthClientSecret,
      }),
    },
    update: {
      oauthClientId,
      secretsEncrypted: encryptInstallationSecrets({
        installationKey,
        oauthClientSecret,
      }),
      rotatedAt: new Date(),
    },
  });

  await prisma.installationEvent.create({
    data: {
      installationId,
      eventType: "installation.registered",
      payload: { publicUrl: opts.publicUrl },
    },
  });

  return {
    installationId,
    installationKey,
    organizationId: row.organizationId,
    oauthClientId,
    oauthClientSecret,
  };
}

export async function findInstallationByKey(
  installationKey: string,
): Promise<{ id: string; organizationId: string; status: string } | null> {
  const hash = hashInstallationKey(installationKey);
  const inst = await prisma.selfHostedInstallation.findFirst({
    where: { installationKeyHash: hash },
    select: { id: true, organizationId: true, status: true },
  });
  return inst;
}

export async function recordInstallationHeartbeat(
  installationId: string,
  payload: InstallationHeartbeatPayload,
): Promise<void> {
  await prisma.selfHostedInstallation.update({
    where: { id: installationId },
    data: {
      lastHeartbeatAt: new Date(),
      healthStatus: payload.healthStatus,
      lastMigrationStatus: payload.lastMigrationStatus,
      version: payload.platformVersion,
      metadata: {
        installedModules: payload.installedModules,
        installedIntegrators: payload.installedIntegrators,
        orgCount: payload.orgCount,
        activeUserCount: payload.activeUserCount,
      },
    },
  });
}

export async function listInstallationsForOrganization(organizationId: string) {
  return prisma.selfHostedInstallation.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllInstallations() {
  return prisma.selfHostedInstallation.findMany({
    include: { organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { lastHeartbeatAt: "desc" },
  });
}

export type InstallationStatus = "pending" | "active" | "suspended" | "revoked";

export async function updateSelfHostedInstallationStatus(
  installationId: string,
  status: InstallationStatus,
): Promise<void> {
  await prisma.selfHostedInstallation.update({
    where: { id: installationId },
    data: { status },
  });
  await prisma.installationEvent.create({
    data: {
      installationId,
      eventType: "installation.status_changed",
      payload: { status },
    },
  });
}
