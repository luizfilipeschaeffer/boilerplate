# Plano de execução — crm-helpdesk

## Marco 1 — Fundação

- Tabelas tenant `crm_helpdesk_*`
- CRUD tickets, comentários, filas, atribuição
- UI inbox + detalhe

## Marco 2 — KB híbrida

- Artigo (`solutions` JSON) e thread (`kb_posts`)
- N:N `ticket_kb_links`, busca FTS

## Marco 3 — SLA + CSAT + automações

- Políticas SLA, CSAT, regras seed

## Marco 4 — Aprendiz + platform

- Indexação chunks, copiloto, portal deflexão
- Bridge comms, dashboard platform-admin

## Marco 5 — Eventos

- `crm-helpdesk.ticket.*`, `crm-helpdesk.kb.published`, timeline X-TL06
