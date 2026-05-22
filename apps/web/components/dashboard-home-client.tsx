"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  KeyRound,
  Package,
  ShoppingCart,
  Sparkles,
  Users,
  Warehouse,
} from "lucide-react";
import * as React from "react";

import type { DashboardOverview } from "@/app/actions/dashboard";
import { DashboardHeaderToolbar } from "@/components/dashboard-header-toolbar";
import type { DashboardCardId } from "@/lib/dashboard-cards";
import {
  FASE1_MISSIONS,
  firstNameFrom,
  type MissionId,
} from "@/lib/missions/catalog";
import {
  shouldCelebrateMissionComplete,
  writeMissionProgress,
} from "@/lib/missions/dashboard-storage";
import { DashboardOverviewCards } from "@/components/dashboard-overview-cards";
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
  criar_senha: KeyRound,
  primeiro_cliente: Users,
  primeiro_produto: Package,
  primeira_venda: ShoppingCart,
  ver_estoque: Warehouse,
  conhecer_aprendiz: Sparkles,
};

type ViewPhase = "missions" | "celebrating" | "stats";

export function DashboardHomeClient({
  userName,
  organizationName,
  completedIds,
  overview,
  enabledCards,
  canEditDashboard,
  sectorSlug,
}: {
  userName: string;
  organizationName: string;
  completedIds: string[];
  overview: DashboardOverview | null;
  enabledCards: DashboardCardId[];
  canEditDashboard: boolean;
  sectorSlug: string;
}) {
  const completed = new Set(completedIds);
  const total = FASE1_MISSIONS.length;
  const doneCount = FASE1_MISSIONS.filter((m) => completed.has(m.id)).length;
  const allDone = doneCount === total;
  const nextMission = FASE1_MISSIONS.find((m) => !completed.has(m.id));

  const [mounted, setMounted] = React.useState(false);
  const [phase, setPhase] = React.useState<ViewPhase>(
    allDone ? "stats" : "missions",
  );
  const [statsVisible, setStatsVisible] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    if (!allDone) {
      setPhase("missions");
      setStatsVisible(false);
      writeMissionProgress(doneCount);
      return;
    }

    const celebrate = shouldCelebrateMissionComplete(doneCount, total, true);
    writeMissionProgress(total);

    if (celebrate) {
      setPhase("celebrating");
      setStatsVisible(false);
      const exitTimer = window.setTimeout(() => {
        setPhase("stats");
        setStatsVisible(true);
      }, 1400);
      return () => window.clearTimeout(exitTimer);
    }

    setPhase("stats");
    setStatsVisible(true);
  }, [mounted, allDone, doneCount, total]);

  const showMissionsCard = !mounted
    ? !allDone
    : phase === "missions" || phase === "celebrating";

  return (
    <div className="flex flex-col gap-6 px-4 pb-8 lg:px-6">
      <DashboardHeaderToolbar
        canEdit={canEditDashboard}
        sectorSlug={sectorSlug}
      />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {firstNameFrom(userName)}!
        </h1>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          {allDone ? (
            <>
              Tudo pronto em{" "}
              <span className="font-medium text-foreground">
                {organizationName}
              </span>
              . Acompanhe o resumo abaixo.
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

      {showMissionsCard ? (
        <Card
          className={cn(
            "overflow-hidden transition-[box-shadow,border-color,background-color,opacity,transform] duration-700",
            phase === "celebrating" &&
              "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.35),0_12px_40px_-12px_rgba(16,185,129,0.45)]",
            phase === "celebrating" && "animate-out fade-out-0 zoom-out-95 fill-mode-forwards",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">Seus primeiros passos</CardTitle>
                <CardDescription>
                  {phase === "celebrating" ? (
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      Parabéns — você concluiu todos os passos!
                    </span>
                  ) : (
                    <>
                      {doneCount} de {total} concluídos
                    </>
                  )}
                </CardDescription>
              </div>
              {phase === "celebrating" ? (
                <CheckCircle2
                  className="size-8 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
              ) : null}
            </div>
          </CardHeader>
          {phase !== "celebrating" ? (
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
                  style={{
                    width: `${total ? (doneCount / total) * 100 : 0}%`,
                  }}
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
                        isNext &&
                          !isDone &&
                          "border-primary/40 ring-1 ring-primary/20",
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
                          <p className="font-medium leading-snug">
                            {mission.title}
                          </p>
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
          ) : (
            <CardContent className="py-10 text-center">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                Preparando seu painel…
              </p>
            </CardContent>
          )}
        </Card>
      ) : null}

      {nextMission && !allDone ? (
        <p className="text-center text-xs text-muted-foreground">
          Dica: ao terminar uma ação, volte aqui — marcamos o passo
          automaticamente.
        </p>
      ) : null}

      {mounted && allDone && overview && statsVisible ? (
        <DashboardOverviewCards
          overview={overview}
          enabledCards={enabledCards}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        />
      ) : null}
    </div>
  );
}
