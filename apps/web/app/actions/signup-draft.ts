"use server";

import { upsertSignupDraft } from "@boilerplate/db";
import type { DiagnosticoDraft } from "@/lib/diagnostico/draft";

/** Persiste o rascunho do cadastro para reutilizar no onboarding. */
export async function persistSignupDraft(draft: DiagnosticoDraft): Promise<void> {
  const email = draft.email.trim().toLowerCase();
  if (!email) return;
  const { cadastroAnswered: _cadastroAnswered, ...payload } = draft;
  await upsertSignupDraft(email, payload);
}
