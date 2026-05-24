import { loadPlatformCatalogJson } from "./platform-integrators";

export type IntegratorConfigFieldType = "secret" | "string" | "url";

export type IntegratorConfigField = {
  key: string;
  label: string;
  type: IntegratorConfigFieldType;
  required?: boolean;
};

export function parseIntegratorConfigFields(
  configSchema: unknown,
): IntegratorConfigField[] {
  if (!configSchema || typeof configSchema !== "object" || Array.isArray(configSchema)) {
    return [];
  }
  const fields = (configSchema as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return [];
  const result: IntegratorConfigField[] = [];
  for (const field of fields) {
    if (!field || typeof field !== "object" || Array.isArray(field)) continue;
    const f = field as Record<string, unknown>;
    if (typeof f.key !== "string" || typeof f.label !== "string") continue;
    const type =
      f.type === "secret" || f.type === "url" || f.type === "string"
        ? f.type
        : "string";
    result.push({
      key: f.key,
      label: f.label,
      type,
      required: f.required === true,
    });
  }
  return result;
}

export function getIntegratorConfigFields(integratorId: string): IntegratorConfigField[] {
  const catalog = loadPlatformCatalogJson();
  const item = catalog.integrators.find((i) => i.id === integratorId);
  if (!item) return [];

  const rootFields = parseIntegratorConfigFields(
    (item as { configSchema?: unknown }).configSchema,
  );
  if (rootFields.length > 0) return rootFields;

  return parseIntegratorConfigFields(item.gateway?.configSchema);
}
