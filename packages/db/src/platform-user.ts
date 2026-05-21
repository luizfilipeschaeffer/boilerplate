import { compare, hash } from "bcryptjs";
import { prisma } from "./client";

export type PlatformRole =
  | "platform_admin"
  | "platform_comercial"
  | "platform_suporte"
  | "platform_produto"
  | "platform_engenharia";

const BCRYPT_ROUNDS = 12;

export async function hashPlatformPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPlatformPassword(
  plain: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  if (!passwordHash) return false;
  return compare(plain, passwordHash);
}

export async function findPlatformUserByEmail(email: string) {
  return prisma.platformUser.findFirst({
    where: { email: email.trim().toLowerCase(), active: true },
  });
}

export async function upsertPlatformUser(input: {
  email: string;
  name?: string;
  role?: PlatformRole;
  password?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const passwordHash = input.password
    ? await hashPlatformPassword(input.password)
    : undefined;

  return prisma.platformUser.upsert({
    where: { email },
    create: {
      email,
      name: input.name ?? email.split("@")[0],
      role: input.role ?? "platform_admin",
      passwordHash,
    },
    update: {
      name: input.name,
      role: input.role,
      active: true,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });
}

export async function listOrganizationsForAdmin() {
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      modulosAtivos: true,
      _count: { select: { memberships: true } },
    },
  });
}

export async function getInsightsDemanda() {
  const rows = await prisma.moduloDemanda.findMany({
    select: { moduloId: true, organizationId: true },
  });
  const byModule = new Map<string, number>();
  for (const row of rows) {
    byModule.set(row.moduloId, (byModule.get(row.moduloId) ?? 0) + 1);
  }
  return [...byModule.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([moduloId, count]) => ({ moduloId, count }));
}
