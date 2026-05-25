# Checklist — novo módulo

## Descoberta
- [ ] Id kebab-case definido
- [ ] Zona escolhida: `modules/` (oficial) ou `community/` (comunidade)
- [ ] Segmentos alvo (`segment` no contrato)
- [ ] Dependências de outros módulos (`dependencias` no registry)

## Contrato e segurança
- [ ] `BoilerplateModule` em `src/contract.ts`
- [ ] `coreContract: "^1.2.0"`
- [ ] Capabilities explícitas; `filesystem/processEnv/crossTenant: false`
- [ ] Permissões `<id>.read` / `<id>.write` declaradas e usadas na UI/actions
- [ ] Eventos com `eventType`, `eventVersion`, `handlerId` únicos

## Dados
- [ ] Tabelas com prefixo `{moduleId}_`
- [ ] `registerModuleTables` em `packages/db/src/module-migrations.ts`
- [ ] Migrations tenant testadas com `bun run db:migrate-tenants`

## Integração monorepo
- [ ] Entrada em `register-all.ts` (oficial)
- [ ] Rota/página no `apps/web` se houver UI tenant
- [ ] Handlers registrados no boot server (`apps/web/lib/modules/init-server.ts` se aplicável)

## Qualidade
- [ ] `bun test` no pacote
- [ ] `bun run lint:ecosystem` (community)
- [ ] README com propósito e como rodar localmente
