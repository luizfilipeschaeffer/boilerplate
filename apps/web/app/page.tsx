import { auth } from "@/auth";
import { resolveUserSetup } from "@/lib/session-setup";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { hasOrganization } = await resolveUserSetup(session.user.id);
  redirect(hasOrganization ? "/dashboard" : "/onboarding");
}
