import { handlePaymentWebhook } from "@boilerplate/db";
import { verifyWebhookSignature } from "@boilerplate/shared/security";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ integratorId: string }> },
) {
  const { integratorId } = await ctx.params;
  const rawBody = await req.text();

  const signature =
    req.headers.get("x-webhook-signature") ??
    req.headers.get("x-hub-signature-256");

  const secret =
    process.env.PAYMENT_WEBHOOK_SECRET ??
    process.env[`PAYMENT_WEBHOOK_SECRET_${integratorId.toUpperCase()}`];

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ received: false }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    payload = {};
  }

  const result = await handlePaymentWebhook(integratorId, payload);
  if (!result.ok) {
    return NextResponse.json({ received: false }, { status: 400 });
  }
  return NextResponse.json({ received: true });
}
