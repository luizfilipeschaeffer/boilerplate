export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { MarketplaceLibrary } from "@/components/marketplace-library";
import { LibraryStats } from "@/components/library-stats";
import { Card, CardContent } from "@/components/ui/card";
import { getLibraryCatalog } from "@/lib/catalog";

export default async function MarketplacePage() {
  const catalog = await getLibraryCatalog();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Consulte o catálogo oficial da plataforma: capacidades, status de
        implementação, dependências e integradores compatíveis. Dados em{" "}
        <code className="rounded bg-muted px-1 text-xs">platform-catalog.json</code>{" "}
        e no registro de módulos.
      </p>

      <LibraryStats stats={catalog.stats} />

      <Card className="min-w-0">
        <CardContent className="min-w-0 pt-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
            <MarketplaceLibrary catalog={catalog} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
