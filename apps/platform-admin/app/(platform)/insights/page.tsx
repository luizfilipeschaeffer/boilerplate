import { getInsightsDemanda } from "@boilerplate/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const demandas = await getInsightsDemanda();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Insights de produto</CardTitle>
          <CardDescription>
            Agregação de modulo_demanda e sinais de adoção (PRD §17.4).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {demandas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {demandas.map((d) => (
                <li key={d.moduloId} className="flex justify-between gap-4">
                  <span className="font-medium">{d.moduloId}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {d.count} org(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
