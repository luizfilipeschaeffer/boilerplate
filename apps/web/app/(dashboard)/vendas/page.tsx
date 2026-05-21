import { Suspense } from "react";

import { VendasCachedView } from "@/components/cached/vendas-view";

export default function VendasPage() {
  return (
    <Suspense fallback={null}>
      <VendasCachedView />
    </Suspense>
  );
}
