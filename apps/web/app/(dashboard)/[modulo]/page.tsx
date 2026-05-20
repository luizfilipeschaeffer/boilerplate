import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ensureModulesRegistered } from "@/lib/modules/init";
import { notFound } from "next/navigation";

export default async function ModuloPage({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  ensureModulesRegistered();
  const { modulo: slug } = await params;

  const all = await import("@boilerplate/module-registry").then((m) =>
    m.getAllModules(),
  );
  const found = all.find(
    (m) => m.id === slug || m.routes.some((r) => r.path === `/${slug}`),
  );

  if (!found) notFound();

  const isScaffold = found.implementationStatus === "scaffold";

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>{found.name}</CardTitle>
          <CardDescription>
            {isScaffold
              ? "Módulo em desenvolvimento — conteúdo em breve."
              : "Módulo ativo no tenant."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">ID:</span> {found.id}
          </p>
          {found.parentModuleId ? (
            <p>
              <span className="font-medium text-foreground">Pai:</span>{" "}
              {found.parentModuleId}
            </p>
          ) : null}
          {found.fiscalCapability ? (
            <p>
              <span className="font-medium text-foreground">Fiscal:</span>{" "}
              {found.fiscalCapability}
            </p>
          ) : null}
          <p>
            <span className="font-medium text-foreground">Status:</span>{" "}
            {found.implementationStatus}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
