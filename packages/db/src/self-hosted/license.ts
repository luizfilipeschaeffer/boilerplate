import { createSign } from "node:crypto";
import type { LicensePayload, LicenseLimits } from "@boilerplate/platform-api";
import { prisma } from "../client";

const DEFAULT_LIMITS: LicenseLimits = {
  users: 20,
  branches: 3,
  modules: 15,
  organizations: 5,
};

function signLicensePayload(payload: Omit<LicensePayload, "signature">): string {
  const key = process.env.LICENSE_SIGNING_KEY ?? "dev-license-signing-key-change-me";
  const signer = createSign("SHA256");
  signer.update(JSON.stringify(payload));
  signer.end();
  return signer.sign(key, "base64");
}

export async function resolveEntitlementsForOrganization(
  organizationId: string,
  installationId: string,
): Promise<string[]> {
  const grants = await prisma.entitlementGrant.findMany({
    where: {
      organizationId,
      OR: [{ installationId: null }, { installationId }],
    },
  });
  const fromGrants = grants.map((g) => g.entitlement);

  const modulos = await prisma.moduloAtivo.findMany({
    where: { organizationId },
    select: { moduloId: true },
  });
  const fromModules = modulos.map((m) => `module:${m.moduloId}`);

  const sub = await prisma.platformSubscription.findUnique({
    where: { organizationId },
  });
  const fromPlan: string[] = [];
  if (sub?.status === "active" || sub?.status === "trial") {
    fromPlan.push("feature:marketplace-install", "feature:support-standard");
  }

  return [...new Set([...fromGrants, ...fromModules, ...fromPlan])];
}

export async function buildLicensePayload(
  organizationId: string,
  installationId: string,
): Promise<LicensePayload> {
  const sub = await prisma.platformSubscription.findUnique({
    where: { organizationId },
  });
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { provisioningStatus: true, trialEndsAt: true },
  });

  let status: LicensePayload["status"] = "active";
  if (org?.provisioningStatus === "blocked") status = "suspended";
  else if (sub?.status === "expired") status = "expired";
  else if (sub?.status === "past_due") status = "past_due";
  else if (sub?.status === "suspended") status = "suspended";

  const entitlements = await resolveEntitlementsForOrganization(
    organizationId,
    installationId,
  );

  const expiresAt =
    sub?.expiresAt?.toISOString() ??
    org?.trialEndsAt?.toISOString() ??
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const base = {
    organizationId,
    installationId,
    plan: sub?.planId ?? "trial",
    status,
    expiresAt,
    entitlements,
    limits: DEFAULT_LIMITS,
    issuedAt: new Date().toISOString(),
    offlineGraceHours: Number(process.env.LICENSE_OFFLINE_GRACE_HOURS ?? "72"),
    allowedOrigins: await getInstallationAllowedOrigins(installationId),
  };

  return {
    ...base,
    signature: signLicensePayload(base),
  };
}

export async function ensureDefaultSubscription(organizationId: string): Promise<void> {
  await prisma.platformSubscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      planId: "professional",
      status: "trial",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    update: {},
  });
}

export async function ensureCustomerAccount(opts: {
  userId: string;
  organizationId: string;
}): Promise<void> {
  await prisma.platformCustomerAccount.upsert({
    where: { userId: opts.userId },
    create: {
      userId: opts.userId,
      organizationId: opts.organizationId,
      role: "customer_owner",
    },
    update: {},
  });
}

async function getInstallationAllowedOrigins(
  installationId: string,
): Promise<string[]> {
  const inst = await prisma.selfHostedInstallation.findUnique({
    where: { id: installationId },
    select: { allowedOrigins: true, publicUrl: true },
  });
  if (!inst) return [];
  const fromJson = inst.allowedOrigins as unknown;
  const list = Array.isArray(fromJson) ? fromJson.map(String) : [];
  if (inst.publicUrl) {
    try {
      const host = new URL(
        inst.publicUrl.includes("://") ? inst.publicUrl : `https://${inst.publicUrl}`,
      ).host;
      if (host && !list.includes(host)) list.push(host);
    } catch {
      /* ignore */
    }
  }
  return list;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial gratuito",
  professional: "Professional",
  starter: "Starter",
  enterprise: "Enterprise",
  free: "Gratuito",
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  trial: "Em trial",
  active: "Ativa",
  past_due: "Pagamento pendente",
  expired: "Expirada",
  suspended: "Suspensa",
};

