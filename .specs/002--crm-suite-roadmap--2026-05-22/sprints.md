# Sprints — CRM Suite (cobertura completa)

> Cada sprint ≈ **2 semanas** (ajustável). Alinhamento macro com `crm.md` §12 (Fases 1–6).  
> Rastreio item a item: [backlog-funcionalidades.md](./backlog-funcionalidades.md).

## Visão macro

| Fase PRD (`crm.md` §12) | Sprints | Objetivo |
|-------------------------|---------|----------|
| **Fase 1 — Core MVP** | S01–S12 | Leads, pipeline, timeline, inbox WA, tarefas, reuniões, permissões |
| **Fase 2 — Omnichannel** | S13–S16 | Todos os canais + inbox + SLA + templates |
| **Fase 3 — Automação** | S17–S19 | Workflows, campanhas, jornadas marketing |
| **Fase 4 — IA** | S20, S24 | Scoring, IA assistiva, chatbot, previsões |
| **Fase 5 — Customer Success** | S21, S25 | Journey, NPS, tickets |
| **Fase 6 — Ecossistema** | S26 | API, marketplace, billing modular |

```text
S01──S03 Fundação
S04──S08 Módulo 1 Leads (+ início M2)
S09──S12 Módulo 2 Pipeline completo
S13──S16 Módulo 3 Omnichannel
S17──S19 Módulos 4–5 Automação + Campanhas
S20────── Módulo 6 ICP + IA transversal
S21────── Módulo 7 Journey
S22────── Módulo 8 BI + KPIs §15
S23────── Módulo 9 Reuniões
S24────── Módulo 10 Chatbot
S25────── Módulo 11 Tickets
S26────── Módulo 12 + §10–§11 Marketplace
```

---

## S01 — Timeline e eventos (§7, §8, §14 parcial)

**Objetivo:** Tudo gera evento; card exibe cronologia unificada.

| Domínio | Entregas |
|---------|----------|
| A | Tipos `domain_events` CRM; `packages/crm/src/timeline.ts` |
| P | Timeline no `crm-record-sheet` (platform-crm) |
| T | Timeline no sheet tenant (`/crm`) |
| A | Eventos: lead, mensagem, proposta, reunião, pagamento, ticket |

**Itens backlog:** X-TL01…07, X-AU01, X-AR01, X-AR10, X-UX04  
**Spec:** `003--crm-event-timeline`  
**Profundidade:** habilita D≥2 em CRM plataforma e tenant

---

## S02 — Permissões CRM (§9)

**Objetivo:** RBAC comercial completo por módulo, ação, time e auditoria.

| Entregas |
|----------|
| Matriz `core-crm`, `platform-crm`, comms por papel |
| Times comerciais (schema + UI básica) |
| Hierarquia (gerente vê pipeline do time) |
| Log de auditoria em mutações CRM |

**Itens:** X-PB02…06  
**Apps:** `apps/web/lib/module-permissions.ts`, `platform-admin` roles

---

## S03 — Filas, workers e webhooks (§14)

**Objetivo:** Processamento assíncrono para captura, comms e automação futura.

| Entregas |
|----------|
| Fila (BullMQ / equivalente já no repo ou novo `packages/queue`) |
| Workers: outbound comms, enriquecimento, webhooks |
| Retry + dead-letter; logs |

**Itens:** X-AR03, X-AR04, X-AR05 (base)

---

## S04 — Pipeline MVP tenant + gestão lead básica (§12 Fase 1 · M1/M2 subset)

**Objetivo:** Primeiro CRM comercial utilizável no tenant.

| Entregas |
|----------|
| `/crm` kanban 6 estágios; lead + deal + notas |
| Cadastro unificado lead; status; observações |
| Pipeline único (pré-requisito para S09) |

**Itens:** M1-G01, G08, G09, M2-K01 + spec [004](../004--core-crm-pipeline-mvp--2026-05-22/README.md)  
**Marco:** R3 · `core-crm` → implemented D2

---

## S05 — Gestão avançada de leads (M1 Gestão)

**Objetivo:** Qualidade e organização da base de leads.

