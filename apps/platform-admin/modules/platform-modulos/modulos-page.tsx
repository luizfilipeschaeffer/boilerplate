import {
  getModuloAtivacaoCounts,
  listBundlePrecos,
  listModuloPrecos,
  listPlanosBase,
  seedDefaultPricingIfEmpty,
  type PlatformRole,
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
import { canEditModulosPricing } from "./can-edit-modulos";
import { ModulosManagerClient } from "./modulos-manager-client";

export const dynamic = "force-dynamic";

export default async function ModulosManagerPage() {
  const session = await auth();
  const role = (session?.user?.platformRole ?? "platform_produto") as PlatformRole;
  const canEdit = canEditModulosPricing(role);

  await seedDefaultPricingIfEmpty();
  registerAllModules();

  const [modules, precos, planos, bundles, ativacoes] = await Promise.all([
    Promise.resolve(getAllModules()),
    listModuloPrecos(),
    listPlanosBase(),
    listBundlePrecos(),
    getModuloAtivacaoCounts(),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciador de módulos</CardTitle>
          <CardDescription>
            Central de precificação (PRD §12): custos por módulo, planos base,
            bundles fiscais e visão de ativações nos tenants.
            {!canEdit ? " Somente leitura." : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModulosManagerClient
            modules={modules.sort((a, b) => a.name.localeCompare(b.name))}
            precos={precos}
            planos={planos}
            bundles={bundles}
            ativacoes={ativacoes}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
