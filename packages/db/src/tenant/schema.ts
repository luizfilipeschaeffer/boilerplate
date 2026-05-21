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
