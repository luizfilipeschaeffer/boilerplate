"use server";

import {
  listPlatformIntegratorCatalog,
  listPlatformPaymentGateways,
  getIntegratorConfigFields,
  upsertPlatformPaymentGateway,
} from "@boilerplate/db";
import { canEditGateways } from "../platform-segmentos/can-edit-segments";
import { requirePlatformModule } from "@/lib/platform-access";
import type { IntegratorTableRow } from "./integradores-list-view";

export async function loadIntegradoresCatalogData() {
  const ctx = await requirePlatformModule("platform-integradores");
  const [integrators, gateways] = await Promise.all([
    listPlatformIntegratorCatalog(),
    listPlatformPaymentGateways(),
  ]);
  const gatewayById = new Map(
    gateways.map((g) => [g.integratorId, g]),
  );

  const rows: IntegratorTableRow[] = integrators.map((i) => {
    const gw = i.tipo === "payment" ? gatewayById.get(i.id) : undefined;
    return {
      ...i,
      gatewayAtivo: gw ? gw.ativo : null,
      gatewayDefault: gw ? gw.isDefault : null,
      credentialConfigurable: getIntegratorConfigFields(i.id).length > 0,
    };
  });

  return {
    integrators: rows,
    canEditGateways: canEditGateways(ctx.platformRole),
  };
}

export async function loadGatewaysData() {
  const ctx = await requirePlatformModule("platform-integradores");
  const gateways = await listPlatformPaymentGateways();
  return { gateways, canEdit: canEditGateways(ctx.platformRole) };
}

export async function toggleGatewayAction(input: {
  integratorId: string;
  label: string;
  ativo: boolean;
  isDefault?: boolean;
}) {
  const ctx = await requirePlatformModule("platform-integradores");
  if (!canEditGateways(ctx.platformRole)) {
    throw new Error("Somente administradores podem alterar gateways.");
  }
  return upsertPlatformPaymentGateway(
    input,
    ctx.userId,
  );
}
