import {
  installModuleAction,
  listMarketplaceModulesAction,
} from "@/app/actions/platform-account";
import { PlatformModulesClient } from "@/components/platform-modules-client";

export const dynamic = "force-dynamic";

export default async function ModulosPlataformaPage() {
  const modules = await listMarketplaceModulesAction();
  return (
    <div className="px-4 lg:px-6">
      <PlatformModulesClient modules={modules} installAction={installModuleAction} />
    </div>
  );
}
