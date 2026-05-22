"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Package,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import type { DashboardOverview } from "@/app/actions/dashboard";
import type { DashboardCardId } from "@/lib/dashboard-cards";
import { formatBrl } from "@/lib/format-money";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatCard({
  description,
  title,
  icon: Icon,
  href,
  linkLabel,
  children,
}: {
  description: string;
  title: React.ReactNode;
  icon: React.ElementType;
  href: string;
  linkLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardDescription>{description}</CardDescription>
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <CardTitle className="text-2xl tabular-nums">{title}</CardTitle>
      </CardHeader>
      {children ? (
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {children}
          <Button
            nativeButton={false}
            render={<Link href={href} />}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            {linkLabel}
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </CardContent>
      ) : (
        <CardContent>
          <Button
            nativeButton={false}
            render={<Link href={href} />}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            {linkLabel}
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export function DashboardOverviewCards({
  overview,
  enabledCards,
  className,
}: {
  overview: DashboardOverview;
  enabledCards: DashboardCardId[];
  className?: string;
}) {
  const show = new Set(enabledCards);
  const { cashFlow, clientCount, lowStock, nearLowStock, metrics } = overview;
  const hasStockAlerts = lowStock.length > 0 || nearLowStock.length > 0;

  const compactIds: DashboardCardId[] = [
    "cash_flow",
    "clients",
    "sales_today",
    "sales_month",
    "ticket_month",
    "open_orders",
    "catalog_count",
    "active_sellers",
    "ranking_leader",
    "overdue_bills",
  ];
  const compactCount = compactIds.filter((id) => show.has(id)).length;

  if (enabledCards.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Nenhum card configurado para este setor. Use &quot;Editar dashboard&quot;
        no topo para escolher o que exibir.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {compactCount > 0 ? (
        <div
          className={cn(
            "grid gap-4",
            compactCount >= 2 ? "sm:grid-cols-2" : "sm:grid-cols-1",
            compactCount >= 3 && "lg:grid-cols-3",
          )}
        >
          {show.has("cash_flow") ? (
            <StatCard
              description="Fluxo de caixa"
              title={formatBrl(cashFlow.saldoRealizado)}
              icon={Wallet}
              href="/fluxo-caixa"
              linkLabel="Ver fluxo de caixa"
            >
              <p>
                Projetado:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatBrl(cashFlow.saldoProjetado)}
                </span>
              </p>
            </StatCard>
          ) : null}

          {show.has("clients") ? (
            <StatCard
              description="Clientes cadastrados"
              title={clientCount}
              icon={Users}
              href="/clientes"
              linkLabel="Ver clientes"
            />
          ) : null}

          {show.has("sales_today") ? (
            <StatCard
              description="Vendas hoje"
              title={formatBrl(metrics.salesToday.totalCents)}
              icon={ShoppingCart}
              href="/vendas"
              linkLabel="Ver vendas"
            >
              <p>
                {metrics.salesToday.count}{" "}
                {metrics.salesToday.count === 1 ? "venda" : "vendas"}
              </p>
            </StatCard>
          ) : null}

          {show.has("sales_month") ? (
            <StatCard
              description="Vendas no mês"
              title={formatBrl(metrics.salesMonth.totalCents)}
              icon={TrendingUp}
              href="/relatorios"
              linkLabel="Ver relatórios"
            >
              <p>
                {metrics.salesMonth.count}{" "}
                {metrics.salesMonth.count === 1 ? "venda" : "vendas"} no período
              </p>
            </StatCard>
          ) : null}

          {show.has("ticket_month") ? (
            <StatCard
              description="Ticket médio (mês)"
              title={formatBrl(metrics.salesMonth.ticketMedioCents)}
              icon={ShoppingCart}
              href="/vendas"
              linkLabel="Ver vendas"
            />
          ) : null}

          {show.has("open_orders") ? (
            <StatCard
              description="Pedidos em aberto"
              title={metrics.openOrdersCount}
              icon={ClipboardList}
              href="/pedidos"
              linkLabel="Ver pedidos"
            />
          ) : null}

          {show.has("catalog_count") ? (
            <StatCard
              description="Itens no catálogo"
              title={metrics.catalogActiveCount}
              icon={Package}
              href="/catalogo"
              linkLabel="Ver catálogo"
            />
          ) : null}

          {show.has("active_sellers") ? (
            <StatCard
              description="Vendedores ativos"
              title={metrics.activeSellersCount}
              icon={UserCheck}
              href="/vendedores"
              linkLabel="Ver vendedores"
            />
          ) : null}

          {show.has("ranking_leader") ? (
            <StatCard
              description="Produto mais vendido"
              title={
                metrics.topProduct ? (
                  <span className="text-lg leading-snug">
                    {metrics.topProduct.name}
                  </span>
                ) : (
                  "—"
                )
              }
              icon={TrendingUp}
              href="/ranking"
              linkLabel="Ver ranking"
            >
              {metrics.topProduct ? (
                <p>
                  {metrics.topProduct.totalQty} un. ·{" "}
                  {formatBrl(metrics.topProduct.totalCents)}
                </p>
              ) : null}
            </StatCard>
          ) : null}

          {show.has("overdue_bills") ? (
            <StatCard
              description="Contas em atraso"
              title={metrics.overdueCount}
              icon={Wallet}
              href="/fluxo-caixa"
              linkLabel="Ver fluxo de caixa"
            >
              {metrics.overdueCount > 0 ? (
                <p>
                  Total:{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {formatBrl(metrics.overdueTotalCents)}
                  </span>
                </p>
              ) : (
                <p>Nenhuma saída vencida pendente.</p>
              )}
            </StatCard>
          ) : null}
        </div>
      ) : null}

      {show.has("stock_alerts") ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Alertas de estoque</CardTitle>
                <CardDescription>
                  Produtos com estoque baixo ou perto do mínimo
                </CardDescription>
              </div>
              <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            {!hasStockAlerts ? (
              <p className="text-sm text-muted-foreground">
                Nenhum produto perto do mínimo no momento. Defina o estoque mínimo
                no catálogo para receber alertas.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {lowStock.length > 0 ? (
                  <li>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-destructive">
                      <AlertTriangle className="size-3.5" />
                      Estoque baixo
                    </p>
                    <ul className="flex flex-col gap-2">
                      {lowStock.map((item) => (
                        <StockAlertRow key={item.id} item={item} variant="low" />
                      ))}
                    </ul>
                  </li>
                ) : null}
                {nearLowStock.length > 0 ? (
                  <li>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Próximo do mínimo
                    </p>
                    <ul className="flex flex-col gap-2">
                      {nearLowStock.map((item) => (
                        <StockAlertRow
                          key={item.id}
                          item={item}
                          variant="near"
                        />
                      ))}
                    </ul>
                  </li>
                ) : null}
              </ul>
            )}
            <Button
              nativeButton={false}
              render={<Link href="/estoque/produtos" />}
              variant="outline"
              size="sm"
              className="mt-4 w-full sm:w-auto"
            >
              Ir para estoque
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StockAlertRow({
  item,
  variant,
}: {
  item: { id: string; name: string; stock_qty: number; stock_min: number };
  variant: "low" | "near";
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm",
        variant === "low"
          ? "border-destructive/25 bg-destructive/5"
          : "border-amber-500/25 bg-amber-500/5",
      )}
    >
      <span className="min-w-0 truncate font-medium">{item.name}</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {item.stock_qty} / mín. {item.stock_min}
      </span>
    </li>
  );
}
