import type { ResolvedCredentials } from "@boilerplate/sdk-core";

export type CredentialResolver = (
  integratorId: string,
  organizationId: string,
) => Promise<ResolvedCredentials>;

let resolver: CredentialResolver | null = null;

export function configureCredentialResolver(fn: CredentialResolver): void {
  resolver = fn;
}

export async function resolveIntegrator(
  integratorId: string,
  orgId: string,
): Promise<ResolvedCredentials> {
  if (!resolver) {
    throw new Error("Credential resolver not configured");
  }
  return resolver(integratorId, orgId);
}
