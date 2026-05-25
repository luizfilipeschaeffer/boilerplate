---
name: create-integrator
description: >-
  Scaffolds and wires Boilerplate Enterprise integrators (payment, messaging,
  fiscal, storage, social, webhook) following sdk-core contracts and
  platform-catalog.json. Use when the user asks to create an integrator, gateway,
  adapter, messaging provider, or add credentials/healthCheck for external services.
---

# Criar integrador (Boilerplate Enterprise)

## Objetivo

Entregar um integrador compatível com `BoilerplateIntegrator`, visível no catálogo/marketplace e utilizável pelo tenant (credenciais BYOK ou plataforma).

## 1. Escolher zona e categoria

| Zona | Caminho | Quando usar |
|------|---------|-------------|
| Oficial | `packages/integrators/src/` | Gateways mantidos pela plataforma |
| Comunidade | `community/example-integrator/` | Pacote `@boilerplate-community/*` |

**Categorias** (`IntegratorCategory`): `payment` | `messaging` | `fiscal` | `storage` | `social` | `webhook`

Referências:
- Contrato: `packages/sdk-core/src/contracts/integrator.ts`
- Exemplo: `community/example-integrator/src/index.ts`
- Pagamentos: `packages/integrators/src/payment-registry.ts`, `payment-asaas-adapter.ts`
- Catálogo: `packages/db/data/platform-catalog.json`

## 2. Contrato (`BoilerplateIntegrator`)

```typescript
import type { BoilerplateIntegrator, MessagingAdapter } from "@boilerplate/sdk-core";

export const myIntegrator: BoilerplateIntegrator<MessagingAdapter> = {
  id: "example-messaging",
  version: "0.1.0",
  category: "messaging",
  configSchema: [
    { key: "apiKey", label: "API Key", type: "secret", required: true },
    { key: "fromEmail", label: "From Email", type: "string", required: true },
  ],
  capabilities: { externalHttp: true },
  healthCheck: async (creds) => {
    if (!creds.secrets.apiKey) {
      return { ok: false, code: "MISSING_KEY", message: "apiKey required" };
    }
    return { ok: true, latencyMs: 12 };
  },
  adapter: myAdapter,
};
```

Regras:
- `healthCheck` obrigatório — deve validar credenciais reais ou retornar erro claro
- `configSchema` alinha com campos em `platform-catalog.json` → `gateway.configSchema.fields` (pagamentos)
- Adapter tipado: `PaymentAdapter`, `MessagingAdapter`, `FiscalAdapter`, etc.

## 3. Implementar adapter

**Payment (oficial):** implementar `PaymentGatewayAdapter` em `payment-types.ts`:
- `criarValidacaoPagamento`
- `confirmarWebhook`
- `cancelar` (opcional)

Registrar em `packages/integrators/src/payment-registry.ts`:

```typescript
PAYMENT_ADAPTERS.set(myAdapter.id, myAdapter);
```

**Outras categorias:** seguir shape do adapter em `sdk-core/contracts/integrator.ts`. Manter lógica HTTP isolada; secrets vêm de `ResolvedCredentials`, nunca de `process.env` no adapter exportado.

## 4. Catálogo da plataforma

Adicionar entrada em `packages/db/data/platform-catalog.json`:

```json
{
  "id": "payment-myprovider",
  "label": "My Provider",
  "tipo": "payment",
  "provider": "My Provider",
  "description": "...",
  "implementationStatus": "scaffold",
  "modulosSuportados": ["*"],
  "packagePath": "packages/integrators",
  "deliveryMarco": "R3",
  "ordem": 50,
  "gateway": {
    "isDefault": false,
    "ativo": true,
    "configSchema": {
      "fields": [
        { "key": "apiKey", "label": "API Key", "type": "secret", "required": true }
      ]
    }
  }
}
```

Depois sincronizar seed se necessário: `bun run db:seed-roadmap`

## 5. Credenciais e tenant

- Credenciais configuráveis: schema em catálogo + UI tenant (`apps/web/components/tenant-integrators-view.tsx`)
- Platform-admin edita defaults: `apps/platform-admin/modules/platform-integradores/credential-actions.ts`
- Webhook pagamento: `apps/web/app/api/webhooks/payment/[integratorId]/route.ts`

Para integradores com credenciais em dev: `bun run db:seed-integrator-credentials` (requer `INTEGRATOR_ENCRYPTION_KEY`).

## 6. Marketplace / biblioteca

Integradores oficiais aparecem via `platform-catalog.json`. Comunidade: adicionar em `apps/marketplace/lib/catalog.ts` somente se for exemplo documentado.

## 7. Validação antes de concluir

```bash
bun run lint:ecosystem
bun run --filter @boilerplate/integrators lint
bun run --filter apps-marketplace build
```

Checklist completo: [checklist.md](checklist.md)

## 8. Entregáveis mínimos

- [ ] Export do integrador (`id`, `category`, `configSchema`, `healthCheck`, `adapter`)
- [ ] Registro no registry da categoria (ex.: `payment-registry.ts`)
- [ ] Entrada em `platform-catalog.json` com `implementationStatus` correto
- [ ] Teste manual de healthCheck com credenciais mock
- [ ] Webhook documentado/testado se `category === "payment"`
