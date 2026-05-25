# Contributing to Open Boilerplate Enterprise

## Documentação principal

**Antes de abrir uma PR de módulo ou integrador da comunidade, leia o guia completo:**

→ **[doc/ecosystem/publicacao-pr-comunidade.md](../doc/ecosystem/publicacao-pr-comunidade.md)**

Esse guia cobre scaffold, segurança, metadados (`ecosystem.publication.json`), template de PR, auditoria e rollout na plataforma (moderação em `/comunidade`).

## Quick start

```bash
bun install
bun run db:up
bun run db:generate
bun run db:push
bun dev:community
bunx create-boilerplate-module my-module
# Mover para community/my-module e preencher ecosystem.publication.json
```

## Contribution zones

| Zone | Path | Requirements |
|------|------|--------------|
| Core | `packages/core/**` | Core team only |
| Official modules | `modules/**` | Security CI + maintainer review |
| **Community** | **`community/**`** | [Guia de PR](../doc/ecosystem/publicacao-pr-comunidade.md) + ESLint ecosystem + tests |
| External | npm `@boilerplate-community/*` | Signed manifest + marketplace index |

## PR checklist (resumo)

Use o template **Ecosystem** ao abrir a PR no GitHub.

- [ ] Contratos `@boilerplate/sdk-core`
- [ ] Arquivo `ecosystem.publication.json` no pacote
- [ ] Sem `@boilerplate/db` em `community/`
- [ ] Sem `process.env` no pacote
- [ ] Capabilities declaradas = uso real
- [ ] Tabelas `{moduleId}_*` (módulos)
- [ ] `bun run lint:ecosystem` + `bun test` no pacote

## Exemplos

| Tipo | Caminho |
|------|---------|
| Módulo | [example-module](./example-module/) |
| Integrador | [example-integrator](./example-integrator/) |
| Metadados | [ecosystem.publication.template.json](./ecosystem.publication.template.json) |

## RFC process

Contract changes require an RFC in `doc/rfcs/` with 14-day comment period.

## Após merge

1. CI valida segurança do ecossistema
2. Code review (`CODEOWNERS` em `/community/`)
3. Moderação em **platform-admin → Comunidade** (`/comunidade`)
4. Após aprovação: marketplace + uso pelos tenants
