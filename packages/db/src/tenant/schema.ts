export function schemaNameFromSlug(slug: string): string {
  const base = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  const name = `tenant_${base || "default"}`;
  assertSafeSchemaName(name);
  return name;
}

export function assertSafeSchemaName(schemaName: string): void {
  if (!/^tenant_[a-z][a-z0-9_]{0,62}$/.test(schemaName)) {
    throw new Error(`Nome de schema inválido: ${schemaName}`);
  }
}

export function tenantCatalogTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."catalog_items"`;
}

export function tenantClientsTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."clients"`;
}

export function tenantSalesTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."sales"`;
}

export function tenantSaleItemsTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."sale_items"`;
}

export function tenantStockMovementsTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."stock_movements"`;
}

export function tenantAprendizTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."aprendiz_automacoes"`;
}

export function tenantAprendizPerfilTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."aprendiz_perfil"`;
}

export function tenantAprendizMessagesTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."aprendiz_messages"`;
}

export function tenantCashFlowTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."cash_flow_entries"`;
}

export function tenantSellersTable(schemaName: string): string {
  assertSafeSchemaName(schemaName);
  return `"${schemaName}"."sellers"`;
}
