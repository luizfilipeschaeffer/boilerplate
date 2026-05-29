import type {
  InstallationHeartbeatPayload,
  LicensePayload,
  MarketplaceModule,
  RegisterInstallationRequest,
  RegisterInstallationResponse,
  SubscriptionSummary,
  CreateSupportTicketRequest,
  SupportTicket,
  CustomerFeedbackPayload,
} from "../contracts/index";

export type PlatformApiClientOptions = {
  baseUrl: string;
  installationKey?: string;
  accessToken?: string;
};

export class PlatformApiClient {
  constructor(private readonly opts: PlatformApiClientOptions) {}

  private async fetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    };
    if (this.opts.installationKey) {
      headers.Authorization = `Bearer ${this.opts.installationKey}`;
    }
    if (this.opts.accessToken) {
      headers["X-User-Token"] = this.opts.accessToken;
    }
    const res = await fetch(`${this.opts.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Platform API ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  registerInstallation(body: RegisterInstallationRequest) {
    return this.fetch<RegisterInstallationResponse>("/api/v1/installations/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  sendHeartbeat(installationId: string, body: InstallationHeartbeatPayload) {
    return this.fetch<{ ok: boolean }>(`/api/v1/installations/${installationId}/heartbeat`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getLicense(installationId: string) {
    return this.fetch<LicensePayload>(`/api/v1/license/${installationId}`);
  }

  getSubscription() {
    return this.fetch<SubscriptionSummary>("/api/v1/billing/subscription");
  }

  listMarketplaceModules() {
    return this.fetch<{ modules: MarketplaceModule[] }>("/api/v1/marketplace/modules");
  }

  createSupportTicket(body: CreateSupportTicketRequest) {
    return this.fetch<SupportTicket>("/api/v1/support/tickets", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  listSupportTickets(installationId: string) {
    return this.fetch<{ tickets: SupportTicket[] }>(
      `/api/v1/support/tickets?installationId=${encodeURIComponent(installationId)}`,
    );
  }

  submitFeedback(body: CustomerFeedbackPayload) {
    return this.fetch<{ id: string }>("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  listPlatformUpdates() {
    return this.fetch<{ releases: { id: string; version: string; changelog: string }[] }>(
      "/api/v1/updates/platform",
    );
  }
}
