"use server";

import {
  bundlePrecoExists,
  deleteBundlePreco,
  deletePlanoBase,
  listBundlePrecos,
  listPlanosBase,
  planoBaseExists,
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
import { normalizePricingId } from "./modulos-pricing-utils";

async function requirePricingEditor() {
  const session = await auth();
  const role = session?.user?.platformRole as PlatformRole | undefined;
  if (!role || !canEditModulosPricing(role)) {
    throw new Error("Sem permissão para editar precificação");
  }
}

function revalidateModulos() {
  revalidatePath("/modulos", "layout");
}

export async function saveModuloPrecoAction(input: ModuloPrecoRow) {
  await requirePricingEditor();
  await upsertModuloPreco(input);
  revalidateModulos();
}

export async function savePlanoBaseAction(input: PlanoBaseRow) {
  await requirePricingEditor();
  const id = normalizePricingId(input.id);
  if (!id) throw new Error("Informe um identificador válido para o plano.");
  await upsertPlanoBase({ ...input, id });
  revalidateModulos();
}

export async function createPlanoBaseAction(input: PlanoBaseRow) {
  await requirePricingEditor();
  const id = normalizePricingId(input.id);
  if (!id) throw new Error("Informe um identificador válido para o plano.");
  if (await planoBaseExists(id)) {
    throw new Error(`Já existe um plano com o id "${id}".`);
  }
  await upsertPlanoBase({ ...input, id, ativo: input.ativo ?? true });
  revalidateModulos();
}

export async function deletePlanoBaseAction(id: string) {
  await requirePricingEditor();
  await deletePlanoBase(normalizePricingId(id));
  revalidateModulos();
}

export async function setPlanoBaseAtivoAction(id: string, ativo: boolean) {
  await requirePricingEditor();
  const normalized = normalizePricingId(id);
  const plano = (await listPlanosBase()).find((p) => p.id === normalized);
  if (!plano) throw new Error("Plano não encontrado.");
  await upsertPlanoBase({ ...plano, ativo });
  revalidateModulos();
}

export async function saveBundlePrecoAction(input: BundlePrecoRow) {
  await requirePricingEditor();
  const id = normalizePricingId(input.id);
  if (!id) throw new Error("Informe um identificador válido para o bundle.");
  await upsertBundlePreco({ ...input, id });
  revalidateModulos();
}

export async function createBundlePrecoAction(input: BundlePrecoRow) {
  await requirePricingEditor();
  const id = normalizePricingId(input.id);
  if (!id) throw new Error("Informe um identificador válido para o bundle.");
  if (await bundlePrecoExists(id)) {
    throw new Error(`Já existe um bundle com o id "${id}".`);
  }
  await upsertBundlePreco({ ...input, id, ativo: input.ativo ?? true });
  revalidateModulos();
}

export async function deleteBundlePrecoAction(id: string) {
  await requirePricingEditor();
  await deleteBundlePreco(normalizePricingId(id));
  revalidateModulos();
}

export async function setBundlePrecoAtivoAction(id: string, ativo: boolean) {
  await requirePricingEditor();
  const normalized = normalizePricingId(id);
  const bundle = (await listBundlePrecos()).find((b) => b.id === normalized);
  if (!bundle) throw new Error("Bundle não encontrado.");
  await upsertBundlePreco({ ...bundle, ativo });
  revalidateModulos();
}
