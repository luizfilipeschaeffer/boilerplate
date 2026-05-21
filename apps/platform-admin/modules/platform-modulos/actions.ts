"use server";

import {
  upsertBundlePreco,
  upsertModuloPreco,
  upsertPlanoBase,
  type BundlePrecoRow,
  type ModuloPrecoRow,
  type PlanoBaseRow,
  type PlatformRole,
} from "@boilerplate/db";
import { auth } from "@/auth";
import { canEditModulosPricing } from "./can-edit-modulos";
import { revalidatePath } from "next/cache";

async function requirePricingEditor() {
  const session = await auth();
  const role = session?.user?.platformRole as PlatformRole | undefined;
  if (!role || !canEditModulosPricing(role)) {
    throw new Error("Sem permissão para editar precificação");
  }
}

export async function saveModuloPrecoAction(input: ModuloPrecoRow) {
  await requirePricingEditor();
  await upsertModuloPreco(input);
  revalidatePath("/modulos");
}

export async function savePlanoBaseAction(input: PlanoBaseRow) {
  await requirePricingEditor();
  await upsertPlanoBase(input);
  revalidatePath("/modulos");
}

export async function saveBundlePrecoAction(input: BundlePrecoRow) {
  await requirePricingEditor();
  await upsertBundlePreco(input);
  revalidatePath("/modulos");
}
