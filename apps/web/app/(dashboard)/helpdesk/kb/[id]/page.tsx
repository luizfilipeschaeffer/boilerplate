import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpdeskKbDetailClient } from "@/components/helpdesk/helpdesk-kb-detail-client";
import { getHelpdeskKbAction } from "@/app/actions/helpdesk";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { roleHasModulePermission } from "@/lib/module-permissions";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HelpdeskKbDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.organizationId) redirect("/login");

  const role = session.role ?? "dono";
  const sectorId = session.sectorId ?? "geral";
  const activeIds = await getActiveModuleIds(
    session.organizationId,
    sectorId,
    role,
    session.user?.id,
  );
  if (!activeIds.includes("crm-helpdesk")) redirect("/helpdesk");
  if (!roleHasModulePermission(role, "crm-helpdesk", "ver")) {
    redirect("/dashboard");
  }

  const entry = await getHelpdeskKbAction(id);
  if (!entry) notFound();

  const canEdit = roleHasModulePermission(role, "crm-helpdesk", "editar");

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>{entry.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <HelpdeskKbDetailClient entry={entry} canEdit={canEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
