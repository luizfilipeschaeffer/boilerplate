"use server";

import { acceptSellerInvite, findSellerInviteByToken } from "@boilerplate/db";

export async function getSellerInviteAction(token: string) {
  const invite = await findSellerInviteByToken(token.trim());
  if (!invite) return null;
  if (invite.acceptedAt) return { status: "accepted" as const, email: invite.email };
  if (invite.expiresAt < new Date()) {
    return { status: "expired" as const, email: invite.email };
  }
  return { status: "pending" as const, email: invite.email };
}

export async function acceptSellerInviteAction(data: {
  token: string;
  password: string;
  name?: string;
}) {
  return acceptSellerInvite(data);
}
