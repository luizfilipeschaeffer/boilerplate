import { getMembershipForUser } from "@boilerplate/db";

/** Fonte de verdade no banco — independente do JWT desatualizado no cookie. */
export async function resolveUserSetup(userId: string) {
  const membership = await getMembershipForUser(userId);
  return {
    hasOrganization: Boolean(membership),
    organizationId: membership?.organizationId,
  };
}
