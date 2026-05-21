import { prisma } from "@boilerplate/db";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const orgs = await prisma.organization.count();
  const demandaRows = await prisma.moduloDemanda.findMany({
    select: { moduloId: true },
  });
  const counts = new Map<string, number>();
  for (const row of demandaRows) {
    counts.set(row.moduloId, (counts.get(row.moduloId) ?? 0) + 1);
  }
  const demandas = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([moduloId, count]) => ({ moduloId, count }));

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-bold">Insights (MVP)</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Autenticação platform_* e CRM completos na próxima iteração.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Tenants</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{orgs}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:col-span-1">
          <p className="mb-3 text-sm text-zinc-400">Top módulos demandados</p>
          {demandas.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum registro ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {demandas.map((d) => (
                <li key={d.moduloId} className="flex justify-between gap-4">
                  <span>{d.moduloId}</span>
                  <span className="tabular-nums text-zinc-400">{d.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
