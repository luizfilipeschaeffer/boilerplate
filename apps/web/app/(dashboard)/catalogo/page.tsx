import { Suspense } from "react";

import { CatalogoCachedView } from "@/components/cached/catalogo-view";

export default function CatalogoPage() {
  return (
    <Suspense fallback={null}>
      <CatalogoCachedView />
    </Suspense>
  );
}
