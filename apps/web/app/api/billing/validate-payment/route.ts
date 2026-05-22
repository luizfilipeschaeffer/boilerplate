import { auth } from "@/auth";
import {
  getMembershipForUser,
  setTenantPaymentIntegrator,
  startPaymentValidation,
} from "@boilerplate/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const membership = await getMembershipForUser(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Sem organização" }, { status: 400 });
  }

  let integratorId: string | undefined;
  try {
    const body = (await req.json()) as { integratorId?: string };
    integratorId = body.integratorId;
  } catch {
    /* body opcional */
  }

  if (integratorId) {
    await setTenantPaymentIntegrator(membership.organizationId, integratorId);
  }

  const result = await startPaymentValidation(
    membership.organizationId,
    session.user.email,
    session.user.name ?? session.user.email,
  );

  return NextResponse.json(result);
}
