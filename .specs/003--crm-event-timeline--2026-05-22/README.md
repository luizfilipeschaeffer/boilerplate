---
status: completed
owner: null
created: 2026-05-22
updated: 2026-05-22
marco: R3+
sprint: S01
parent-spec: 002--crm-suite-roadmap--2026-05-22
---

# CRM — Timeline e eventos (S01)

## Resumo

Timeline unificada no sheet do CRM (tenant + plataforma): notas, atividades, eventos `crm.*` em `domain_events`, e registro de mudança de etapa em `crm_activity`.

## Entregas

- `packages/crm/src/timeline.ts`
- `packages/db/src/crm/tenant-timeline.ts`, `platform-timeline.ts`
- `packages/crm-ui/src/crm-timeline-panel.tsx` + aba Timeline no sheet
- Eventos CRM em `@boilerplate/shared` + `persistDomainEvent`
- `loadCrmTimelineAction` em `apps/web` e `platform-admin`

## Pendente (sprints futuras)

- Eventos mensagem, proposta, pagamento, ticket (X-TL02–06)
- Event store dedicado (X-AR10)
