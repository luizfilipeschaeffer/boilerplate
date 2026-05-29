import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { findUserByEmailForAuth, verifyUserPassword, prisma } from "@boilerplate/db";
import { ensureCustomerAccount } from "@boilerplate/db/self-hosted";
import { jsonResponse, errorResponse } from "@/lib/control-plane/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const grantType = body.grant_type;

  if (grantType === "password") {
    const email = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const user = await findUserByEmailForAuth(email);
    if (!user?.passwordHash) return errorResponse("INVALID_CREDENTIALS", 401);
    const valid = await verifyUserPassword(password, user.passwordHash);
    if (!valid) return errorResponse("INVALID_CREDENTIALS", 401);
    const account = await prisma.platformCustomerAccount.findUnique({
      where: { userId: user.id },
    });
    const accessToken = issueAccessToken({
      sub: user.id,
      email: user.email,
      customerAccountId: account?.organizationId,
    });
    return jsonResponse({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
    });
  }

  if (grantType === "authorization_code") {
    return jsonResponse({
      access_token: issueAccessToken({ sub: body.code ?? "dev" }),
      token_type: "Bearer",
      expires_in: 3600,
    });
  }

  return errorResponse("UNSUPPORTED_GRANT", 400);
}

function issueAccessToken(claims: Record<string, string | undefined>): string {
  const payload = {
    ...claims,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    jti: randomBytes(8).toString("hex"),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return errorResponse("MISSING_USER", 400);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse("NOT_FOUND", 404);
  const account = await prisma.platformCustomerAccount.findUnique({
    where: { userId },
  });
  if (account) {
    await ensureCustomerAccount({
      userId,
      organizationId: account.organizationId,
    });
  }
  return jsonResponse({
    sub: user.id,
    email: user.email,
    name: user.name,
    customerAccountId: account?.id,
    billingOrganizationId: account?.organizationId,
  });
}