| Entregas |
|----------|
| Tags, origem, UTMs, owner |
| Deduplicação (regras e-mail/telefone/CNPJ) |
| Merge automático assistido + manual |

**Itens:** M1-G02…G07  
**Schema:** `crm_lead_tag`, `crm_lead_source`, campos UTM

---

## S06 — Captura de leads (M1 Captura · formulários/API)

**Objetivo:** Entrada multicanal estruturada (sem redes sociais ainda).

| Entregas |
|----------|
| Form builder embed + landing host |
| QR Code → formulário |
| Import CSV |
| API pública + webhook documentado |
| Rotas `app/api/public/leads` |

**Itens:** M1-C01…C06, M12-R01 (parcial)

---

## S07 — Captura social e ERP (M1 Captura canais)

**Objetivo:** Leads de canais digitais e integrações.

| Entregas |
|----------|
| Webchat widget tenant |
| Inbound WhatsApp → lead (com S13) |
| Instagram / Facebook lead ads |
| Conector ERP → lead (evento `erp.lead`) |
| Chatbot captura (árvore simples, antes de S24) |

**Itens:** M1-C07…C12, M12-I03  
**Pacotes:** `packages/integrators`

---

## S08 — Distribuição, qualificação e enriquecimento (M1 completo)

**Objetivo:** Fechar **Módulo 1** do PRD.

| Entregas |
|----------|
| Round robin + filas + regras região/segmento/score |
| Score manual/automático; ICP match inicial |
| Enriquecimento CNPJ (Receita), domínio, porte, geo, redes |
| Submódulos registry: `crm-leads-capture`, `distribution`, `qualification`, `enrichment` |

**Itens:** M1-D01…E07, M1-Q01…Q05  
**Plataforma:** mesmas regras em `platform_lead`

---

## S09 — Pipelines configuráveis (M2 Pipeline Management + Etapas)

**Objetivo:** Múltiplos pipelines por setor/produto; etapas customizadas.

| Entregas |
|----------|
| Tabelas `crm_pipeline`, `crm_stage` (tenant + opcional plataforma) |
| UI configurador de etapas |
| SLA por etapa (timer + alerta) |
| Regras obrigatórias (campos required por stage) |

**Itens:** M2-P01…P04, M2-E01, E02, E04  
**Spec:** `007--crm-pipeline-config`

---

## S10 — Oportunidades completas (M2 Oportunidades)

**Objetivo:** Deal como entidade comercial rica.

| Entregas |
|----------|
| Valor, probabilidade, previsão fechamento |
| Anexos (storage blob) |
| Linha de produtos (`core-catalogo` / `core-vendas`) |
| Proposta PDF ou link |
| Responsáveis múltiplos; concorrentes |

**Itens:** M2-O01…O08  
**Integração:** `core-vendas` confirmação → evento deal

---

## S11 — Atividades comerciais (M2 Atividades + §12 tarefas/reuniões)

**Objetivo:** Disciplina de follow-up no CRM.

| Entregas |
|----------|
| Tarefas com due date e assignee |
| Ligações (click-to-call log) |
| Reuniões vinculadas ao card (antes do hub S23) |
| Follow-ups automáticos pós-etapa |
| Lembretes (notificação in-app + e-mail) |

**Itens:** M2-A01…A05, M9-P (activity meeting)

---

## S12 — Forecast e metas (M2 Forecast · fecha Fase 1 PRD)

**Objetivo:** Previsibilidade comercial; **Módulo 2** completo.

| Entregas |
|----------|
| Forecast por período / vendedor |
| Receita recorrente em deals |
| Metas individuais e por time |
| Widget no dashboard tenant |

**Itens:** M2-F01…F04, M2-E03 (automações etapa → S17, wire básico aqui)  
**Profundidade:** `core-crm` D3

---

## S13 — Inbox + WhatsApp + templates (M3 · §12 inbox + WA)

**Objetivo:** Omnichannel operacional; **início Fase 2 PRD**.

| Entregas |
|----------|
| Inbox real `platform-comms` + tenant comms |
| WhatsApp Cloud API inbound/outbound |
| Múltiplos atendentes, filas, departamentos, distribuição, transferência |
| Templates WA + respostas rápidas |

