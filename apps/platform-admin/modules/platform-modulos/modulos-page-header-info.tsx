"use client";

import { SetHeaderInfo } from "@/components/header-actions-context";

export function ModulosPageHeaderInfo({ readOnly }: { readOnly: boolean }) {
  return (
    <SetHeaderInfo>
      Central de precificação (PRD §12): custos por módulo, planos base,
      bundles fiscais e visão de ativações nos tenants.
      {readOnly ? " Somente leitura." : null}
    </SetHeaderInfo>
  );
}
