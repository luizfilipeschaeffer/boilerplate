import { AprendizOnboardingChat } from "@/components/onboarding-chat";
import { loadOnboardingInitialDraft } from "@/lib/onboarding-initial-draft";

export default async function OnboardingPage() {
  const initialDraft = await loadOnboardingInitialDraft();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
      <AprendizOnboardingChat initialDraft={initialDraft} />
    </div>
  );
}
