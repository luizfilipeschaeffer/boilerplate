# Checklist — novo integrador

## Descoberta
- [ ] Id kebab-case (`payment-*`, `messaging-*`, etc.)
- [ ] Categoria correta (`payment`, `messaging`, `fiscal`, `storage`, `social`, `webhook`)
- [ ] Zona: `packages/integrators` (oficial) ou `community/` (comunidade)
- [ ] Módulos suportados (`modulosSuportados`: `["*"]` ou lista explícita)

## Contrato
- [ ] `BoilerplateIntegrator` com `version` semver
- [ ] `configSchema` completo (tipos: secret, string, url, boolean, select)
- [ ] `healthCheck` cobre credenciais ausentes/inválidas
- [ ] `capabilities` reflete uso (ex.: `externalHttp`, `webhooks`)

## Adapter
- [ ] Interface da categoria implementada (Payment/Messaging/Fiscal/...)
- [ ] Sem `process.env` — usar `ResolvedCredentials`
- [ ] Erros mapeados para códigos estáveis (`MISSING_KEY`, etc.)

## Registro
- [ ] Map/registry atualizado (ex.: `payment-registry.ts`)
- [ ] Export em `packages/integrators/src/index.ts` se público

## Catálogo e credenciais
- [ ] Entrada em `packages/db/data/platform-catalog.json`
- [ ] `gateway.configSchema.fields` alinhado ao `configSchema` do código
- [ ] `implementationStatus`: `implemented` | `scaffold` | `planned`
- [ ] Seed/teste de credenciais se BYOK (`db:seed-integrator-credentials`)

## Pagamento (se aplicável)
- [ ] Webhook em `apps/web/app/api/webhooks/payment/[integratorId]/route.ts`
- [ ] `confirmarWebhook` idempotente e seguro
- [ ] Gateway default documentado se substituir mock

## Qualidade
- [ ] Lint do pacote integrators / community
- [ ] Visível no marketplace (:3003) após rebuild
- [ ] README ou descrição no catálogo preenchida
