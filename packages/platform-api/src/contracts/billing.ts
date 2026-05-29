export interface SubscriptionSummary {
  organizationId: string;
  planId: string;
  planName: string;
  status: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  limits: {
    users: number;
    branches: number;
    modules: number;
    organizations: number;
  };
  entitlements: string[];
}
