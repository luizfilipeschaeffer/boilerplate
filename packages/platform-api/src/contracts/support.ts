export type SupportTicketType =
  | "bug"
  | "question"
  | "configuration"
  | "billing"
  | "migration"
  | "performance";

export type SupportTicketStatus =
  | "open"
  | "triage"
  | "waiting_customer"
  | "waiting_developer"
  | "resolved";

export type SupportTicketPriority = "low" | "medium" | "high" | "critical";

export interface SupportTicket {
  id: string;
  organizationId: string;
  installationId: string;
  moduleId?: string;
  integratorId?: string;
  type: SupportTicketType;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  sanitizedContext: Record<string, unknown>;
  subject?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSupportTicketRequest {
  installationId: string;
  organizationId: string;
  moduleId?: string;
  integratorId?: string;
  type: SupportTicketType;
  priority?: SupportTicketPriority;
  subject: string;
  body: string;
  sanitizedContext?: Record<string, unknown>;
}
