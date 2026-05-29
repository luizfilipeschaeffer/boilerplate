import { NextRequest } from "next/server";
import { prisma } from "@boilerplate/db";
import { buildLicensePayload } from "@boilerplate/license-server";
import { requireInstallationAuth, jsonResponse } from "@/lib/control-plane/auth";

export async function GET(req: NextRequest) {
  const auth = await requireInstallationAuth(req);
  if (auth instanceof Response) return auth;
  const license = await buildLicensePayload(auth.organizationId, auth.installationId);
  const sub = await prisma.platformSubscription.findUnique({
    where: { organizationId: auth.organizationId },
  });
  const org = await prisma.organization.findUnique({
    where: { id: auth.organizationId },
    select: { trialEndsAt: true, provisioningStatus: true },
  });
  return jsonResponse({
    organizationId: auth.organizationId,
    planId: sub?.planId ?? license.plan,
    planName: sub?.planId ?? license.plan,
    status: sub?.status ?? license.status,
    expiresAt: sub?.expiresAt?.toISOString() ?? license.expiresAt,
    trialEndsAt: org?.trialEndsAt?.toISOString() ?? null,
    limits: license.limits,
    entitlements: license.entitlements,
  });
}
