import "server-only";
import { resolveDeploymentMode } from "@boilerplate/platform-api";
import { PlatformApiClient } from "@boilerplate/platform-api/client";
import {
  getEffectiveLicense,
  fetchAndCacheLicense,
} from "@boilerplate/license-client";
import { encryptEnvelope } from "@boilerplate/shared/secrets";
import { prisma } from "@boilerplate/db";
import {
  getInstallationCredentialsFromConfig,
  isSetupComplete,
} from "@boilerplate/db/self-hosted";

export function getCentralApiUrl(): string {
  return (
    process.env.CENTRAL_API_URL ??
    process.env.NEXT_PUBLIC_CENTRAL_API_URL ??
    "http://localhost:3002"
  );
}

export async function getInstallationEnv() {
  const fromDb = await getInstallationCredentialsFromConfig();
  if (fromDb) {
    return {
      installationId: fromDb.installationId,
      installationKey: fromDb.installationKey,
      centralApiUrl: fromDb.centralApiUrl,
      platformVersion: process.env.PLATFORM_VERSION ?? "0.1.0",
    };
  }
  return {
    installationId: process.env.INSTALLATION_ID ?? "",
    installationKey: process.env.INSTALLATION_KEY ?? "",
    centralApiUrl: getCentralApiUrl(),
    platformVersion: process.env.PLATFORM_VERSION ?? "0.1.0",
  };
}

export async function getPlatformApiClient(accessToken?: string) {
  const { installationKey, centralApiUrl } = await getInstallationEnv();
  return new PlatformApiClient({
    baseUrl: centralApiUrl,
    installationKey: installationKey || undefined,
    accessToken,
  });
}

export async function refreshLicenseCache(): Promise<void> {
  const { installationId, installationKey, centralApiUrl } =
    await getInstallationEnv();
  if (!installationId || !installationKey) return;
  await fetchAndCacheLicense({
    centralApiUrl,
    installationId,
    installationKey,
  });
}

export async function loadLicenseForUi() {
  if (resolveDeploymentMode() === "cloud" && !process.env.INSTALLATION_ID) {
    return null;
  }
  try {
    await refreshLicenseCache();
  } catch {
    // offline grace via cache
  }
  return getEffectiveLicense();
}

export async function assertOrganizationLimit(): Promise<void> {
  const license = await getEffectiveLicense();
  if (!license) return;
  const count = await prisma.organization.count();
  if (count >= license.limits.organizations) {
    throw new Error(
      `Limite de organizações atingido (${license.limits.organizations}). Atualize seu plano.`,
    );
  }
}

export function encryptInstallationKeyForStorage(key: string): string {
  return encryptEnvelope({ installationKey: key });
}

export async function requireSetupCompleteForSelfHosted(): Promise<boolean> {
  if (resolveDeploymentMode() !== "self_hosted") return true;
  return isSetupComplete();
}

export { isSetupComplete };
