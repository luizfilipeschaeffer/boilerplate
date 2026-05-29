export interface CustomerFeedbackPayload {
  installationId: string;
  organizationId: string;
  moduleId?: string;
  processHint?: string;
  impactHint?: "baixo" | "medio" | "alto";
  typeHint?: "bug" | "feature" | "improvement";
  summary: string;
  sanitizedDetails: Record<string, unknown>;
}

export interface GithubIssueLink {
  id: string;
  feedbackId: string;
  githubIssueNumber: number;
  githubRepo: string;
  labels: string[];
  moduleId?: string;
  bountyAvailable: boolean;
  status: string;
}

export const GITHUB_ISSUE_LABELS = [
  "module",
  "integrator",
  "processo",
  "phase",
  "impacto",
  "tipo",
  "origem",
  "status",
  "bounty",
] as const;
