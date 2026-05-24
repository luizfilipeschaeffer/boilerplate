export const ENV_VALUE_DENYLIST = [
  "dev-only-auth-secret-change-in-env",
  "dev-email-verify-pepper",
  "dev-fake",
  "ci-only-secret-do-not-use-in-production",
  "local-predeploy-check-secret-not-for-production",
] as const;

export function assertEnvNotDenylisted(value: string, label: string): void {
  const normalized = value.trim().toLowerCase();
  for (const denied of ENV_VALUE_DENYLIST) {
    if (normalized === denied || normalized.includes(denied)) {
      throw new Error(`${label} usa valor proibido (dev/CI). Configure um secret real.`);
    }
  }
}
