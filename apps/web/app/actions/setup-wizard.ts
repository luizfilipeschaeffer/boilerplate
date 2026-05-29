"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveDeploymentMode } from "@boilerplate/platform-api";
import {
  detectDatabaseHealth,
  getSetupStatus,
  saveSetupStep,
  registerInstallationInSetup,
  completeSetupWizard,
} from "@boilerplate/db/self-hosted";
import {
  getInstallationEnv,
  refreshLicenseCache,
} from "@/lib/platform-client";
import { getEffectiveLicense } from "@boilerplate/license-client";
import {
  ensureCustomerAccount,
  ensureOwnerMembershipForSetup,
} from "@boilerplate/db/self-hosted";
import {
  getLocalAllowedOrigins,
  saveLocalAllowedOrigins,
  setCentralAllowedOrigins,
} from "@boilerplate/db/self-hosted";

export async function getSetupWizardStatusAction() {
  return getSetupStatus();
}

export async function runDatabaseCheckAction() {
  const health = await detectDatabaseHealth();
  if (health.ok) {
    await saveSetupStep("platform");
  }
  return health;
}

export async function linkPlatformAction(input: {
  centralApiUrl: string;
  installationToken: string;
  publicUrl?: string;
}) {
  const result = await registerInstallationInSetup({
    centralApiUrl: input.centralApiUrl.trim(),
    installationToken: input.installationToken.trim(),
    publicUrl: input.publicUrl?.trim(),
  });
  return { ok: true as const, ...result };
}

export async function completeAccountStepAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Faça login com sua conta central primeiro." };
  }
  const env = await getInstallationEnv();
  if (!env.installationKey) {
    return { ok: false as const, error: "Instalação não registrada." };
  }

  await refreshLicenseCache();
  const license = await getEffectiveLicense();
  if (!license) {
    return { ok: false as const, error: "Não foi possível validar a licença." };
  }

  await ensureCustomerAccount({
    userId: session.user.id,
    organizationId: license.organizationId,
  });
  await ensureOwnerMembershipForSetup(session.user.id, license.organizationId);

  await saveSetupStep("license");
  return { ok: true as const, license };
}

export async function finalizeSetupAction(input?: {
  allowedOrigins?: string[];
  publicUrl?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Login necessário." };
  }

  await refreshLicenseCache();
  const license = await getEffectiveLicense();
  if (!license) {
    return { ok: false as const, error: "Licença indisponível." };
  }

  const h = await headers();
  const detectedHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const publicUrl = input?.publicUrl ?? (detectedHost ? `https://${detectedHost}` : undefined);

  const origins = input?.allowedOrigins?.length
    ? input.allowedOrigins
    : detectedHost
      ? [detectedHost]
      : [];

  const { installedModules } = await completeSetupWizard({
    license,
    publicUrl,
    allowedOrigins: origins,
  });

  if (license.installationId && origins.length) {
    try {
      await setCentralAllowedOrigins(license.installationId, origins);
    } catch {
      /* central DB may not be reachable from VPS in dev */
    }
  }

  await setSetupCompleteCookie();
  await syncAllowedHostsCookie(origins.filter(Boolean));

  return { ok: true as const, installedModules, origins };
}

async function setSetupCompleteCookie() {
  const jar = await cookies();
  jar.set("bp_setup_complete", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
}

async function syncAllowedHostsCookie(origins: string[]) {
  const jar = await cookies();
  jar.set("bp_allowed_hosts", origins.join(","), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 5,
  });
}

export async function saveAllowedOriginsAction(origins: string[]) {
  if (resolveDeploymentMode() !== "self_hosted") {
    return { ok: false as const, error: "Somente self-hosted." };
  }
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Não autenticado." };

  await saveLocalAllowedOrigins(origins);
  const env = await getInstallationEnv();
  if (env.installationId) {
    try {
      await setCentralAllowedOrigins(env.installationId, origins);
    } catch {
      /* ignore */
    }
  }
  await syncAllowedHostsCookie(origins);
  return { ok: true as const, origins: await getLocalAllowedOrigins() };
}

export async function getAllowedOriginsAction() {
  return getLocalAllowedOrigins();
}

export async function redirectIfSetupIncomplete() {
  if (resolveDeploymentMode() !== "self_hosted") return;
  const status = await getSetupStatus();
  if (!status.complete) redirect("/setup");
}
