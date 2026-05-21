import { listOrganizationsForAdmin } from "@boilerplate/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function OrganizacoesPage() {
  const orgs = await listOrganizationsForAdmin();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Organizações</CardTitle>
          <CardDescription>
            Tenants, módulos ativos e tamanho da equipe.{" "}
            <Link href="/crm?view=list" className="text-primary underline-offset-4 hover:underline">
              Abrir no CRM
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma organização cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Membros</TableHead>
                  <TableHead>Módulos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.tipoNegocio ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {org._count.memberships}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {org.modulosAtivos.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          org.modulosAtivos.slice(0, 4).map((m) => (
                            <Badge key={m.id} variant="secondary">
                              {m.moduloId}
                            </Badge>
                          ))
                        )}
                        {org.modulosAtivos.length > 4 ? (
                          <Badge variant="outline">
                            +{org.modulosAtivos.length - 4}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
