import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Circle,
  Package,
  ShoppingCart,
  Sparkles,
  Users,
  Warehouse,
} from "lucide-react";

import {
  FASE1_MISSIONS,
  firstNameFrom,
  type MissionId,
} from "@/lib/missions/catalog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MISSION_ICONS: Record<MissionId, LucideIcon> = {
  primeiro_cliente: Users,
  primeiro_produto: Package,
  primeira_venda: ShoppingCart,
  ver_estoque: Warehouse,
  conhecer_aprendiz: Sparkles,
};

export function DashboardHome({
  userName,
  organizationName,
  completedIds,
}: {
  userName: string;
  organizationName: string;
  completedIds: string[];
}) {
  const completed = new Set(completedIds);
  const total = FASE1_MISSIONS.length;
  const doneCount = FASE1_MISSIONS.filter((m) => completed.has(m.id)).length;
  const allDone = doneCount === total;
  const nextMission = FASE1_MISSIONS.find((m) => !completed.has(m.id));

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {firstNameFrom(userName)}!
        </h1>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          {allDone ? (
            <>
              Você conheceu o essencial de{" "}
              <span className="font-medium text-foreground">
                {organizationName}
              </span>
              . Use o menu ao lado quando quiser.
            </>
          ) : (
            <>
              Vamos deixar{" "}
              <span className="font-medium text-foreground">
                {organizationName}
              </span>{" "}
              pronto em poucos passos — cada um leva menos de um minuto.
            </>
          )}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Seus primeiros passos</CardTitle>
          <CardDescription>
            {doneCount} de {total} concluídos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={total}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
            />
          </div>

          <ul className="flex flex-col gap-3">
            {FASE1_MISSIONS.map((mission, index) => {
              const isDone = completed.has(mission.id);
              const isNext = nextMission?.id === mission.id;
              const Icon = MISSION_ICONS[mission.id];

              return (
                <li
                  key={mission.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                    isDone && "border-primary/20 bg-primary/5",
                    isNext && !isDone && "border-primary/40 ring-1 ring-primary/20",
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        isDone
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-5" aria-hidden />
                      ) : (
                        <span className="text-sm font-semibold tabular-nums">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">{mission.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {mission.description}
                      </p>
                    </div>
                  </div>

                  {isDone ? (
                    <span className="flex items-center gap-1.5 text-sm text-primary sm:shrink-0">
                      <CheckCircle2 className="size-4" />
                      Feito
                    </span>
                  ) : (
                    <Button
                      nativeButton={false}
                      render={<Link href={mission.href} />}
                      className="w-full sm:w-auto"
                      variant={isNext ? "default" : "outline"}
                    >
                      <Icon className="mr-2 size-4" />
                      {mission.cta}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {nextMission && !allDone ? (
        <p className="text-center text-xs text-muted-foreground">
          Dica: ao terminar uma ação, volte aqui — marcamos o passo
          automaticamente.
        </p>
      ) : null}

      {allDone ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <Circle className="size-10 text-primary/40" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">
              Explore vendas, ranking e o Aprendiz pelo menu quando precisar.
            </p>
            <Button nativeButton={false} render={<Link href="/vendas" />}>
              Ir para vendas
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
