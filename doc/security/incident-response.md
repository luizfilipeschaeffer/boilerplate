# Resposta a incidentes — Boilerplate SaaS

## Rotação de AUTH_SECRET (zero-downtime)

1. Gere novo secret: `openssl rand -base64 32`
2. Configure `AUTH_SECRET_NEW` (ou `AUTH_SECRET_WEB` / `AUTH_SECRET_PLATFORM_ADMIN`) mantendo o valor antigo ativo
3. Deploy e aguarde `session.maxAge` (8h) para sessões antigas expirarem
4. Remova o secret antigo

## Rotação de INTEGRATOR_ENCRYPTION_KEY

1. Gere nova KEK: `openssl rand -base64 32`
2. Em staging: `INTEGRATOR_ENCRYPTION_KEY_OLD=<atual> INTEGRATOR_ENCRYPTION_KEY=<nova> bun packages/db/scripts/rotate-kek.ts`
3. Valide integradores (health check na UI)
4. Promova para produção com janela de rollback de 24h mantendo `INTEGRATOR_ENCRYPTION_KEY_OLD`

## Revogação em massa de sessões

```typescript
import { revokeAllUserSessions } from "@boilerplate/db";
await revokeAllUserSessions(); // incrementa sessionVersion em todos os users
```

Usuários precisam fazer login novamente na próxima requisição autenticada.

## Checklist de breach (multi-tenant)

1. Isolar tenant: `organization.active = false`
2. Rotacionar `AUTH_SECRET` e `INTEGRATOR_ENCRYPTION_KEY`
3. `revokeAllUserSessions()`
4. Revisar audit logs (`auth.login`, `credential.upsert`) — últimas 72h
5. Rotacionar credenciais de integradores do tenant via platform-admin
6. Notificação LGPD (ANPD em até 72h se PII comprometida)

## O que nunca logar

- OTP / códigos de login
- `AUTH_SECRET`, `INTEGRATOR_ENCRYPTION_KEY`
- Credenciais descriptografadas de integradores
- Tokens de sessão completos
