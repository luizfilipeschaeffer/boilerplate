---
status: planned
created: 2026-05-22
parent-spec: 002--crm-suite-roadmap--2026-05-22
---

# Tenant — Comunicação omnichannel

## Objetivo

Módulo vendável para clientes (tenants): **chat interno** (membros da organização, qualquer setor/filial) + **WhatsApp + Telegram + e-mail** em um único inbox, espelhando o layout de 3 colunas da plataforma.

## Referência de UI

- Plataforma: `apps/platform-admin/modules/platform-comms/comms-workspace.tsx`
- Layout: lista | conversa | dados do contato (estilo WhatsApp Web)

## Backend (futuro)

- Schema tenant: `tenant_comms_threads`, `tenant_comms_messages`, `participant_kind` (`client` | `member`), vínculo `membership` / `client_id`
- Integradores: `social-whatsapp-mock`, `telegram`, `email-resend-mock`
- RBAC por setor/filial via membership existente

## App web

- Rota reservada: `/comunicacao` (placeholder até provisionamento do módulo `core-comms`)
