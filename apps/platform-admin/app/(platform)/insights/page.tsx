import {
  getInsightsDemanda,
  getInsightsFunnel,
  getInsightsMatrixCoverage,
  getInsightsTenantHealth,
  getInsightsTipoInteresse,
} from "@boilerplate/db";
import { InsightsDashboard } from "@/modules/platform-insights/insights-dashboard";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [demanda, funnel, tipoInteresse, matrix, health] = await Promise.all([
    getInsightsDemanda(),
    getInsightsFunnel(),
    getInsightsTipoInteresse(),
    getInsightsMatrixCoverage(),
    getInsightsTenantHealth(),
  ]);

  const matrixSample = matrix.cells.filter((c) => c.fase <= 2).slice(0, 8);

  return (
    <div className="px-4 pb-8 lg:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Demanda de módulos, funil, cobertura da matriz e health score (PRD §17.5).
        </p>
      </div>
      <InsightsDashboard
        demanda={demanda}
        funnel={funnel}
        tipoInteresse={tipoInteresse}
        matrixOverallPct={matrix.overallPct}
        matrixSample={matrixSample}
        health={health}
      />
    </div>
  );
}
