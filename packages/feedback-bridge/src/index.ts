import type { CustomerFeedbackPayload } from "@boilerplate/platform-api";
import { submitCustomerFeedback, approveFeedbackForGithub } from "@boilerplate/db/self-hosted";

const SENSITIVE_KEYS = [
  "cpf",
  "cnpj",
  "password",
  "senha",
  "email",
  "phone",
  "telefone",
  "credit",
  "cartao",
];

export function sanitizeFeedbackContext(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) continue;
    if (typeof value === "string" && value.length > 500) {
      out[key] = `${value.slice(0, 500)}…`;
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function bridgeCustomerFeedback(
  payload: CustomerFeedbackPayload,
): Promise<{ id: string }> {
  return submitCustomerFeedback({
    ...payload,
    sanitizedDetails: sanitizeFeedbackContext(payload.sanitizedDetails),
  });
}

export function buildGithubLabels(opts: {
  moduleId?: string;
  integratorId?: string;
  processo?: string;
  phase?: string;
  impacto?: string;
  tipo?: string;
  bounty?: string;
}): string[] {
  const labels: string[] = ["origem:cliente", "status:triagem"];
  if (opts.moduleId) labels.push(`module:${opts.moduleId}`);
  if (opts.integratorId) labels.push(`integrator:${opts.integratorId}`);
  if (opts.processo) labels.push(`processo:${opts.processo}`);
  if (opts.phase) labels.push(`phase:${opts.phase}`);
  if (opts.impacto) labels.push(`impacto:${opts.impacto}`);
  if (opts.tipo) labels.push(`tipo:${opts.tipo}`);
  if (opts.bounty) labels.push(`bounty:${opts.bounty}`);
  return labels;
}

export async function publishFeedbackToGithub(opts: {
  feedbackId: string;
  githubRepo: string;
  githubIssueNumber: number;
  labels: string[];
  moduleId?: string;
  bountyAvailable?: boolean;
}) {
  return approveFeedbackForGithub(opts);
}

export { submitCustomerFeedback, listPendingFeedback } from "@boilerplate/db/self-hosted";
