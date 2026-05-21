import { createHash, randomInt } from "node:crypto";
import { prisma } from "./client";

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashCode(email: string, code: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-email-verify-pepper";
  return createHash("sha256")
    .update(`${secret}:reset:${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

/** Conta ativa no app tenant (usuário com organização). */
export async function isRegisteredAppUser(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: { memberships: { take: 1 } },
  });
  return Boolean(user?.memberships.length);
}

export async function createPasswordResetVerification(
  email: string,
): Promise<{ code: string } | null> {
  const normalized = normalizeEmail(email);
  const now = new Date();

  const recent = await prisma.passwordResetVerification.findFirst({
    where: {
      email: normalized,
      verifiedAt: null,
      createdAt: { gte: new Date(now.getTime() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) return null;

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  await prisma.passwordResetVerification.create({
    data: {
      email: normalized,
      codeHash: hashCode(normalized, code),
      expiresAt,
    },
  });

  return { code };
}

export async function verifyPasswordResetCode(
  email: string,
  code: string,
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const sanitized = code.replace(/\D/g, "");
  if (sanitized.length !== 6) return false;

  const row = await prisma.passwordResetVerification.findFirst({
    where: {
      email: normalized,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return false;

  if (row.attempts >= MAX_ATTEMPTS) {
    throw new Error(
      "Muitas tentativas. Volte ao login e solicite um novo código.",
    );
  }

  const valid = row.codeHash === hashCode(normalized, sanitized);

  await prisma.passwordResetVerification.update({
    where: { id: row.id },
    data: valid
      ? { attempts: row.attempts + 1, verifiedAt: new Date() }
      : { attempts: row.attempts + 1 },
  });

  return valid;
}

const VERIFIED_RESET_TTL_MS = 30 * 60 * 1000;

export async function assertPasswordResetVerified(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const since = new Date(Date.now() - VERIFIED_RESET_TTL_MS);

  const row = await prisma.passwordResetVerification.findFirst({
    where: {
      email: normalized,
      verifiedAt: { gte: since },
    },
    orderBy: { verifiedAt: "desc" },
  });

  if (!row) {
    throw new Error("Confirme o código antes de definir a nova senha.");
  }
}
