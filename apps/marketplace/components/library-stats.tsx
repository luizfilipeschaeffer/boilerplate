import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LibraryCatalog } from "@/lib/catalog-types";

export function LibraryStats({
  stats,
}: {
  stats: LibraryCatalog["stats"];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Módulos</CardDescription>
          <CardTitle className="text-3xl tabular-nums">{stats.moduleCount}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Pacotes disponíveis no catálogo
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Integradores</CardDescription>
          <CardTitle className="text-3xl tabular-nums">
            {stats.integratorCount}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Conectores e gateways registrados
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Módulos prontos</CardDescription>
          <CardTitle className="text-3xl tabular-nums">
            {stats.implementedModules}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Status implementado no registro
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Integradores prontos</CardDescription>
          <CardTitle className="text-3xl tabular-nums">
            {stats.implementedIntegrators}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Integradores com implementação concluída
        </CardContent>
      </Card>
    </div>
  );
}
