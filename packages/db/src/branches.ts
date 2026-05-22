import { randomUUID } from "node:crypto";
import { prisma } from "./client";

export interface BranchRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  active: boolean;
  is_default: boolean;
}

export async function listBranches(organizationId: string): Promise<BranchRow[]> {
  const rows = await prisma.branch.findMany({
    where: { organizationId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    organization_id: r.organizationId,
    name: r.name,
    slug: r.slug,
    active: r.active,
    is_default: r.isDefault,
  }));
}

export async function getDefaultBranch(
  organizationId: string,
): Promise<BranchRow | null> {
  const row = await prisma.branch.findFirst({
    where: { organizationId, isDefault: true, active: true },
  });
  if (!row) {
    const fallback = await prisma.branch.findFirst({
      where: { organizationId, active: true },
      orderBy: { createdAt: "asc" },
    });
    if (!fallback) return null;
    return {
      id: fallback.id,
      organization_id: fallback.organizationId,
      name: fallback.name,
      slug: fallback.slug,
      active: fallback.active,
      is_default: fallback.isDefault,
    };
  }
  return {
    id: row.id,
    organization_id: row.organizationId,
    name: row.name,
    slug: row.slug,
    active: row.active,
    is_default: row.isDefault,
  };
}

export async function createBranch(
  organizationId: string,
  input: { name: string; slug?: string; isDefault?: boolean },
): Promise<BranchRow> {
  const name = input.name.trim();
  if (!name) throw new Error("Nome da filial é obrigatório");
  const slug =
    input.slug?.trim() ||
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    "filial";

  if (input.isDefault) {
    await prisma.branch.updateMany({
      where: { organizationId },
      data: { isDefault: false },
    });
  }

  const row = await prisma.branch.create({
    data: {
      id: randomUUID(),
      organizationId,
      name,
      slug,
      isDefault: input.isDefault ?? false,
    },
  });

  return {
    id: row.id,
    organization_id: row.organizationId,
    name: row.name,
    slug: row.slug,
    active: row.active,
    is_default: row.isDefault,
  };
}

export async function ensureDefaultBranch(organizationId: string): Promise<BranchRow> {
  const existing = await getDefaultBranch(organizationId);
  if (existing) return existing;
  return createBranch(organizationId, {
    name: "Matriz",
    slug: "matriz",
    isDefault: true,
  });
}

export async function updateBranch(
  id: string,
  organizationId: string,
  input: { name?: string; active?: boolean; isDefault?: boolean },
): Promise<void> {
  if (input.isDefault) {
    await prisma.branch.updateMany({
      where: { organizationId },
      data: { isDefault: false },
    });
  }
  await prisma.branch.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      active: input.active,
      isDefault: input.isDefault,
    },
  });
}
