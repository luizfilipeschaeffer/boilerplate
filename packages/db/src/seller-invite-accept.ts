import { randomUUID } from "node:crypto";
import { hashUserPassword } from "./user-password";
import { prisma } from "./client";
import {
  findSellerInviteByToken,
  markSellerInviteAccepted,
} from "./seller-invites";
import { linkSellerToUser } from "./tenant/sellers";
import { schemaNameFromSlug } from "./tenant/schema";

export async function acceptSellerInvite(input: {
  token: string;
  password: string;
  name?: string;
}): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const invite = await findSellerInviteByToken(input.token.trim());
  if (!invite) return { ok: false, error: "Convite inválido" };
  if (invite.acceptedAt) return { ok: false, error: "Convite já utilizado" };
  if (invite.expiresAt < new Date()) {
    return { ok: false, error: "Convite expirado" };
  }

  const org = await prisma.organization.findUnique({
    where: { id: invite.organizationId },
  });
  if (!org) return { ok: false, error: "Organização não encontrada" };

  const email = invite.email.trim().toLowerCase();
  const passwordHash = await hashUserPassword(input.password);
  const displayName =
    input.name?.trim() || email.split("@")[0] || "Vendedor";

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: displayName, passwordHash },
    update: { name: displayName, passwordHash },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id,
      },
    },
    create: {
      userId: user.id,
      organizationId: org.id,
      role: "vendedor",
    },
    update: { role: "vendedor" },
  });

  const sector = await prisma.sector.findFirst({
    where: { organizationId: org.id, slug: "geral" },
  });
  if (sector) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: org.id,
        },
      },
    });
    if (membership) {
      await prisma.membershipSector.upsert({
        where: {
          membershipId_sectorId: {
            membershipId: membership.id,
            sectorId: sector.id,
          },
        },
        create: {
          membershipId: membership.id,
          sectorId: sector.id,
        },
        update: {},
      });
    }
  }

  const schemaName = org.schemaName ?? schemaNameFromSlug(org.slug);
  await linkSellerToUser(schemaName, invite.tenantSellerId, user.id);
  await markSellerInviteAccepted(invite.id);

  return { ok: true, email };
}
