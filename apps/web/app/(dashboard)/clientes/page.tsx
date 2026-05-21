import { Suspense } from "react";

import { ClientesCachedView } from "@/components/cached/clientes-view";

export default function ClientesPage() {
  return (
    <Suspense fallback={null}>
      <ClientesCachedView />
    </Suspense>
  );
}
