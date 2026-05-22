import { getOrganizationAdminDetail } from "@boilerplate/db";
import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function OrganizacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await getOrganizationAdminDetail(id);
  if (!org) notFound();

  const modulesBySector = new Map<string, string[]>();
  for (const s of org.sectors) {
    const ids = s.sectorModules.map((sm) => sm.moduleId);
    modulesBySector.set(s.slug, ids);
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8 lg:px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/organizacoes" className="hover:underline">
          Organizações
        </Link>
        <span>/</span>
        <span>{org.name}</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{org.name}</CardTitle>
          <CardDescription>
            {org.tipoNegocio} · Fase {org.phase} · {org._count.memberships}{" "}
            membros · schema {org.schemaName}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1">
          {org.modulosAtivos.map((m) => (
            <Badge key={m.id} variant="secondary">
              {m.moduloId}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Filiais</CardTitle>
            <CardDescription>Multi-loja (ops-multi-loja)</CardDescription>
          </CardHeader>
          <CardContent>
            {org.branches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma filial.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {org.branches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.slug}
                      </TableCell>
                      <TableCell>
                        {b.isDefault ? (
                          <Badge>Matriz</Badge>
                        ) : b.active ? (
                          <Badge variant="secondary">Ativa</Badge>
                        ) : (
                          <Badge variant="outline">Inativa</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setores tenant</CardTitle>
            <CardDescription>Módulos por setor (subset da org)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {org.sectors.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum setor.</p>
            ) : (
              org.sectors.map((s) => (
                <div key={s.id} className="rounded-lg border p-3">
                  <p className="font-medium">
                    {s.name}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({s.slug})
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(modulesBySector.get(s.slug)?.length
                      ? modulesBySector.get(s.slug)
                      : org.modulosAtivos.map((m) => m.moduloId)
                    )?.map((mid) => (
                      <Badge key={mid} variant="outline">
                        {mid}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convites de vendedor pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {org.sellerInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum convite aberto.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Vendedor (tenant)</TableHead>
                  <TableHead>Expira</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.sellerInvites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {inv.tenantSellerId}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.expiresAt.toLocaleDateString("pt-BR")}
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
