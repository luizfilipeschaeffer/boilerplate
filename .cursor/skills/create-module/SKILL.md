---
name: create-module
description: >-
  Scaffolds and wires Boilerplate Enterprise modules following sdk-core
  contracts, schema registry, and monorepo conventions. Use when the user asks
  to create, scaffold, or extend a module, add routes/event handlers, register
  module tables, or integrate a new package under modules/ or community/.
---

# Criar módulo (Boilerplate Enterprise)

## Objetivo

Entregar um módulo compatível com `@boilerplate/sdk-core`, registrado no catálogo e pronto para dev local — sem violar isolamento de tenant nem regras de segurança do ecossistema.

## 1. Escolher zona

| Zona | Caminho | Quando usar |
|------|---------|-------------|
| Oficial | `modules/<id>/` | Mantido pelo core; entra em `register-all.ts` |
| Comunidade | `community/<id>/` | Externo/contribuidor; pacote `@boilerplate-community/*` |

Referências:
- Contrato: `packages/sdk-core/src/contracts/module.ts`
- Exemplo: `community/example-module/`
- Registro oficial: `packages/module-registry/src/register-all.ts`

## 2. Scaffold

Preferir CLI na raiz do monorepo:

```bash
bunx create-boilerplate-module <module-id>
```

Ou copiar `community/example-module/` e renomear `id`, permissões, rotas e eventos.

**Convenções de id:** kebab-case (`core-crm`, `example-module`). Permissões: `<id>.read`, `<id>.write`.

## 3. Contrato (`src/contract.ts`)

Implementar `BoilerplateModule`:

```typescript
import type { BoilerplateModule } from "@boilerplate/sdk-core";

export const moduleContract: BoilerplateModule = {
  id: "my-module",
  version: "0.1.0",
  coreContract: "^1.2.0",
  segment: ["ecommerce"], // opcional
  capabilities: {
    database: true,
    queues: true,
    filesystem: false,
    processEnv: false,
    crossTenant: false,
  },
  requiredPermissions: ["my-module.read", "my-module.write"],
  routes: [{ path: "/my-module", label: "My Module", permission: "my-module.read" }],
  eventHandlers: [
    {
      eventType: "my-module.item.created",
      eventVersion: "^1.0.0",
      handlerId: "my-module-on-item-created",
      async: true,
      moduleId: "my-module",
    },
  ],
};
```

Regras obrigatórias:
- `filesystem`, `processEnv`, `crossTenant` devem ser `false` em módulos de ecossistema
- Capabilities declaradas devem bater com o uso real (DB, filas, HTTP externo, etc.)
- Mudanças breaking exigem RFC em `doc/rfcs/` (ver `packages/module-registry/CONTRACTS.md`)

## 4. Runtime (handlers, contexto, eventos)

- Contexto tenant: `createModuleContext` de `@boilerplate/sdk-server`
- Handlers: `createEventHandler` / `createEventPublisher` de `@boilerplate/sdk-events`
- Padrão: `community/example-module/src/handlers.ts`

**Proibido no código do módulo:**
- Importar `@boilerplate/db` ou Prisma diretamente
- Ler `process.env` (credenciais vêm do host via SDK)

## 5. Tabelas e migrations (se `database: true`)

1. Prefixar tabelas: `{moduleId}_*` (ex.: `example_module_items`)
2. Registrar no schema registry:

```typescript
// packages/db/src/module-migrations.ts
registerModuleTables("my-module", [
  { name: "my_module_items", description: "..." },
]);
```

3. Implementar `migrations` no contrato ou funções em `registerModuleMigrations` quando houver DDL tenant

## 6. Registro no catálogo (oficial)

Em `packages/module-registry/src/register-all.ts`, adicionar `scaffold(...)` ou `registerModule(defineModule({...}))` com:
- `implementationStatus`: `implemented` | `scaffold` | `planned`
- `navLabel`, `navOrdem`, `routePath`, `dependencias`, `sectorSlug`, `camada`

Módulos com UI no tenant precisam de página em `apps/web/app/(dashboard)/...` e entrada de navegação coerente com a rota do contrato.

## 7. UI (opcional)

- Componentes React: `@boilerplate/sdk-react` quando aplicável
- Seguir layout do dashboard (`DashboardShell`, shadcn/ui em `apps/web/components/ui/`)
- RBAC: checar permissões do contrato antes de actions sensíveis

## 8. Validação antes de concluir

```bash
bun run lint:ecosystem    # community/
bun run --filter @boilerplate-community/<id> test
bun run --filter apps-marketplace build   # catálogo reflete registry
bun run db:migrate-tenants                # se registrou tabelas novas
```

Checklist completo: [checklist.md](checklist.md)

## 9. Entregáveis mínimos

- [ ] `package.json` com `@boilerplate/sdk-core` (e sdk-server/sdk-events se necessário)
- [ ] `src/contract.ts` + `src/index.ts` exportando contrato
- [ ] Teste mínimo do contrato (ver `community/example-module/src/contract.test.ts`)
- [ ] Registro no registry (oficial) ou documentação README (comunidade)
- [ ] Sem imports proibidos e capabilities honestas
