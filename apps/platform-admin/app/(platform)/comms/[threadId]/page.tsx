import { getCommsThread } from "@boilerplate/db";
import { auth } from "@/auth";
import type { PlatformRole } from "@boilerplate/db";
import { notFound } from "next/navigation";
import { CommsThreadClient } from "@/modules/platform-comms/comms-thread-client";

export const dynamic = "force-dynamic";

export default async function CommsThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_suporte") as PlatformRole;
  const canEdit = ["platform_admin", "platform_comercial", "platform_suporte"].includes(
    role,
  );

  const thread = await getCommsThread(threadId);
  if (!thread) notFound();

  return <CommsThreadClient thread={thread} canEdit={canEdit} />;
}
