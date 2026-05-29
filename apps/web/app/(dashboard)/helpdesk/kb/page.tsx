import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpdeskKbListClient } from "@/components/helpdesk/helpdesk-kb-list-client";
import { listHelpdeskKbAction } from "@/app/actions/helpdesk";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { roleHasModulePermission } from "@/lib/module-permissions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HelpdeskKbPage() {
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

  const entries = await listHelpdeskKbAction("published");
  const canEdit = roleHasModulePermission(role, "crm-helpdesk", "editar");

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Base de conhecimento</CardTitle>
          <CardDescription>
            Artigos e threads com problemas e soluções para o time de TI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HelpdeskKbListClient entries={entries} canEdit={canEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
