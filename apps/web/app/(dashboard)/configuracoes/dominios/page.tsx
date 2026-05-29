import {
  getAllowedOriginsAction,
  saveAllowedOriginsAction,
} from "@/app/actions/setup-wizard";
import { PlatformOriginsClient } from "@/components/platform-origins-client";

export const dynamic = "force-dynamic";

export default async function DominiosPage() {
  const origins = await getAllowedOriginsAction();
  return (
    <div className="px-4 lg:px-6">
      <PlatformOriginsClient initialOrigins={origins} saveAction={saveAllowedOriginsAction} />
    </div>
  );
}
