"use server";

import {
  listPlatformIntegratorCatalog,
  listPlatformPaymentGateways,
  upsertPlatformPaymentGateway,
  type PlatformRole,
} from "@boilerplate/db";
import { auth } from "@/auth";
import { canEditGateways } from "../platform-segmentos/can-edit-segments";
import type { IntegratorTableRow } from "./integradores-list-view";

export async function loadIntegradoresCatalogData() {
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
    };
  });

  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  return {
    integrators: rows,
    canEditGateways: canEditGateways(role),
  };
}

export async function loadGatewaysData() {
  const gateways = await listPlatformPaymentGateways();
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  return { gateways, canEdit: canEditGateways(role) };
}

export async function toggleGatewayAction(input: {
  integratorId: string;
  label: string;
  ativo: boolean;
  isDefault?: boolean;
}) {
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  if (!canEditGateways(role)) {
    throw new Error("Somente administradores podem alterar gateways.");
  }
  return upsertPlatformPaymentGateway(
    input,
    session?.user?.id ?? null,
  );
}
