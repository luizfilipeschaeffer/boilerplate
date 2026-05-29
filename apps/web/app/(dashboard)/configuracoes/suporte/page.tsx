import { listSupportTicketsAction } from "@/app/actions/platform-account";
import { PlatformSupportClient } from "@/components/platform-support-client";

export const dynamic = "force-dynamic";

export default async function SuportePlataformaPage() {
  const tickets = await listSupportTicketsAction();
  return (
    <div className="px-4 lg:px-6">
      <PlatformSupportClient initialTickets={tickets} />
    </div>
  );
}
