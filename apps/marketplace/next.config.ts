import type { NextConfig } from "next";

function addOriginHost(hosts: Set<string>, segment: string): void {
  const value = segment.trim();
  if (!value) return;
  try {
    const url = value.includes("://") ? new URL(value) : new URL(`http://${value}`);
    hosts.add(url.host);
    hosts.add(url.hostname);
  } catch {
    const host = value.replace(/^https?:\/\//, "").split("/")[0] ?? value;
    hosts.add(host);
    const [hostname] = host.split(":");
    if (hostname) hosts.add(hostname);
  }
}

function parseDevOriginHosts(): string[] {
  const hosts = new Set<string>();
  for (const raw of [
    process.env.DEV_ALLOWED_ORIGIN,
    process.env.NEXT_PUBLIC_MARKETPLACE_URL,
  ]) {
    if (!raw?.trim()) continue;
    for (const segment of raw.split(",")) {
      addOriginHost(hosts, segment);
    }
  }
  return [...hosts];
}

const allowedDevOrigins = parseDevOriginHosts();

const nextConfig: NextConfig = {
  transpilePackages: ["@boilerplate/sdk-core", "@boilerplate/module-registry"],
  ...(process.env.NODE_ENV === "development" && allowedDevOrigins.length > 0
    ? { allowedDevOrigins }
    : {}),
};

export default nextConfig;
