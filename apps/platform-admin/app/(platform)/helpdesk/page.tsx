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
import { aggregatePlatformHelpdeskAction } from "@/app/actions/helpdesk";

export const dynamic = "force-dynamic";

export default async function PlatformHelpdeskPage() {
  const stats = await aggregatePlatformHelpdeskAction();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Help Desk — visão plataforma</CardTitle>
          <CardDescription>
            Tickets abertos nos tenants com atividade de suporte (agregado).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <p>
              <span className="text-muted-foreground">Abertos: </span>
              <strong>{stats.totalOpen}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">SLA estourado: </span>
              <strong>{stats.totalSlaBreached}</strong>
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Abertos</TableHead>
                <TableHead>SLA estourado</TableHead>
                <TableHead>CSAT médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Nenhum ticket ativo nos tenants provisionados.
                  </TableCell>
                </TableRow>
              ) : (
                stats.organizations.map((o) => (
                  <TableRow key={o.organizationId}>
                    <TableCell className="font-medium">
                      {o.organizationName}
                    </TableCell>
                    <TableCell>{o.openTickets}</TableCell>
                    <TableCell>{o.slaBreached}</TableCell>
                    <TableCell>
                      {o.csatAverage != null ? o.csatAverage : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
