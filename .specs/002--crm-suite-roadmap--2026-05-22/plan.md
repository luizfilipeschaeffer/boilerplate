# Plano — CRM Suite (roadmap completo)

> Fonte produto: `doc/modulos/crm-suite/crm.md`.  
> **Cobertura 100%** das funcionalidades listadas no PRD: ver [backlog-funcionalidades.md](./backlog-funcionalidades.md) (~220 itens).  
> **Execução:** [sprints.md](./sprints.md) — **26 sprints** (S01–S26), ~12 meses.

## Objetivo

Implementar incrementalmente a CRM Suite Omnichannel Inteligente no monorepo — plataforma (`platform-crm`, `platform-comms`, `platform-insights`) e tenant (`core-crm`) — sem duplicar `core-clientes` / `core-vendas`, com timeline unificada e módulos vendáveis no registry.

## Documentos desta spec

| Arquivo | Conteúdo |
|---------|----------|
| [backlog-funcionalidades.md](./backlog-funcionalidades.md) | Checklist exaustivo PRD → sprint → status |
| [sprints.md](./sprints.md) | Definição de cada sprint S01–S26 |
| [../004--core-crm-pipeline-mvp--2026-05-22/](../004--core-crm-pipeline-mvp--2026-05-22/README.md) | **S04** — primeira entrega tenant |

## Estado atual (baseline)

| Área | Plataforma | Tenant |
|------|------------|--------|
| Kanban / pipeline | ✅ MVP SaaS | ⏳ scaffold |
| Leads / deals | ✅ | ⏳ SQL only |
| Comms | ✅ mock | ❌ |
| Timeline / automação / campanhas / BI / tickets | ❌ ou parcial | ❌ |

Detalhe por módulo PRD: coluna **Status** no [backlog](./backlog-funcionalidades.md).

## Princípios (inalterados)

1. Timeline primeiro (S01) — depois escalar canais e IA.  
2. Um `CrmRepository` por contexto (`platform` / `tenant`).  
3. Canais via `packages/integrators`.  
4. Submódulos vendáveis → `module-registry` (tabela em [sprints.md § Submódulos](./sprints.md)).  
5. Server Actions no `apps/web`; tRPC só se o módulo vizinho já usar.

## Mapa módulos PRD → sprints

| Módulo PRD | Sprint(s) | Fecha módulo |
|------------|-----------|--------------|
| **§7 Timeline** | S01 | — |
| **§9 Permissões** | S02 | — |
| **§14 Arquitetura** (queues) | S03 | — |
| **1 Leads** | S04–S08 | S08 |
| **2 Pipeline** | S04, S09–S12 | S12 |
| **3 Omnichannel** | S13–S16 | S16 |
| **4 Automação** | S17 | S17 |
| **5 Campanhas** | S18–S19 | S19 |
| **6 ICP / Inteligência** | S20 | S20 |
| **7 Customer Journey** | S21 | S21 |
| **8 Analytics / BI** | S22 | S22 |
| **9 Reuniões** | S11 parcial, S23 | S23 |
| **10 Chatbot / IA** | S07 parcial, S24 | S24 |
| **11 Tickets** | S25 | S25 |
| **12 Integrações** | S06–S07, S26 | S26 |
| **§10 Multiempresa** | S26 (planos/limites) | — |
| **§11 Marketplace** | S26 | — |
| **§13 UX** | contínuo S04+; pico S15, S20 | — |
| **§15 KPIs** | S22 | — |

## Alinhamento `crm.md` §12 (Fases produto)

| Fase PRD | Sprints | Entregas PRD cobertas |
|----------|---------|------------------------|
| **1 Core MVP** | S01–S12 | Leads, CRM, pipeline, timeline, inbox WA, tarefas, reuniões, auth, usuários, permissões |
| **2 Omnichannel** | S13–S16 | IG, Messenger, Telegram, webchat, distribuição, SLA, templates, respostas rápidas |
| **3 Automação** | S17–S19 | Workflows, campanhas, automação comercial/marketing, jornadas |
| **4 IA** | S20, S24 | IA assistiva, score, classificação, resumo, previsão, próxima ação |
| **5 Customer Success** | S21, S25 | Tickets, onboarding, health, churn, journey |
| **6 Ecossistema** | S26 | Marketplace, API pública, parceiros, white-label, billing modular |

## Priorização imediata (conflito R3 fiscal)

| Ordem | Sprint | Motivo |
|-------|--------|--------|
| 1 | **S04** | Compromisso `core-crm` marco R3 ([004](../004--core-crm-pipeline-mvp--2026-05-22/README.md)) |
| 2 | **S01** | Desbloqueia omnichannel e automação |
| 3 | **S13** | WhatsApp real §17.7 PRD plataforma |
| 4 | **S05–S08** | Completar Módulo 1 Leads |
| 5 | **S09–S12** | Completar Módulo 2 Pipeline |

Se capacidade limitada: executar S04 → S01 → S09; manter S13 em paralelo com time plataforma.

## Specs filhas (backlog documental)

| ID | Nome | Sprint |
|----|------|--------|
| 003 | `crm-event-timeline` | S01 |
| 004 | `core-crm-pipeline-mvp` | **S04** |
| 005 | `platform-comms-omnichannel` | S13 |
| 006 | `crm-automation-mvp` | S17 |
| 007 | `crm-pipeline-config` | S09 |
| 008+ | campanhas, ICP, tickets, API… | S18–S26 (criar ao kickoff) |

## Arquitetura alvo

```text
crm-ui → platform-crm | web/crm
       → packages/crm (repository + timeline)
       → packages/db/crm
       → domain_events → workers (S03)
       → integrators → comms
```

## Modelo de dados (evolução por sprint)

| Sprint | Schema |
|--------|--------|
| S04 | `crm_lead`, `crm_deal`, `crm_note` (uso real) |
| S05 | tags, UTM, owner em lead |
| S09 | `crm_pipeline`, `crm_stage` |
| S10 | deal valor, prob, anexos, produtos |
| S13+ | `comms_thread`, templates, consent |
| S17 | `workflow_definition`, `workflow_run` |
| S19 | `campaign`, `segment`, `campaign_event` |
| S25 | `ticket`, `kb_article` |

## Verificação global (suite completa)

- [ ] 100% itens em [backlog-funcionalidades.md](./backlog-funcionalidades.md) com status `feito`
- [ ] S26 concluída — marketplace e API públicas
- [ ] `bun run ci` em todas as releases de sprint
- [ ] `prd.md` §8 e §17 atualizados por marco
- [ ] `doc/modulos/crm-suite/crm.md` permanece PRD; specs em `.specs/` são fonte de execução

## Riscos

| Risco | Mitigação |
|-------|-----------|
| 26 sprints × escopo PRD | Backlog rastreia cada bullet; DoD por sprint |
| Plataforma vs tenant | Coluna **Dom** no backlog (P/T/A) |
| IA antes de dados | S20 só após S13–S19 |
| Integradores externos | Canal só entra na sprint com integrator homologado |

## Checklist desta spec de organização

- [x] Plano atualizado com **todas** as funcionalidades do PRD
- [x] Sprints S01–S26 definidas
- [x] Backlog exaustivo criado
- [ ] Kickoff S04 (`004`) ou S01 conforme prioridade time
- [ ] README → `in-progress` ao iniciar primeira sprint
