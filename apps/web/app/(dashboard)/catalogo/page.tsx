import { Suspense } from "react";

import { CatalogoCachedView } from "@/components/cached/catalogo-view";
import { getActiveModuleIds } from "@/lib/modules/active-modules";
import { hintsForActiveModules } from "@/lib/catalog-segment";
import { auth } from "@/auth";
import { resolveUserSetup } from "@/lib/session-setup";

export default async function CatalogoPage() {
  const session = await auth();
  const setup = session?.user?.id
    ? await resolveUserSetup(session.user.id)
    : null;
  const orgId = setup?.organizationId ?? session?.organizationId;
  const moduleIds = orgId ? await getActiveModuleIds(orgId) : [];
  const segmentHints = hintsForActiveModules(moduleIds);

  return (
    <Suspense fallback={null}>
      <CatalogoCachedView segmentHints={segmentHints} />
    </Suspense>
  );
}
