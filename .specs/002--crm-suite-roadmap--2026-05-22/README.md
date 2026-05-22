---
status: draft
owner: null
created: 2026-05-22
updated: 2026-05-22
marco: R3+
fase-produto: P2+
modulos:
  - platform-crm
  - platform-comms
  - platform-insights
  - core-crm
---

# CRM Suite — roadmap de desenvolvimento (cobertura completa)

## Prompt original

pensando em evoluir nosso crm devemos orgnaizar o nosso desenvolvimento para aplicar estas soluções ao nosso CRM @doc/modulos/crm-suite/crm.md

*(Atualizado: incluir **todas** as funcionalidades do PRD em plano e sprints.)*

## Resumo

Roadmap de **26 sprints (S01–S26)** cobrindo **100%** das funcionalidades de `doc/modulos/crm-suite/crm.md` (12 módulos + timeline, automação, permissões, marketplace, UX, arquitetura e KPIs). Rastreio em [backlog-funcionalidades.md](./backlog-funcionalidades.md); detalhe de entregas em [sprints.md](./sprints.md). Primeira implementação tenant: sprint **S04** → spec [004](../004--core-crm-pipeline-mvp--2026-05-22/README.md).

## Dois domínios (não misturar)

| Domínio | App / módulo | Público | Schema |
|---------|--------------|---------|--------|
| Relacionamento **com a plataforma** | `platform-crm`, `platform-comms`, `platform-insights` | Time SaaS | Global Prisma |
| Relacionamento **do tenant** | `core-crm` + `core-clientes` / `core-vendas` | Cliente final do ERP | `crm_*` por tenant |

## Critérios de aceite (organização)

- [x] Plano e sprints cobrem **todas** as funcionalidades listadas no PRD CRM
- [x] [backlog-funcionalidades.md](./backlog-funcionalidades.md) com ID por item (~220)
- [x] [sprints.md](./sprints.md) com S01–S26 alinhadas às Fases 1–6 do PRD
- [ ] Execução: itens do backlog migrando `pendente` → `feito` sprint a sprint
- [ ] Submódulos vendáveis registrados no `module-registry` (meta contínuo desde S08)
- [x] Specs S01 [003](../003--crm-event-timeline--2026-05-22/README.md) e S04 [004](../004--core-crm-pipeline-mvp--2026-05-22/README.md) concluídas
- [x] S05 — [gestão avançada de leads](../005--crm-leads-gestao-avancada--2026-05-22/README.md)
- [ ] Próxima spec: S06 (captura) ou S13 (omnichannel)

## Escopo temporal

| Horizonte | Sprints | Resultado |
|-----------|---------|-----------|
| ~6 meses | S01–S12 | Fase 1 PRD + Leads e Pipeline completos |
| ~12 meses | S01–S26 | CRM Suite conforme PRD (todos os módulos) |

## Fora de escopo desta spec (documento)

- Implementar código (cada sprint tem spec filha própria)
- Substituir `core-clientes` pelo CRM

## Referências

- [doc/modulos/crm-suite/crm.md](../../doc/modulos/crm-suite/crm.md)
- [plan.md](./plan.md) — resumo executivo
- [sprints.md](./sprints.md) — definição S01–S26
- [backlog-funcionalidades.md](./backlog-funcionalidades.md) — checklist PRD
- [prd.md](../../prd.md) — marcos R, §17 platform-admin
