import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const needsSetup =
    Boolean(session.needsOnboarding) || !session.organizationId;
  redirect(needsSetup ? "/onboarding" : "/dashboard");
}
