import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import {
  applyMonorepoAppEnv,
  loadMonorepoEnv,
} from "../../packages/db/monorepo-env";
import { prismaMonorepoTracing } from "../../packages/db/next-config-prisma";
import { nextSecurityHeadersConfig } from "@boilerplate/shared/security";

const appDir = path.dirname(fileURLToPath(import.meta.url));
loadMonorepoEnv(appDir);
applyMonorepoAppEnv("platform-admin");

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
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_PLATFORM_ADMIN_URL,
    process.env.PLATFORM_ADMIN_URL,
    process.env.AUTH_URL,
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
  ...prismaMonorepoTracing(appDir),
  transpilePackages: [
    "@boilerplate/db",
    "@boilerplate/billing",
    "@boilerplate/integrators",
    "@boilerplate/crm",
    "@boilerplate/crm-ui",
    "@boilerplate/module-registry",
    "@boilerplate/shared",
  ],
  ...(process.env.NODE_ENV === "development" && allowedDevOrigins.length > 0
    ? { allowedDevOrigins }
    : {}),
  async headers() {
    return nextSecurityHeadersConfig();
  },
};

export default nextConfig;
