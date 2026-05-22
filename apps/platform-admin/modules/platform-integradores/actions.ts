"use server";

import {
  listPlatformPaymentGateways,
  upsertPlatformPaymentGateway,
  type PlatformRole,
} from "@boilerplate/db";
import { auth } from "@/auth";
import { canEditGateways } from "../platform-segmentos/can-edit-segments";

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