**Itens:** M3-CH01, M3-I01…I05, M3-R05, R06, M3-MVP→feito  
**Spec:** `005--platform-comms-omnichannel` (+ tenant mirror)

---

## S14 — Canais Meta, Telegram, e-mail, SMS (M3 Canais)

**Objetivo:** Cobertura de canais listados no PRD (exceto VoIP/meet).

| Entregas |
|----------|
| Instagram DM, Messenger |
| Telegram bot |
| E-mail thread (integrator) |
| SMS transacional |

**Itens:** M3-CH02…CH06, M12-I04

---

## S15 — Webchat, mídia e contexto (M3 Recursos + Conversa + UX §13)

**Objetivo:** Conversa como centro; contexto sem trocar de tela.

| Entregas |
|----------|
| Webchat tenant + VoIP click |
| Links Google Meet / Zoom no card |
| Áudio, vídeo, anexos, assinatura, emoji, menções |
| Painel lateral: cliente + deal + timeline + comms (SCI) |

**Itens:** M3-CH07…CH10, M3-CV01…03, M3-R01…04, R07, R08, X-UX02, X-UX03

---

## S16 — SLA e prioridade atendimento (M3 Atendimento · fecha Fase 2)

**Objetivo:** **Módulo 3** completo em operação.

| Entregas |
|----------|
| SLA por fila/canal |
| Fila de espera visível |
| Prioridade e simultaneidade de chats |
| Métricas SLA em tempo real |

**Itens:** M3-AT01…AT04, X-AR07 (real-time)

---

## S17 — Workflows e automação comercial (M4 · §12 Fase 3)

**Objetivo:** Motor de automação; **Fase 3 PRD** core.

| Entregas |
|----------|
| Workflow builder (drag-and-drop MVP) |
| Todos os gatilhos e ações do PRD |
| Delays e condições |
| Automações por etapa de pipeline (M2-E03) |
| Consumo de eventos (X-AU02, X-AU03) |

**Itens:** M4-W01…A06, M4-T01…T05, X-AU02, X-AU03  
**Spec:** `006--crm-automation-mvp`  
**Pacote:** `packages/workflow-engine`

---

## S18 — Campanhas outbound (M5 Campanhas · e-mail/WA/SMS)

**Objetivo:** Comunicação em massa com consentimento LGPD.

| Entregas |
|----------|
| Campanhas e-mail, WhatsApp, SMS |
| Agendamento e fila de envio |
| Opt-in por canal |

**Itens:** M5-C01…C03

---

## S19 — Segmentação, jornadas marketing e analytics (M5 completo)

**Objetivo:** Fechar **Módulo 5**.

| Entregas |
|----------|
| Builder de segmentos (tags, score, ICP, funil, comportamento) |
| Jornadas multietapas, funis, nutrição |
| Push + remarketing pixels |
| Analytics abertura/clique/resposta/conversão |

**Itens:** M5-C04, C05, M5-S01…AN04

---

## S20 — ICP, scoring e IA comercial (M6 + M4-IA + M10-V + M9-IA)

**Objetivo:** **Fase 4 PRD** — inteligência e priorização.

| Entregas |
|----------|
| ICP Builder UI |
| Fit, engagement, health scores |
| Oportunidades quentes, previsão conversão, recomendações |
| Classificação, sentimento, intenção, próxima ação |
| Resumo conversa (IA); transcrição/reunião resumo |
| IA invisível nos fluxos (X-UX05) |

**Itens:** M6-* (exceto churn S21), M4-IA01…05, M10-V01…03, M9-07, M9-08, M3-CV04  
**Apps:** `platform-insights` + tenant insights slice

---

## S21 — Customer Journey (M7 · §12 Fase 5)

**Objetivo:** Ciclo de vida pós-venda visual.

| Entregas |
|----------|
| 8 etapas de jornada mapeadas a eventos |
| Jornada visual (swimlane por conta) |
| Marcos, NPS, CSAT, onboarding tracking |
| Health + churn (M6-IN02) |

**Itens:** M7-E01…F06, M6-S03, M6-IN02

---

## S22 — Analytics e BI (M8 + KPIs §15)

**Objetivo:** **Módulo 8** e indicadores do PRD.

