import {
  createCatalogItem,
  deleteCatalogItem,
  getOrganizationById,
  listCatalogItems,
} from "@boilerplate/db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { tenantProcedure, router } from "../init";

export const catalogRouter = router({
  list: tenantProcedure.query(async ({ ctx }) => {
    const org = await getOrganizationById(ctx.organizationId);
    if (!org) throw new TRPCError({ code: "NOT_FOUND" });
    const items = await listCatalogItems(org.schemaName);
    return items.map((row) => ({
      id: row.id,
      name: row.name,
      itemType: row.item_type as "produto" | "servico",
      sku: row.sku,
      priceCents: row.price_cents,
      createdAt: row.created_at,
    }));
  }),

  create: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        itemType: z.enum(["produto", "servico"]),
        sku: z.string().max(64).optional().nullable(),
        priceCents: z.number().int().min(0).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganizationById(ctx.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      const row = await createCatalogItem(org.schemaName, {
        name: input.name,
        itemType: input.itemType,
        sku: input.sku,
        priceCents: input.priceCents,
      });
      return {
        id: row.id,
        name: row.name,
        itemType: row.item_type,
        sku: row.sku,
        priceCents: row.price_cents,
      };
    }),

  remove: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const org = await getOrganizationById(ctx.organizationId);
      if (!org) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteCatalogItem(org.schemaName, input.id);
      return { ok: true };
    }),
});
