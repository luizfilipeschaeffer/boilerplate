import { auth } from "@/auth";
import { assertActiveMembership, createSale } from "@boilerplate/db";
import { emitAndPersist } from "@/lib/events/emit";
import {
  collectAllowedCorsOrigins,
  corsHeadersForRequest,
  handleCorsPreflight,
  toClientError,
} from "@boilerplate/shared/security";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z
  .object({
    clientId: z
      .union([z.string().uuid(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v == null ? null : v)),
    paymentMethod: z.enum([
      "dinheiro",
      "pix",
      "cartao_credito",
      "cartao_debito",
      "outro",
    ]),
    lines: z
      .array(
        z.object({
          catalogItemId: z.string().uuid(),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
    idempotencyKey: z.string().uuid().optional().nullable(),
  })
  .strict();

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const preflight = handleCorsPreflight(origin, collectAllowedCorsOrigins());
  return preflight ?? new Response(null, { status: 403 });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const cors = corsHeadersForRequest(origin, collectAllowedCorsOrigins());

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || session?.needsOnboarding) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401, headers: cors });
  }

  let membership;
  try {
    membership = await assertActiveMembership(userId);
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401, headers: cors });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400, headers: cors });
  }

  try {
    const sale = await createSale(membership.schemaName, {
      clientId: parsed.data.clientId ?? null,
      paymentMethod: parsed.data.paymentMethod,
      lines: parsed.data.lines,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    await emitAndPersist({
      type: "venda.confirmada",
      organizationId: membership.organizationId,
      schemaName: membership.schemaName,
      payload: {
        saleId: sale.id,
        totalCents: sale.total_cents,
        offline: true,
      },
    });

    return NextResponse.json({ ok: true, saleId: sale.id }, { headers: cors });
  } catch (e) {
    return NextResponse.json(
      { error: toClientError(e) },
      { status: 400, headers: cors },
    );
  }
}
