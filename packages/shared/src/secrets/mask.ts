export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "••••";
  }
  const suffix = trimmed.slice(-4);
  return `${"•".repeat(Math.min(8, trimmed.length - 4))}${suffix}`;
}

export function maskSecrets(
  secrets: Record<string, string>,
): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(secrets)) {
    masked[key] = maskSecret(value);
  }
  return masked;
}
