import { handlePaymentWebhook } from "@boilerplate/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ integratorId: string }> },
) {
  const { integratorId } = await ctx.params;
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const result = await handlePaymentWebhook(integratorId, payload);
  if (!result.ok) {
    return NextResponse.json({ received: false }, { status: 400 });
  }
  return NextResponse.json({
    received: true,
    organizationId: result.organizationId,
  });
}
