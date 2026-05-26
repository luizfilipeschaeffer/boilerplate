import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpdeskInboxClient } from "@/components/helpdesk/helpdesk-inbox-client";
import {
  listHelpdeskQueuesAction,
  listHelpdeskTicketsAction,
} from "@/app/actions/helpdesk";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { roleHasModulePermission } from "@/lib/module-permissions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HelpdeskPage() {
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

  if (!activeIds.includes("crm-helpdesk")) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Help Desk TI</CardTitle>
            <CardDescription>
              O módulo Help Desk não está ativo para este setor.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!roleHasModulePermission(role, "crm-helpdesk", "ver")) {
    redirect("/dashboard");
  }

  const canEdit = roleHasModulePermission(role, "crm-helpdesk", "editar");
  const [tickets, queues] = await Promise.all([
    listHelpdeskTicketsAction(),
    listHelpdeskQueuesAction(),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Help Desk TI</CardTitle>
          <CardDescription>
            Atendimentos, filas e SLA do suporte interno.
            {!canEdit ? " (somente leitura)" : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HelpdeskInboxClient
            tickets={tickets}
            queues={queues}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
