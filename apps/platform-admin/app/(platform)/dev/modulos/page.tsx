import { prisma } from "@boilerplate/db";
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

export default async function DevModulosPage() {
  const devs = await prisma.developerAccount.findMany({
    include: { roles: true },
    orderBy: { displayName: "asc" },
  });

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Desenvolvedores</CardTitle>
          <CardDescription>
            Contas da comunidade e módulos mantidos (sem dados operacionais de clientes).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>GitHub</TableHead>
                <TableHead>Módulos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.displayName}</TableCell>
                  <TableCell>{d.githubUsername ?? "—"}</TableCell>
                  <TableCell>
                    {d.roles.map((r) => `${r.moduleId} (${r.role})`).join(", ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
              {devs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Nenhum desenvolvedor cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
