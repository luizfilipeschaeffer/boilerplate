import "server-only";

import { MESSAGING_RESEND_INTEGRATOR_ID, resolve } from "@boilerplate/db";
import { Resend } from "resend";

export async function sendCivilObrasEmail(input: {
  organizationId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  try {
    const creds = await resolve(MESSAGING_RESEND_INTEGRATOR_ID, input.organizationId);
    const apiKey = creds.secrets.apiKey?.trim();
    if (!apiKey) return;
    const from =
      (typeof creds.configPublic.fromEmail === "string" && creds.configPublic.fromEmail) ||
      process.env.RESEND_FROM_EMAIL ||
      "Boilerplate <onboarding@resend.dev>";
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });
  } catch {
    /* falha de envio não bloqueia publicação */
  }
}

export async function sendCivilObrasWhatsapp(input: {
  to: string;
  body: string;
}): Promise<void> {
  void input;
  /* integrador social-whatsapp-mock — log apenas no MVP */
}
