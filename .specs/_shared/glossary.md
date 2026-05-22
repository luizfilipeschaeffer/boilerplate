# Glossário

Siglas usadas no PRD e nas specs — **não misturar escalas**.

| Sigla | Nome | Escala | Uso |
|-------|------|--------|-----|
| **R0–R4** | Marco de entrega (engenharia) | R0 fundação … R4 escala | Roadmap §14 — sprints |
| **P1–P4** | Fase de produto (tenant) | 1 informal … 4 escala | `organizations.phase`, pacotes, preço |
| **E0–E10** | Estágio de evolução empresarial | 0 sobrevivência … 10 mega corp | Maturidade do negócio do cliente |
| **D0–D5** | Profundidade do módulo | 0 inexistente … 5 escala | Quão completo o módulo está vs alvo |

## Atenção

- Marco **R0** ≠ estágio **E0**.
- Fase **P2** ≠ estágio **E2**.

## Setores

| Termo | Onde |
|-------|------|
| **Setor core** | Catálogo global (`core_sectors`) |
| **Setor tenant** | Instância por org (`sectors`), default `geral` |

## CRM (dois domínios)

| Termo | Módulo | Descrição |
|-------|--------|-----------|
| **CRM Plataforma** | `platform-crm` | Funil SaaS: lead → trial → org; schema global |
| **CRM Comercial (tenant)** | `core-crm` | Pipeline do cliente com *seus* leads/clientes; schema `crm_*` por tenant |
| **CRM Suite (PRD)** | `doc/modulos/crm-suite/crm.md` | Visão produto omnichannel; roadmap em `.specs/002--crm-suite-roadmap--2026-05-22` |

`core-clientes` é cadastro operacional; não substitui `core-crm` nem `platform-crm`.

## Apps

| App | Usuário | Porta dev |
|-----|---------|-----------|
| `apps/web` | Cliente SaaS (tenant) | 3000 |
| `apps/platform-admin` | Operação interna | 3002 |
