import { fetchAndCacheLicense } from "../src/index";
import { listInstalledModulesLocal } from "@boilerplate/db/self-hosted";
import { PlatformApiClient } from "@boilerplate/platform-api/client";

const centralApiUrl = process.env.CENTRAL_API_URL ?? "http://localhost:3002";
const installationId = process.env.INSTALLATION_ID ?? "";
const installationKey = process.env.INSTALLATION_KEY ?? "";
const intervalMs = Number(process.env.LICENSE_HEARTBEAT_MS ?? "300000");

async function tick() {
  if (!installationId || !installationKey) {
    console.warn("[license-agent] INSTALLATION_ID/KEY not configured");
    return;
  }
  try {
    await fetchAndCacheLicense({ centralApiUrl, installationId, installationKey });
    const license = await import("@boilerplate/license-client").then((m) =>
      m.getEffectiveLicense(),
    );
    if (license?.allowedOrigins?.length) {
      const { saveLocalAllowedOrigins } = await import("@boilerplate/db/self-hosted");
      await saveLocalAllowedOrigins(license.allowedOrigins);
    }
    const modules = await listInstalledModulesLocal();
    const client = new PlatformApiClient({ baseUrl: centralApiUrl, installationKey });
    await client.sendHeartbeat(installationId, {
      installationId,
      platformVersion: process.env.PLATFORM_VERSION ?? "0.1.0",
      installedModules: modules,
      installedIntegrators: [],
      databaseVersion: "1",
      dockerImageVersion: process.env.PLATFORM_VERSION ?? "0.1.0",
      healthStatus: "healthy",
      lastMigrationStatus: "ok",
      orgCount: 1,
      activeUserCount: 1,
    });
    console.log("[license-agent] sync ok");
  } catch (err) {
    console.error("[license-agent] sync failed", err);
  }
}

await tick();
setInterval(tick, intervalMs);
