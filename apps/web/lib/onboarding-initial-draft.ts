import { auth } from "@/auth";
import { getSignupDraft, prisma } from "@boilerplate/db";
import {
  EMPTY_DIAGNOSTICO_DRAFT,
  mergeDiagnosticoDraft,
  type DiagnosticoDraft,
} from "@/lib/diagnostico/draft";

export async function loadOnboardingInitialDraft(): Promise<DiagnosticoDraft> {
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase() ?? "";
  let draft: DiagnosticoDraft = {
    ...EMPTY_DIAGNOSTICO_DRAFT,
    name: session?.user?.name ?? "",
    email,
  };

  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.name) draft = { ...draft, name: user.name };
    const saved = await getSignupDraft(email);
    if (saved) {
      draft = mergeDiagnosticoDraft(draft, saved, { fromCadastro: true });
    }
  }

  return draft;
}
