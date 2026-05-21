import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export type SignupDraftPayload = Prisma.JsonObject;

export async function upsertSignupDraft(
  email: string,
  payload: SignupDraftPayload,
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await prisma.signupDraft.upsert({
    where: { email: normalized },
    create: { email: normalized, payload: payload as Prisma.InputJsonValue },
    update: { payload: payload as Prisma.InputJsonValue },
  });
}

export async function getSignupDraft(
  email: string,
): Promise<SignupDraftPayload | null> {
  const normalized = email.trim().toLowerCase();
  const row = await prisma.signupDraft.findUnique({
    where: { email: normalized },
  });
  if (!row?.payload || typeof row.payload !== "object") return null;
  return row.payload as SignupDraftPayload;
}

export async function deleteSignupDraft(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  await prisma.signupDraft.deleteMany({ where: { email: normalized } });
}
