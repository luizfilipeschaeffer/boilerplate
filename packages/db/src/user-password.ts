import { compare, hash } from "bcryptjs";
import { prisma } from "./client";

const BCRYPT_ROUNDS = 12;

export type UserAuthRecord = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
};

export async function hashUserPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

export async function verifyUserPassword(
  plain: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  if (!passwordHash) return false;
  return compare(plain, passwordHash);
}

export async function setUserPassword(
  email: string,
  plainPassword: string,
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const passwordHash = await hashUserPassword(plainPassword);
  await prisma.user.update({
    where: { email: normalized },
    data: { passwordHash },
  });
}

export async function findUserByEmailForAuth(
  email: string,
): Promise<UserAuthRecord | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await prisma.$queryRawUnsafe<UserAuthRecord[]>(
    `SELECT id, email, name, password_hash AS "passwordHash"
     FROM users WHERE email = $1
     LIMIT 1`,
    normalized,
  );
  return rows[0] ?? null;
}
