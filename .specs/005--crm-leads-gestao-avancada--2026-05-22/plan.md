# Plano S05 — Gestão avançada de leads

> Itens: M1-G02…G07 — ver [backlog](../002--crm-suite-roadmap--2026-05-22/backlog-funcionalidades.md).

## Camada de dados

- `ensureTenantCrmLeadExtensions`: colunas S05 em `crm_lead`, tabela `crm_lead_tag`
- `getTenantLeadDetail`, `updateTenantLead`, `insertTenantLead`
- `findTenantLeadDuplicates`, `findDuplicatesForNewLead`, `mergeTenantLeads`
- `listTenantCrmOwners` via membership da organização

## UI

- `CrmLeadDetailPanel` na aba Gestão do `CrmRecordSheet`
- `CreateLeadForm` com checagem opcional de duplicatas no blur do telefone

## Actions (tenant)

- `loadCrmLeadDetailAction`, `updateCrmLeadAction`
- `loadCrmLeadDuplicatesAction`, `checkNewLeadDuplicatesAction`
- `listCrmOwnersAction`, `mergeCrmLeadsAction`

## Eventos

- `crm.lead.atualizado`, `crm.lead.mesclado` em `domain-event-bus`