| Entregas |
|----------|
| Dashboards: comercial, marketing, atendimento, comunicação |
| Custom dashboards + export CSV/PDF |
| Filtros avançados; relatórios agendados |
| Todos KPIs §15 derivados dos dashboards |

**Itens:** M8-* , X-KP01…04  
**Módulos:** `platform-insights` D4, `rel-basico` / `core-relatorios` tenant

---

## S23 — Meeting Hub (M9 completo)

**Objetivo:** Agenda comercial integrada.

| Entregas |
|----------|
| Calendário interno |
| Sync Google Calendar + Outlook |
| Agendamento automático (link público) |
| Links Meet/Zoom; gravação (storage) |

**Itens:** M9-01…06, M12-I05

---

## S24 — Chatbot e IA atendimento (M10 completo)

**Objetivo:** Automação conversacional avançada.

| Entregas |
|----------|
| Builder árvore decisão |
| NLP + LLM com guardrails |
| Fallback humano na fila |
| Sugestão/resposta automática no composer |

**Itens:** M10-C01…A04  
**Integração:** Aprendiz opcional, não bloqueante

---

## S25 — Tickets e suporte (M11 · §12 Fase 5)

**Objetivo:** Pós-venda e SAC.

| Entregas |
|----------|
| `core-tickets` ou extensão comms |
| SLA, filas, prioridades |
| Base de conhecimento |
| Automações ticket; CSAT pós-fechamento |

**Itens:** M11-01…07, X-TL06

---

## S26 — Integration Hub e marketplace (M12 + §10–§11 + §6 Fase 6)

**Objetivo:** Ecossistema aberto e monetização modular.

| Entregas |
|----------|
| ERP, pagamentos, Zapier/Make/N8N |
| API pública documentada + OAuth |
| API privada tenant; logs de integração |
| Planos Básico/Pro/Enterprise no billing |
| Submódulos vendáveis no `module-registry` |
| Cobrança por capability CRM |

**Itens:** M12-*, X-MT03…05, X-MK01…07, X-AR02  
**Profundidade:** CRM Suite D4–D5 nos módulos core

---

## Submódulos vendáveis → registry (meta-sprint contínuo)

A partir de **S08**, cada submódulo listado no PRD (§6) vira entrada no `module-registry`:

| PRD submódulo | ID registry sugerido |
|---------------|---------------------|
| Captura / Distribuição / Qualificação / Enriquecimento | `crm-leads-*` |
| Pipeline / Forecast / Gestão / Metas | `crm-pipeline-*` |
| WhatsApp Suite / Webchat / Inbox / … | `crm-comms-*` |
| Workflow / Automação / IA Automation | `crm-auto-*` |
| Email / WhatsApp Marketing / … | `crm-campaign-*` |
| ICP / Lead Scoring / … | `crm-intel-*` |
| Jornada / CS / Retenção | `crm-journey-*` |
| BI * / Analytics | `crm-bi-*` |
| Meeting Hub / Agenda | `crm-meetings` |
| Chatbot / IA * | `crm-bot-*` |
| Help Desk / Service Desk / SAC | `crm-tickets-*` |
| API Platform / Integration Hub | `crm-integrations` |

---

## Calendário indicativo

| Trimestre | Sprints | Fases PRD fechadas |
|-----------|---------|-------------------|
| Q2 2026 | S01–S06 | Fundação + Leads parcial |
| Q3 2026 | S07–S12 | Leads completo + Pipeline completo (Fase 1) |
| Q4 2026 | S13–S19 | Omnichannel + Automação + Campanhas (Fases 2–3) |
| Q1 2027 | S20–S22 | IA + Journey + BI (Fase 4–5 parcial) |
| Q2 2027 | S23–S26 | Reuniões, Bot, Tickets, Ecossistema (Fases 5–6) |

---

## Definição de pronto (DoD) por sprint

1. Todos os IDs do backlog da sprint → `feito` ou `parcial` documentado  
2. `bun run ci` verde  
3. Eventos publicados para features que mutam dados  
4. Permissões atualizadas em `module-permissions` / platform roles  
5. Profundidade D atualizada no `module-registry` quando aplicável  
6. Spec filha (se existir) → `status: completed`
