import type { HelpdeskTicketPriority } from "@boilerplate/crm-helpdesk";

type SlaPolicyRow = {
  first_response_minutes: Record<string, number>;
  resolution_minutes: Record<string, number>;
};

export function computeSlaDueAt(
  priority: HelpdeskTicketPriority,
  policy: SlaPolicyRow,
  from: Date = new Date(),
): Date {
  const minutes =
    policy.resolution_minutes[priority] ??
    policy.resolution_minutes.medium ??
    1440;
  return new Date(from.getTime() + minutes * 60_000);
}

export function isSlaBreached(slaDueAt: Date | null, status: string): boolean {
  if (!slaDueAt) return false;
  if (status === "closed" || status === "resolved") return false;
  return new Date() > slaDueAt;
}
