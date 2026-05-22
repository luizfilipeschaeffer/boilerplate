"use server";

import {
  createCommsThread,
  listCommsThreads,
  sendCommsMessage,
  registerCommsConsent,
  getCommsThread,
  type CommsChannel,
  type PlatformRole,
} from "@boilerplate/db";
import { auth } from "@/auth";
import { canAccessPlatformModule } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

async function requireCommsAccess() {
  const session = await auth();
  const role = session?.user?.platformRole as PlatformRole | undefined;
  if (!role || !canAccessPlatformModule(role, "platform-comms")) {
    throw new Error("Sem permissão para comunicação");
  }
  return {
    platformUserId: session?.user?.id,
    role,
  };
}

export async function listCommsThreadsAction(filters?: {
  organizationId?: string;
  platformLeadId?: string;
  channel?: CommsChannel;
}) {
  await requireCommsAccess();
  return listCommsThreads(filters);
}

export async function getCommsThreadAction(threadId: string) {
  await requireCommsAccess();
  return getCommsThread(threadId);
}

export async function createCommsThreadAction(input: {
  subject: string;
  channel: CommsChannel;
  participantKind?: "client" | "internal";
  organizationId?: string;
  platformLeadId?: string;
  peerPlatformUserId?: string;
  initialBody?: string;
  toLabel?: string;
  registerConsent?: boolean;
}) {
  const { platformUserId } = await requireCommsAccess();
  const threadId = await createCommsThread({
    subject: input.subject,
    channel: input.channel,
    participantKind: input.participantKind,
    organizationId: input.organizationId,
    platformLeadId: input.platformLeadId,
    peerPlatformUserId: input.peerPlatformUserId,
    assignedPlatformUserId: platformUserId,
    initialBody: input.initialBody,
    fromLabel: "Equipe Plataforma",
    toLabel: input.toLabel,
  });
  if (input.registerConsent && input.channel !== "internal") {
    await registerCommsConsent({
      channel: input.channel,
      organizationId: input.organizationId,
      platformLeadId: input.platformLeadId,
    });
  }
  revalidatePath("/comms");
  return threadId;
}

export async function sendCommsMessageAction(
  threadId: string,
  body: string,
  direction: "inbound" | "outbound" = "outbound",
) {
  const { platformUserId } = await requireCommsAccess();
  await sendCommsMessage({
    threadId,
    direction,
    body,
    fromLabel: direction === "outbound" ? "Equipe Plataforma" : "Cliente",
    platformUserId,
  });
  revalidatePath("/comms");
  revalidatePath(`/comms/${threadId}`);
}
