import type { ModuleMigrationFn } from "@boilerplate/sdk-core";
import { registerModuleTables } from "@boilerplate/module-registry";

registerModuleTables("crm", [
  { name: "crm_leads", description: "CRM leads" },
  { name: "crm_deals", description: "CRM deals" },
  { name: "crm_notes", description: "CRM notes" },
]);

registerModuleTables("catalog", [
  { name: "catalog_items", description: "Catalog items" },
]);

registerModuleTables("example-module", [
  { name: "example_module_items", description: "Example module items" },
]);

registerModuleTables("civil-obras", [
  { name: "civil_obras_obras", description: "Obras civis" },
  { name: "civil_obras_usuarios", description: "Usuários isolados por obra" },
  { name: "civil_obras_entradas", description: "Entradas do diário" },
  { name: "civil_obras_midias", description: "Mídias anexadas" },
  { name: "civil_obras_mencoes", description: "Menções em entradas" },
  { name: "civil_obras_eventos", description: "Marcos e eventos de calendário" },
  { name: "civil_obras_relatorios", description: "Relatórios PDF gerados" },
]);

registerModuleTables("crm-helpdesk", [
  { name: "crm_helpdesk_tickets", description: "Helpdesk tickets" },
  { name: "crm_helpdesk_queues", description: "Helpdesk queues" },
  { name: "crm_helpdesk_sla_policies", description: "SLA policies" },
  { name: "crm_helpdesk_kb_entries", description: "Knowledge base entries" },
  { name: "crm_helpdesk_kb_posts", description: "KB thread posts" },
  { name: "crm_helpdesk_ticket_kb_links", description: "Ticket KB links" },
  { name: "crm_helpdesk_kb_search_chunks", description: "KB search index" },
  { name: "crm_helpdesk_csat_responses", description: "CSAT responses" },
  { name: "crm_helpdesk_automation_rules", description: "Automation rules" },
]);

const moduleMigrations = new Map<string, ModuleMigrationFn[]>();

export function registerModuleMigrations(moduleId: string, migrations: ModuleMigrationFn[]): void {
  moduleMigrations.set(moduleId, migrations);
}

export function getModuleMigrations(moduleId: string): ModuleMigrationFn[] {
  return moduleMigrations.get(moduleId) ?? [];
}

export async function runModuleMigrationsForTenant(opts: {
  schemaName: string;
  organizationId: string;
  activeModuleIds: string[];
}): Promise<void> {
  for (const moduleId of opts.activeModuleIds) {
    const migrations = getModuleMigrations(moduleId);
    for (const migrate of migrations) {
      await migrate({
        schemaName: opts.schemaName,
        organizationId: opts.organizationId,
        fromVersion: "0.0.0",
        toVersion: "1.0.0",
      });
    }
  }
}
