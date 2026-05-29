"use server";

import { installModuleFromMarketplace } from "@boilerplate/module-installer";
import {
  getCentralApiUrl,
  getInstallationEnv,
  getPlatformApiClient,
  loadLicenseForUi,
  refreshLicenseCache,
} from "@/lib/platform-client";
import { requireTenantContext } from "@/lib/tenant-context";
import { bridgeCustomerFeedback } from "@boilerplate/feedback-bridge";
import { checkPlatformUpdates } from "@boilerplate/update-client";

export async function getLicenseStatusAction() {
  const license = await loadLicenseForUi();
  return license;
}

export async function getSubscriptionAction() {
  const client = await getPlatformApiClient();
  try {
    return await client.getSubscription();
  } catch {
    return null;
  }
}

export async function listMarketplaceModulesAction() {
  const client = await getPlatformApiClient();
  const { modules } = await client.listMarketplaceModules();
  return modules;
}

export async function installModuleAction(moduleId: string) {
  const ctx = await requireTenantContext();
  const env = await getInstallationEnv();
  if (!env.installationKey) {
    return { ok: false as const, message: "Instalação não configurada" };
  }
  const result = await installModuleFromMarketplace({
    moduleId,
    organizationId: ctx.organizationId,
    centralApiUrl: getCentralApiUrl(),
    installationKey: env.installationKey,
    platformVersion: env.platformVersion,
    backupConfirmed: true,
  });
  if (result.ok) await refreshLicenseCache();
  return result;
}

export async function listSupportTicketsAction() {
  const env = await getInstallationEnv();
  if (!env.installationId) return [];
  const client = await getPlatformApiClient();
  const { tickets } = await client.listSupportTickets(env.installationId);
  return tickets;
}

export async function createSupportTicketAction(input: {
  subject: string;
  body: string;
  type: string;
  moduleId?: string;
}) {
  const ctx = await requireTenantContext();
  const env = await getInstallationEnv();
  const client = await getPlatformApiClient();
  return client.createSupportTicket({
    installationId: env.installationId,
    organizationId: ctx.organizationId,
    type: input.type as "bug",
    subject: input.subject,
    body: input.body,
    moduleId: input.moduleId,
    sanitizedContext: {
      platformVersion: env.platformVersion,
      moduleId: input.moduleId,
    },
  });
}

export async function submitFeedbackAction(input: {
  summary: string;
  moduleId?: string;
  details?: Record<string, unknown>;
}) {
  const ctx = await requireTenantContext();
  const env = await getInstallationEnv();
  const client = await getPlatformApiClient();
  return client.submitFeedback({
    installationId: env.installationId,
    organizationId: ctx.organizationId,
    moduleId: input.moduleId,
    summary: input.summary,
    sanitizedDetails: input.details ?? {},
  });
}

export async function checkUpdatesAction() {
  const env = await getInstallationEnv();
  if (!env.installationKey) {
    return { available: false as const, currentVersion: env.platformVersion };
  }
  return checkPlatformUpdates({
    centralApiUrl: getCentralApiUrl(),
    installationKey: env.installationKey,
    currentVersion: env.platformVersion,
  });
}
