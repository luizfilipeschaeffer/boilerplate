import {
  backfillOrganizationCrmStages,
  createPlatformCrmRepository,
} from "@boilerplate/db";
import { registerAllModules, getAllModules } from "@boilerplate/module-registry";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/auth";
import type { PlatformRole } from "@boilerplate/db";
import { canEditCrm } from "./can-edit-crm";
import { PlatformCrmBoardClient } from "./crm-board-client";
import type { CrmBoardView } from "@boilerplate/crm-ui";

export const dynamic = "force-dynamic";

function buildModuleLabels(): Record<string, string> {
  registerAllModules();
  const labels: Record<string, string> = {};
  for (const mod of getAllModules()) {
    labels[mod.id] = mod.name;
  }
  return labels;
}

export default async function PlatformCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  const canEdit = canEditCrm(role);
  const params = await searchParams;
  const initialView =
    params.view === "list" || params.view === "phase" || params.view === "pipeline"
      ? (params.view as CrmBoardView)
      : "pipeline";

  await backfillOrganizationCrmStages();
  const records = await createPlatformCrmRepository().listBoardRecords();
  const moduleLabels = buildModuleLabels();
  const availableModuleIds = getAllModules().map((m) => m.id);

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>CRM da plataforma</CardTitle>
          <CardDescription>
            Leads, organizações SaaS, fases de maturidade e módulos ativos.
            {!canEdit ? " (somente leitura)" : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformCrmBoardClient
            records={records}
            initialView={initialView}
            canEdit={canEdit}
            moduleLabels={moduleLabels}
            availableModuleIds={availableModuleIds}
          />
        </CardContent>
      </Card>
    </div>
  );
}
