import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NovaObraForm } from "@/components/civil-obras/nova-obra-form";
import { canAdminCivilObras } from "@/lib/civil-obras-access";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NovaObraPage() {
  const session = await auth();
  if (!session?.organizationId) redirect("/login");
  if (!canAdminCivilObras(session.role ?? "dono")) redirect("/civil-obras");

  return (
    <div className="px-4 lg:px-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Nova obra</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaObraForm />
        </CardContent>
      </Card>
    </div>
  );
}
