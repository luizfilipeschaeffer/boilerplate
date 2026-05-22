"use server";

import { auth } from "@/auth";
import { sendOrganizationMemberInviteEmail } from "@/app/actions/member-invite-email";
import {
  createOrganizationMember,
  getMemberAccessDetail,
  getOrganizationById,
  listOrganizationMembers,
  saveMemberAccess,
  type MemberRole,
  type SaveMemberAccessInput,
} from "@boilerplate/db";
import { getModulesByIds } from "@boilerplate/module-registry";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { revalidatePath } from "next/cache";

async function requireManager() {
  const session = await auth();
  const orgId = session?.organizationId;
  const role = session?.role ?? "dono";
  if (!orgId) throw new Error("Organização não disponível");
  if (role !== "dono" && role !== "gerente") {
    throw new Error("Sem permissão para gerenciar membros");
  }
  return { orgId, session };
}

export async function listMembersAction() {
  const { orgId } = await requireManager();
  return listOrganizationMembers(orgId);
}

export async function getMemberDetailAction(membershipId: string) {
  const { orgId } = await requireManager();
  ensureModulesRegistered();
  const detail = await getMemberAccessDetail(membershipId, orgId);
  if (!detail) return null;

  const allModuleIds = [
    ...new Set(detail.sectors.flatMap((s) => s.modules.map((m) => m.moduleId))),
  ];
  const defs = getModulesByIds(allModuleIds);
  const names: Record<string, string> = {};
  for (const id of allModuleIds) {
    names[id] = defs.find((d) => d.id === id)?.name ?? id;
  }

  return { ...detail, moduleNames: names };
}

export async function createMemberAction(data: {
  email: string;
  name?: string;
  role: MemberRole;
  sectorIds?: string[];
  sendInvite?: boolean;
}) {
  const { orgId } = await requireManager();
  const member = await createOrganizationMember(orgId, data);

  let invite:
    | Awaited<ReturnType<typeof sendOrganizationMemberInviteEmail>>
    | undefined;

  if (data.sendInvite !== false) {
    const org = await getOrganizationById(orgId);
    invite = await sendOrganizationMemberInviteEmail({
      email: data.email,
      name: data.name,
      role: data.role,
      organizationName: org?.name ?? "sua organização",
    });
  }

  revalidatePath("/configuracoes/membros");
  return { member, invite };
}

export async function saveMemberAccessAction(
  membershipId: string,
  input: SaveMemberAccessInput,
) {
  const { orgId } = await requireManager();
  await saveMemberAccess(membershipId, orgId, input);
  revalidatePath("/configuracoes/membros");
}

export async function resendMemberInviteAction(membershipId: string) {
  const { orgId } = await requireManager();
  const detail = await getMemberAccessDetail(membershipId, orgId);
  if (!detail) throw new Error("Membro não encontrado");
  if (detail.role === "dono") {
    throw new Error("Não é possível reenviar convite para o dono");
  }
  if (detail.hasPassword) {
    throw new Error("Este membro já definiu senha de acesso");
  }
  if (!detail.active) {
    throw new Error("Reative o membro antes de reenviar o convite");
  }

  const org = await getOrganizationById(orgId);
  return sendOrganizationMemberInviteEmail({
    email: detail.email,
    name: detail.name,
    role: detail.role,
    organizationName: org?.name ?? "sua organização",
  });
}

