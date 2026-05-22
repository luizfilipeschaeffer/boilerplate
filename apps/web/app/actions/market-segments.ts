"use server";

import { listMarketSegments } from "@boilerplate/db";

export async function getMarketSegmentChoices(tipoNegocio?: string) {
  const segments = await listMarketSegments({
    ativoOnly: true,
    tipoNegocio,
  });
  return segments.map((s) => ({
    value: s.slug,
    label: s.name,
  }));
}
