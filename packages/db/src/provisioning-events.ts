import { prisma } from "./client";

export async function recordProvisioningPlatformActivity(input: {
  organizationId: string;
  activityType: string;
  body: string;
  platformUserId?: string | null;
}): Promise<void> {
  await prisma.platformActivity.create({
    data: {
      activityType: input.activityType,
      body: input.body,
      organizationId: input.organizationId,
      platformUserId: input.platformUserId ?? null,
    },
  });
}

export async function notifyProvisioningAlert(input: {
  organizationId: string;
  activityType: "activation_alert" | "payment_failed";
  body: string;
}): Promise<void> {
  await recordProvisioningPlatformActivity({
    organizationId: input.organizationId,
    activityType: input.activityType,
    body: input.body,
  });
}
