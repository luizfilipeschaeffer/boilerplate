import { Suspense } from "react";

import { AprendizDashboardChat } from "@/components/aprendiz-dashboard-chat";

export default async function AprendizPage({
  searchParams,
}: {
  searchParams: Promise<{ primeiroContato?: string }>;
}) {
  const params = await searchParams;
  const primeiroContato = params.primeiroContato === "1";

  return (
    <Suspense fallback={null}>
      <AprendizDashboardChat primeiroContato={primeiroContato} />
    </Suspense>
  );
}
