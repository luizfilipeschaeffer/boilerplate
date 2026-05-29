import { prisma } from "../src/client";
import {
  seedDefaultMarketplaceListings,
  seedDefaultPlatformRelease,
  ensureDefaultSubscription,
} from "../src/self-hosted";

async function main() {
  const orgs = await prisma.organization.findMany({ take: 1 });
  if (orgs[0]) {
    await ensureDefaultSubscription(orgs[0].id);
    await prisma.entitlementGrant.createMany({
      data: [
        { organizationId: orgs[0].id, entitlement: "module:core-crm" },
        { organizationId: orgs[0].id, entitlement: "feature:marketplace-install" },
      ],
      skipDuplicates: true,
    });
  }
  await seedDefaultMarketplaceListings();
  await seedDefaultPlatformRelease(process.env.PLATFORM_VERSION ?? "0.1.0");
  console.log("Self-hosted seed OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
