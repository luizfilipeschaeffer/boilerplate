import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Boxes, Layers, TrendingUp } from "lucide-react";

type MetricCard = {
  title: string;
  value: string;
  footerPrimary: string;
  footerSecondary: string;
  trend?: string;
};

const metrics: MetricCard[] = [
  {
    title: "Módulos ativos",
    value: "15",
    footerPrimary: "Catálogo, vendas, fiscal e mais",
    footerSecondary: "Lista fixa no MVP (dev)",
    trend: "+3",
  },
  {
    title: "Fase atual",
    value: "1",
    footerPrimary: "Operação básica",
    footerSecondary: "Evolução por tipo de negócio",
  },
  {
    title: "Tenant",
    value: "Dev",
    footerPrimary: "Schema dedicado",
    footerSecondary: "PostgreSQL multi-tenant",
  },
  {
    title: "Próximo passo",
    value: "Onboarding",
    footerPrimary: "Cadastre produto ou cliente",
    footerSecondary: "Fluxo guiado em breve",
  },
];

export function SectionCards({ moduleCount }: { moduleCount: number }) {
  const items = metrics.map((m, i) =>
    i === 0 ? { ...m, value: String(moduleCount) } : m,
  );

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <h2 className="text-lg font-semibold tracking-tight">Visão geral</h2>
      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {items.map((metric) => (
          <Card key={metric.title} className="@container/card">
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction className="row-span-2">
                {metric.trend ? (
                  <Badge variant="outline">
                    <TrendingUp className="size-3" />
                    {metric.trend}
                  </Badge>
                ) : (
                  <Layers className="size-7 text-muted-foreground/50" aria-hidden />
                )}
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-2 font-medium">{metric.footerPrimary}</div>
              <div className="text-muted-foreground">{metric.footerSecondary}</div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Boxes className="size-4" />
        <span>Plataforma modular adaptativa — Boilerplate</span>
      </div>
    </div>
  );
}
