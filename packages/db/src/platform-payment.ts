import { prisma } from "./client";
import { writePlatformConfigAudit } from "./platform-audit";

export type PlatformPaymentGatewayRow = {
  integratorId: string;
  label: string;
  isDefault: boolean;
  configSchema: Record<string, unknown>;
  ativo: boolean;
};

const DEFAULT_GATEWAYS: PlatformPaymentGatewayRow[] = [
  {
    integratorId: "payment-mock",
    label: "Mock (desenvolvimento)",
    isDefault: true,
    configSchema: {},
    ativo: true,
  },
  {
    integratorId: "payment-asaas",
    label: "Asaas",
    isDefault: false,
    configSchema: { envKey: "ASAAS_API_KEY" },
    ativo: true,
  },
  {
    integratorId: "payment-stripe",
    label: "Stripe",
    isDefault: false,
    configSchema: { envKey: "STRIPE_SECRET_KEY" },
    ativo: true,
  },
  {
    integratorId: "payment-mercadopago",
    label: "Mercado Pago",
    isDefault: false,
    configSchema: { envKey: "MERCADOPAGO_ACCESS_TOKEN" },
    ativo: true,
  },
];

export async function seedDefaultPaymentGateways(): Promise<number> {
  for (const g of DEFAULT_GATEWAYS) {
    await prisma.platformPaymentGateway.upsert({
      where: { integratorId: g.integratorId },
      create: {
        integratorId: g.integratorId,
        label: g.label,
        isDefault: g.isDefault,
        configSchema: g.configSchema as object,
        ativo: g.ativo,
      },
      update: {
        label: g.label,
        configSchema: g.configSchema as object,
      },
    });
  }
  return DEFAULT_GATEWAYS.length;
}

export async function listPlatformPaymentGateways(opts?: {
  ativoOnly?: boolean;
}): Promise<PlatformPaymentGatewayRow[]> {
  const rows = await prisma.platformPaymentGateway.findMany({
    where: opts?.ativoOnly ? { ativo: true } : undefined,
    orderBy: { label: "asc" },
  });
  return rows.map((r) => ({
    integratorId: r.integratorId,
    label: r.label,
    isDefault: r.isDefault,
    configSchema:
      typeof r.configSchema === "object" && r.configSchema !== null
        ? (r.configSchema as Record<string, unknown>)
        : {},
    ativo: r.ativo,
  }));
}

export async function upsertPlatformPaymentGateway(
  input: {
    integratorId: string;
    label: string;
    isDefault?: boolean;
    ativo?: boolean;
  },
  actorPlatformUserId?: string | null,
): Promise<PlatformPaymentGatewayRow> {
  if (input.isDefault) {
    await prisma.platformPaymentGateway.updateMany({
      data: { isDefault: false },
    });
  }
  const row = await prisma.platformPaymentGateway.upsert({
    where: { integratorId: input.integratorId },
    create: {
      integratorId: input.integratorId,
      label: input.label,
      isDefault: input.isDefault ?? false,
      ativo: input.ativo ?? true,
    },
    update: {
      label: input.label,
      isDefault: input.isDefault,
      ativo: input.ativo,
    },
  });
  await writePlatformConfigAudit({
    entityType: "gateway",
    entityId: row.integratorId,
    action: "upsert",
    actorPlatformUserId,
    diff: input,
  });
  return {
    integratorId: row.integratorId,
    label: row.label,
    isDefault: row.isDefault,
    configSchema: {},
    ativo: row.ativo,
  };
}

export async function getDefaultPaymentIntegratorId(): Promise<string> {
  const def = await prisma.platformPaymentGateway.findFirst({
    where: { ativo: true, isDefault: true },
  });
  if (def) return def.integratorId;
  const any = await prisma.platformPaymentGateway.findFirst({
    where: { ativo: true },
  });
  return any?.integratorId ?? "payment-mock";
}

export async function getTenantPaymentIntegrator(
  organizationId: string,
): Promise<string> {
  const tenant = await prisma.tenantIntegrator.findFirst({
    where: { organizationId, ativo: true, integratorId: { startsWith: "payment-" } },
  });
  if (tenant) return tenant.integratorId;
  return getDefaultPaymentIntegratorId();
}

export async function setTenantPaymentIntegrator(
  organizationId: string,
  integratorId: string,
): Promise<void> {
  await prisma.tenantIntegrator.upsert({
    where: {
      organizationId_integratorId: { organizationId, integratorId },
    },
    create: { organizationId, integratorId, ativo: true },
    update: { ativo: true },
  });
  await prisma.organization.update({
    where: { id: organizationId },
    data: { paymentIntegratorId: integratorId },
  });
}
