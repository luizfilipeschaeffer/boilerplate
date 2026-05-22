import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TenantCrmBoardClient } from "@/components/crm/tenant-crm-board-client";
import {
  listCrmBoardAction,
  listCrmClientsForDealAction,
} from "@/app/actions/crm";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { roleHasModulePermission } from "@/lib/module-permissions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
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

  if (!activeIds.includes("core-crm")) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>CRM Comercial</CardTitle>
            <CardDescription>
              O módulo CRM não está ativo para este setor. Ative em Configurações →
              Setores e módulos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!roleHasModulePermission(role, "core-crm", "ver")) {
    redirect("/dashboard");
  }

  const canEdit = roleHasModulePermission(role, "core-crm", "editar");
  const [records, clients] = await Promise.all([
    listCrmBoardAction(),
    listCrmClientsForDealAction(),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>CRM Comercial</CardTitle>
          <CardDescription>
            Pipeline de leads e oportunidades vinculadas aos clientes.
            {!canEdit ? " (somente leitura)" : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantCrmBoardClient
            records={records}
            canEdit={canEdit}
            clients={clients}
          />
        </CardContent>
      </Card>
    </div>
  );
}
