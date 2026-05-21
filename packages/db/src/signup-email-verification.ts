import { createHash, randomInt } from "node:crypto";
import { prisma } from "./client";

const CODE_TTL_MS = 15 * 60 * 1000;
const VERIFIED_TTL_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashCode(email: string, code: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-email-verify-pepper";
  return createHash("sha256")
    .update(`${secret}:${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function createSignupEmailVerification(
  email: string,
): Promise<{ code: string; expiresAt: Date }> {
  const normalized = normalizeEmail(email);
  const now = new Date();

  const recent = await prisma.signupEmailVerification.findFirst({
    where: {
      email: normalized,
      verifiedAt: null,
      createdAt: { gte: new Date(now.getTime() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    throw new Error(
      "Aguarde um minuto antes de pedir um novo código.",
    );
  }

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS);

  await prisma.signupEmailVerification.create({
    data: {
      email: normalized,
      codeHash: hashCode(normalized, code),
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export async function verifySignupEmailCode(
  email: string,
  code: string,
): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const sanitized = code.replace(/\D/g, "");
  if (sanitized.length !== 6) return false;

  const row = await prisma.signupEmailVerification.findFirst({
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
      "Muitas tentativas. Peça um novo código.",
    );
  }

  const valid = row.codeHash === hashCode(normalized, sanitized);

  await prisma.signupEmailVerification.update({
    where: { id: row.id },
    data: valid
      ? { attempts: row.attempts + 1, verifiedAt: new Date() }
      : { attempts: row.attempts + 1 },
  });

  return valid;
}

export async function assertEmailVerifiedForSignup(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const since = new Date(Date.now() - VERIFIED_TTL_MS);

  const verified = await prisma.signupEmailVerification.findFirst({
    where: {
      email: normalized,
      verifiedAt: { gte: since },
    },
    orderBy: { verifiedAt: "desc" },
  });

  if (!verified) {
    throw new Error(
      "E-mail ainda não confirmado. Volte e conclua a verificação.",
    );
  }
}
