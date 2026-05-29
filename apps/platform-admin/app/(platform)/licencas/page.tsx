import { listClientLicensesForAdmin } from "@boilerplate/db/self-hosted";
import { PlatformLicensesView } from "@/components/platform-licenses-view";

export const dynamic = "force-dynamic";

export default async function LicencasPage() {
  const clients = await listClientLicensesForAdmin();

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <PlatformLicensesView clients={clients} />
    </div>
  );
}
