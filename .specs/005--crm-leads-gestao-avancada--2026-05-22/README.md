---
status: completed
owner: null
created: 2026-05-22
updated: 2026-05-22
marco: R3
fase-produto: P2
modulos:
  - core-crm
parent-spec: 002--crm-suite-roadmap--2026-05-22
sprint: S05
---

# core-crm — Gestão avançada de leads · Sprint S05

## Resumo

Tags, origem, UTMs, proprietário (owner), status, observações estendidas, deduplicação por e-mail/telefone/CNPJ e merge manual assistido no tenant (`/crm`).

## Critérios de aceite

- [x] Aba **Gestão** no sheet do lead com edição de campos e tags
- [x] Lista de possíveis duplicados no painel e aviso ao criar lead
- [x] Merge manual (origem → destino) com realocação de notas, atividades e deals
- [x] Server Actions: detalhe, update, duplicados, owners, merge
- [x] Eventos `crm.lead.atualizado`, `crm.lead.mesclado`
- [x] DDL em `tenant-leads` + colunas no provision de tenant novo

## Fora de escopo

- Merge automático sem confirmação (M1-G03 parcial — assistido apenas)
- Captura multicanal (S06)
- Distribuição round-robin (S07)

## Arquivos principais

- `packages/db/src/crm/tenant-leads.ts`
- `packages/crm-ui/src/crm-lead-detail-panel.tsx`
- `apps/web/app/actions/crm.ts`
- `apps/web/components/crm/tenant-crm-board-client.tsx`

## Plano

Ver [plan.md](./plan.md).
