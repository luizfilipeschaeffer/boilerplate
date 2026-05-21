import { migrateAllTenantSchemas } from "../src/tenant/migrate-all";

const count = await migrateAllTenantSchemas();
console.log(`[migrate-tenants] ${count} schema(s) atualizado(s).`);
