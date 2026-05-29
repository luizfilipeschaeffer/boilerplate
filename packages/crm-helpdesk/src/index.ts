export type HelpdeskTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_requester"
  | "resolved"
  | "closed";

export type HelpdeskTicketPriority = "low" | "medium" | "high" | "urgent";

export type HelpdeskKbKind = "article" | "thread";

export type HelpdeskKbStatus = "draft" | "published" | "archived";

export type HelpdeskKbLinkType = "suggested" | "manual" | "resolved_from";

export type HelpdeskCommentVisibility = "internal" | "requester";

export interface HelpdeskKbSolution {
  id: string;
  title: string;
  body: string;
  order: number;
}

export interface HelpdeskTicketSummary {
  id: string;
  number: number;
  title: string;
  status: HelpdeskTicketStatus;
  priority: HelpdeskTicketPriority;
  queueId: string | null;
  queueName: string | null;
  requesterMembershipId: string | null;
  requesterLabel: string | null;
  affectedSectorId: string | null;
  affectedSectorName: string | null;
  assigneeMembershipId: string | null;
  assigneeLabel: string | null;
  slaDueAt: string | null;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HelpdeskTicketDetail extends HelpdeskTicketSummary {
  description: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  platformCommsThreadId: string | null;
  comments: HelpdeskTicketComment[];
  kbLinks: HelpdeskKbLink[];
}

export interface HelpdeskTicketComment {
  id: string;
  body: string;
  visibility: HelpdeskCommentVisibility;
  authorMembershipId: string | null;
  authorLabel: string;
  createdAt: string;
}

export interface HelpdeskKbLink {
  kbEntryId: string;
  title: string;
  linkType: HelpdeskKbLinkType;
}

export interface HelpdeskQueue {
  id: string;
  name: string;
  sectorId: string | null;
  isDefault: boolean;
}

export interface HelpdeskKbEntrySummary {
  id: string;
  kind: HelpdeskKbKind;
  title: string;
  status: HelpdeskKbStatus;
  tags: string[];
  sectorIds: string[];
  updatedAt: string;
  hasAcceptedSolution: boolean;
}

export interface HelpdeskKbEntryDetail extends HelpdeskKbEntrySummary {
  problemBody: string;
  solutions: HelpdeskKbSolution[];
  posts: HelpdeskKbPost[];
}

export interface HelpdeskKbPost {
  id: string;
  body: string;
  authorMembershipId: string | null;
  authorLabel: string;
  isAcceptedSolution: boolean;
  createdAt: string;
}

export interface HelpdeskKbSearchHit {
  kbEntryId: string;
  title: string;
  snippet: string;
  score: number;
}

export interface CreateTicketInput {
  title: string;
  description: string;
  priority?: HelpdeskTicketPriority;
  queueId?: string | null;
  requesterMembershipId?: string | null;
  affectedSectorId?: string | null;
  assigneeMembershipId?: string | null;
  suggestedKbEntryIds?: string[];
}

export interface CreateKbArticleInput {
  title: string;
  problemBody: string;
  solutions?: HelpdeskKbSolution[];
  tags?: string[];
  sectorIds?: string[];
  publish?: boolean;
}

export interface CreateKbThreadInput {
  title: string;
  problemBody: string;
  tags?: string[];
  sectorIds?: string[];
  publish?: boolean;
}

export interface HelpdeskCsatInput {
  ticketId: string;
  score: number;
  comment?: string;
}
