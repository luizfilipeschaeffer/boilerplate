import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HelpdeskTicketClient } from "@/components/helpdesk/helpdesk-ticket-client";
import {
  getHelpdeskTicketAction,
  listHelpdeskMembersAction,
} from "@/app/actions/helpdesk";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { roleHasModulePermission } from "@/lib/module-permissions";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HelpdeskTicketPage({
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

  const [ticket, members] = await Promise.all([
    getHelpdeskTicketAction(id),
    listHelpdeskMembersAction(),
  ]);
  if (!ticket) notFound();

  const canEdit = roleHasModulePermission(role, "crm-helpdesk", "editar");

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Ticket #{ticket.number}</CardTitle>
        </CardHeader>
        <CardContent>
          <HelpdeskTicketClient
            ticket={ticket}
            canEdit={canEdit}
            members={members}
          />
        </CardContent>
      </Card>
    </div>
  );
}
