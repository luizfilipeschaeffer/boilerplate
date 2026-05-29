"use server";

import {
  aggregatePlatformHelpdeskStats,
  createTicketFromCommsThread,
  getHelpdeskTicket,
  linkCommsThreadToTicket,
  prisma,
} from "@boilerplate/db";
import type { PlatformRole } from "@boilerplate/db";
import { auth } from "@/auth";
import { canAccessPlatformModule } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

async function requireHelpdeskAccess() {
  const session = await auth();
  const role = session?.user?.platformRole as PlatformRole | undefined;
  if (
    !role ||
    (!canAccessPlatformModule(role, "platform-helpdesk") &&
      !canAccessPlatformModule(role, "organizacoes"))
  ) {
    throw new Error("Sem permissão");
  }
  return { role };
}

export async function aggregatePlatformHelpdeskAction() {
  await requireHelpdeskAccess();
  return aggregatePlatformHelpdeskStats();
}

export async function createTicketFromCommsThreadAction(
  threadId: string,
  title: string,
  description: string,
) {
  await requireHelpdeskAccess();
  const result = await createTicketFromCommsThread(threadId, {
    title,
    description,
  });
  revalidatePath("/comms");
  revalidatePath(`/comms/${threadId}`);
  revalidatePath("/helpdesk");
  return result;
}

export async function getTenantHelpdeskTicketForPlatformAction(
  organizationId: string,
  ticketId: string,
) {
  await requireHelpdeskAccess();
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { schemaName: true },
  });
  if (!org?.schemaName) return null;
  return getHelpdeskTicket(org.schemaName, organizationId, ticketId);
}

export async function linkCommsToHelpdeskTicketAction(
  threadId: string,
  organizationId: string,
  ticketId: string,
) {
  await requireHelpdeskAccess();
  const ok = await linkCommsThreadToTicket(threadId, organizationId, ticketId);
  revalidatePath(`/comms/${threadId}`);
  return ok;
}