const PROVISIONING_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Ativo",
  pending_payment: "Aguardando pagamento",
  pre_active: "Pré-ativação",
  blocked: "Bloqueado",
};

export type ClientLicenseAdminRow = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  ownerEmail: string | null;
  provisioningStatus: string;
  crmStage: string;
  trialEndsAt: string | null;
  planId: string | null;
  subscriptionStatus: string | null;
  subscriptionExpiresAt: string | null;
  paymentRef: string | null;
  entitlements: string[];
  activeModulesCount: number;
  installationsCount: number;
  licenseTier: "gratuito" | "trial" | "pago";
  displayPlan: string;
  displayStatus: string;
};

function resolveLicenseTier(
  planId: string | null,
  subscriptionStatus: string | null,
  provisioningStatus: string,
): ClientLicenseAdminRow["licenseTier"] {
  const paidPlans = new Set(["professional", "starter", "enterprise"]);

  if (subscriptionStatus === "active" && planId && paidPlans.has(planId)) {
    return "pago";
  }

  if (
    subscriptionStatus === "trial" ||
    planId === "trial" ||
    provisioningStatus === "trial" ||
    provisioningStatus === "pending_payment" ||
    provisioningStatus === "pre_active"
  ) {
    return "trial";
  }

  return "gratuito";
}

function formatDisplayPlan(
  planId: string | null,
  provisioningStatus: string,
): string {
  if (planId) return PLAN_LABELS[planId] ?? planId;
  return PROVISIONING_LABELS[provisioningStatus] ?? provisioningStatus;
}

function formatDisplayStatus(
  subscriptionStatus: string | null,
  provisioningStatus: string,
): string {
  if (subscriptionStatus) {
    return SUBSCRIPTION_STATUS_LABELS[subscriptionStatus] ?? subscriptionStatus;
  }
  return PROVISIONING_LABELS[provisioningStatus] ?? provisioningStatus;
}

/** Lista todas as organizações clientes com assinatura, entitlements e instalações. */
export async function listClientLicensesForAdmin(): Promise<ClientLicenseAdminRow[]> {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      platformSubscription: true,
      customerAccount: {
        select: { user: { select: { email: true } } },
      },
      entitlementGrants: {
        where: { installationId: null },
        select: { entitlement: true },
        orderBy: { grantedAt: "asc" },
      },
      modulosAtivos: { select: { moduloId: true } },
      selfHostedInstallations: { select: { id: true } },
    },
  });

  return orgs.map((org) => {
    const sub = org.platformSubscription;
    const planId = sub?.planId ?? null;
    const subscriptionStatus = sub?.status ?? null;

    const entitlementsFromGrants = org.entitlementGrants.map((g) => g.entitlement);
    const entitlementsFromModules = org.modulosAtivos.map((m) => `module:${m.moduloId}`);
    const entitlements = [
      ...new Set([...entitlementsFromGrants, ...entitlementsFromModules]),
    ];

    return {
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      ownerEmail: org.customerAccount?.user.email ?? null,
      provisioningStatus: org.provisioningStatus,
      crmStage: org.crmStage,
      trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
      planId,
      subscriptionStatus,
      subscriptionExpiresAt: sub?.expiresAt?.toISOString() ?? null,
      paymentRef: sub?.paymentRef ?? null,
      entitlements,
      activeModulesCount: org.modulosAtivos.length,
      installationsCount: org.selfHostedInstallations.length,
      licenseTier: resolveLicenseTier(planId, subscriptionStatus, org.provisioningStatus),
      displayPlan: formatDisplayPlan(planId, org.provisioningStatus),
      displayStatus: formatDisplayStatus(subscriptionStatus, org.provisioningStatus),
    };
  });
}
