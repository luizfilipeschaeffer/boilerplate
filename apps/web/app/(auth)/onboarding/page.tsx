import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AprendizOnboardingChat } from "@/components/onboarding-chat";
import { loadOnboardingInitialDraft } from "@/lib/onboarding-initial-draft";
import { resolveUserSetup } from "@/lib/session-setup";

export default async function OnboardingPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (userId) {
    const { hasOrganization } = await resolveUserSetup(userId);
    if (hasOrganization) redirect("/dashboard");
  }

  const initialDraft = await loadOnboardingInitialDraft();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
      <AprendizOnboardingChat initialDraft={initialDraft} />
    </div>
  );
}
