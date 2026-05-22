import { randomUUID } from "node:crypto";
import { prisma } from "./client";

export async function createSellerInvite(input: {
  organizationId: string;
  tenantSellerId: string;
  email: string;
  expiresInHours?: number;
}): Promise<{ token: string; expiresAt: Date }> {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("E-mail é obrigatório para convite");

  const token = randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
  const expiresAt = new Date(
    Date.now() + (input.expiresInHours ?? 72) * 60 * 60 * 1000,
  );

  await prisma.sellerInvite.create({
    data: {
      id: randomUUID(),
      organizationId: input.organizationId,
      tenantSellerId: input.tenantSellerId,
      email,
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function findSellerInviteByToken(token: string) {
  return prisma.sellerInvite.findUnique({ where: { token } });
}

export async function markSellerInviteAccepted(id: string): Promise<void> {
  await prisma.sellerInvite.update({
    where: { id },
    data: { acceptedAt: new Date() },
  });
}
