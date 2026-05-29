import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NovaEntradaForm } from "@/components/civil-obras/nova-entrada-form";
import { ObraNav } from "@/components/civil-obras/obra-nav";
import {
  canAdminCivilObras,
  canColaboradorCivilObras,
} from "@/lib/civil-obras-access";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NovaEntradaPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = await params;
  const session = await auth();
  if (!session?.organizationId) redirect("/login");
  const role = session.role ?? "dono";
  if (!canColaboradorCivilObras(role) && !canAdminCivilObras(role)) {
    redirect(`/civil-obras/${obraId}/diario`);
  }

  return (
    <div className="px-4 lg:px-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Nova entrada</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ObraNav obraId={obraId} />
          <NovaEntradaForm obraId={obraId} />
        </CardContent>
      </Card>
    </div>
  );
}
