---
status: completed
owner: null
created: 2026-05-22
updated: 2026-05-22
marco: R3
fase-produto: P2
modulos:
  - core-crm
  - core-clientes
parent-spec: 002--crm-suite-roadmap--2026-05-22
sprint: S04
---

# core-crm — Pipeline MVP (tenant) · Sprint S04

## Prompt original

sim (criar spec `004--core-crm-pipeline-mvp` com escopo de arquivos e critérios de aceite para a primeira sprint)

> No [roadmap completo](../002--crm-suite-roadmap--2026-05-22/sprints.md), esta spec é a **S04** (Fase 1 PRD — subset Módulos 1–2). As demais ~210 funcionalidades estão nas sprints S01–S03 e S05–S26 — ver [backlog](../002--crm-suite-roadmap--2026-05-22/backlog-funcionalidades.md).

## Resumo

Primeira entrega do **CRM comercial do tenant**: página `/crm` com kanban de pipeline, CRUD de leads, oportunidades (`crm_deal`) vinculadas a `core-clientes`, notas e movimentação de etapa. Reutiliza `@boilerplate/crm-ui` com estágios comerciais configuráveis. Promove `core-crm` de scaffold para **implemented** (profundidade D≥2).

## Critérios de aceite

- [ ] Rota dedicada `apps/web/app/(dashboard)/crm/page.tsx` (não usa placeholder `[modulo]`)
- [ ] Usuário `dono`/`gerente`/`vendedor` com módulo ativo acessa `/crm` e vê kanban
- [ ] Criar lead (nome, e-mail, telefone opcional) e card aparece na coluna inicial
- [ ] Arrastar card entre colunas do pipeline persiste `pipeline_stage` no banco tenant
- [ ] Criar oportunidade vinculada a cliente existente (`core-clientes`) e exibir no board
- [ ] Abrir card → listar/adicionar notas
- [ ] Mutations disparam `domain_events` (`crm.lead.criado`, `crm.deal.etapa_alterada`, `crm.nota.criada`)
- [ ] `module-registry`: `core-crm` → `implementationStatus: "implemented"`, `depthCurrent: 2`
- [ ] `bun run ci` verde
- [ ] Provision de tenant novo inclui tabelas `crm_*` (já existe; validar leitura/escrita)

## Fora de escopo (esta sprint — ver S05–S26 no roadmap)

- Captura multicanal, distribuição, enriquecimento (M1 → S05–S08)
- Múltiplos pipelines configuráveis (`crm_pipeline` / `crm_stage` → S09)
- Vista por fase P1–P4 no tenant (só pipeline comercial)
- Contatos separados, atividades (ligação/reunião), forecast, produtos na oportunidade
- Conversão lead → cliente automática
- Integração WhatsApp / inbox
- tRPC (usar **Server Actions**, padrão `clientes` / `platform-crm`)
- Timeline unificada completa (spec `003` — apenas notas no sheet)

## Referências

- [../002--crm-suite-roadmap--2026-05-22/plan.md](../002--crm-suite-roadmap--2026-05-22/plan.md) — fase T1
- [doc/modulos/crm-suite/crm.md](../../doc/modulos/crm-suite/crm.md) — Módulos 1–2 (subset)
- [prd.md](../../prd.md) — §8 `core-crm`, marco R3
- [plan.md](./plan.md) — arquivos, API, ordem de tarefas
