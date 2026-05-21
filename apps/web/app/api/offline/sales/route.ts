import { auth } from "@/auth";
import { createSale, getOrganizationById } from "@boilerplate/db";
import { emitAndPersist } from "@/lib/events/emit";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
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
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.organizationId || session.needsOnboarding) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const org = await getOrganizationById(session.organizationId);
  if (!org) {
    return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
  }

  try {
    const sale = await createSale(org.schemaName, {
      clientId: parsed.data.clientId ?? null,
      paymentMethod: parsed.data.paymentMethod,
      lines: parsed.data.lines,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    await emitAndPersist({
      type: "venda.confirmada",
      organizationId: org.id,
      schemaName: org.schemaName,
      payload: {
        saleId: sale.id,
        totalCents: sale.total_cents,
        offline: true,
      },
    });

    return NextResponse.json({ ok: true, saleId: sale.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao criar venda" },
      { status: 400 },
    );
  }
}
