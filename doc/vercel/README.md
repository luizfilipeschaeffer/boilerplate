# Deploy na Vercel — Boilerplate SaaS

Guia para publicar `@boilerplate/web` (tenant) e `@boilerplate/platform-admin` com banco bootstrapado e ambiente pronto para o admin validar módulos e integrações.

## Arquitetura na Vercel

Dois **projetos Vercel** no mesmo repositório Git, compartilhando **um PostgreSQL** (Neon recomendado via Marketplace):

| Projeto Vercel | Root Directory | URL típica |
|----------------|----------------|------------|
| `boilerplate-web` | `apps/web` | `https://<web>.vercel.app` |
| `boilerplate-platform-admin` | `apps/platform-admin` | `https://<admin>.vercel.app` |

Cada app possui [`vercel.json`](../../apps/web/vercel.json) com:

- **Install:** `cd ../.. && bun install --frozen-lockfile`
- **Build:** `cd ../.. && bun scripts/vercel-build.ts --filter @boilerplate/<app>`

## Banco: schema no deploy, seeds só local

| Etapa | Onde roda | Script |
|-------|-----------|--------|
| Schema (`generate` + `db push`) | Deploy Vercel (opcional) | [`vercel-schema-sync.ts`](../../packages/db/scripts/vercel-schema-sync.ts) quando `RUN_VERCEL_DB_BOOTSTRAP=true` |
| Seeds (catálogo, admin, credenciais demo) | **Só local/CI** | [`setup-remote.ts`](../../packages/db/scripts/setup-remote.ts) via `bun run db:setup-remote` |

Prepare o Neon **da sua máquina** antes do primeiro deploy com preview demo:

```bash
# .env.vercel.production: DATABASE_URL, INTEGRATOR_ENCRYPTION_KEY, ALLOW_* e PLATFORM_ADMIN_SEED_*
bun run db:setup-remote
```

O `db:setup-remote` é idempotente:

1. `vercel-schema-sync` — `prisma generate` + `prisma db push`
2. Seed roadmap (módulos, integradores, segmentos)
3. Seed platform-admin — se `ALLOW_PLATFORM_ADMIN_SEED=true`
4. Seed credenciais demo — se `ALLOW_INTEGRATOR_CREDENTIALS_SEED=true`

### Schema sync no deploy (opcional)

Se quiser aplicar o schema no build da Vercel (sem seeds), defina `RUN_VERCEL_DB_BOOTSTRAP=true` em **um** projeto apenas (recomendado: `platform-admin`) para evitar corrida entre dois deploys simultâneos.

**Não** configure `ALLOW_PLATFORM_ADMIN_SEED`, `ALLOW_INTEGRATOR_CREDENTIALS_SEED` nem `PLATFORM_ADMIN_SEED_*` no painel Vercel — essas variáveis são ignoradas no deploy e só pertencem ao `.env.vercel.production` local.

## Passo a passo — primeiro deploy

### 1. Banco PostgreSQL (Neon)

1. Vercel Dashboard → **Storage** → **Create Database** → **Neon Postgres**
2. Vincule ao projeto **platform-admin** (ou ambos)
3. A variável `DATABASE_URL` é injetada automaticamente — **use a mesma** nos dois projetos (Settings → Environment Variables → copiar)

### 2. Projeto `boilerplate-web`

1. **Add New Project** → importe o repositório
2. **Root Directory:** `apps/web`
3. **Framework Preset:** Next.js (detectado via `vercel.json`)
4. Configure variáveis — ver [environment-variables.md](./environment-variables.md) (seção **Web**)
5. Deploy

### 3. Projeto `boilerplate-platform-admin`

1. **Add New Project** → mesmo repositório
2. **Root Directory:** `apps/platform-admin`
3. Configure variáveis — ver [environment-variables.md](./environment-variables.md) (seção **Platform Admin**)
4. Deploy (schema sync no build apenas se `RUN_VERCEL_DB_BOOTSTRAP=true`)

### 4. Validar ambiente

Após o deploy do **platform-admin**:

1. Acesse `https://<admin>.vercel.app/login`
2. Login com `PLATFORM_ADMIN_SEED_EMAIL` / `PLATFORM_ADMIN_SEED_PASSWORD`
3. Valide módulos: CRM, Segmentos, Integradores, Módulos, Organizações
4. Em **Integradores → Credenciais**, confirme status `configured` (seed demo)
5. Acesse `https://<web>.vercel.app` — cadastro/login tenant

## Variáveis de ambiente

Referência completa: **[environment-variables.md](./environment-variables.md)**

### Deploy rápido (template + sync)

```bash
copy doc\vercel\env.production.example .env.vercel.production
# Preencha DATABASE_URL, secrets, URLs dos projetos Vercel
bun run vercel:env-sync
```

### Mínimo obrigatório (Preview demo funcional)

**Compartilhadas (ambos projetos):**

| Variável | Como obter |
|----------|------------|
| `DATABASE_URL` | Neon / Vercel Storage |
| `INTEGRATOR_ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `AUTH_SECRET_WEB` | `openssl rand -base64 32` |
| `AUTH_SECRET_PLATFORM_ADMIN` | `openssl rand -base64 32` (valor **diferente** do web) |

**Web (`apps/web`):**

| Variável | Exemplo |
|----------|---------|
| `AUTH_URL` | `https://boilerplate-web.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://boilerplate-web.vercel.app` |
| `NEXT_PUBLIC_PLATFORM_ADMIN_URL` | `https://boilerplate-admin.vercel.app` |

**Platform-admin (`apps/platform-admin`):**

| Variável | Exemplo |
|----------|---------|
| `AUTH_URL` | `https://boilerplate-admin.vercel.app` |
| `NEXT_PUBLIC_PLATFORM_ADMIN_URL` | `https://boilerplate-admin.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://boilerplate-web.vercel.app` |
| `RUN_VERCEL_DB_BOOTSTRAP` | `true` (opcional — só `db push`, sem seeds) |

Seeds e operador demo: configure em `.env.vercel.production` e rode `bun run db:setup-remote` (não no painel Vercel).

## Comandos locais (espelham Vercel)

```bash
# Simular build Vercel (sem schema sync)
bun run check:vercel

# Setup completo remoto (schema + seeds) — use .env.vercel.production
bun run db:setup-remote

# Só schema (como deploy com RUN_VERCEL_DB_BOOTSTRAP=true)
bun run db:schema-sync

# Build com schema sync (como platform-admin na Vercel)
RUN_VERCEL_DB_BOOTSTRAP=true bun scripts/vercel-build.ts --filter @boilerplate/platform-admin
```

## Upstash Redis (recomendado Preview/Production)

Instale **Upstash Redis** via Vercel Marketplace no projeto **web**. Variáveis injetadas:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Sem Redis, rate limiting usa memória local (ok em dev; limitado em serverless).

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Login admin falha | Seed não rodou localmente | `bun run db:setup-remote` com `ALLOW_PLATFORM_ADMIN_SEED=true` no `.env.vercel.production` |
| `INTEGRATOR_ENCRYPTION_KEY` | Ausente ou curta | Gere 32 bytes base64; configure em ambos projetos |
| Prisma engine error | Binary não no bundle | Rode redeploy; build copia engine para `apps/*/src/generated/prisma` |
| Integradores sem credencial | Seed demo ausente | `bun run db:setup-remote` com `ALLOW_INTEGRATOR_CREDENTIALS_SEED=true` local |
| Build lento (~5 min) | Seeds no deploy (legado) | Remova `ALLOW_*` e `PLATFORM_ADMIN_SEED_*` do painel Vercel; seeds só via `db:setup-remote` |
| Auth redirect errado | `AUTH_URL` incorreto | Uma URL por app, com `https://` |

## Limpeza no painel Vercel (após esta mudança)

Se o build ainda mostrar `[seed-roadmap]` nos logs, remova destes projetos (web e/ou platform-admin) em **Settings → Environment Variables**:

- `ALLOW_PLATFORM_ADMIN_SEED`
- `ALLOW_INTEGRATOR_CREDENTIALS_SEED`
- `PLATFORM_ADMIN_SEED_EMAIL`
- `PLATFORM_ADMIN_SEED_PASSWORD`
- `PLATFORM_ADMIN_SEED_NAME`

Mantenha `RUN_VERCEL_DB_BOOTSTRAP=true` apenas se quiser `db push` no deploy (recomendado em **um** projeto). Depois rode `bun run db:setup-remote` localmente para popular catálogo, admin e credenciais demo.

## Segurança em Production

- **Não** use `ALLOW_PLATFORM_ADMIN_SEED` em produção real com senha fixa
- **Não** use `ALLOW_INTEGRATOR_CREDENTIALS_SEED` em produção real (chaves fake do repo)
- Configure `PAYMENT_WEBHOOK_SECRET` antes de expor webhooks de pagamento
- Use secrets distintos: `AUTH_SECRET_WEB` ≠ `AUTH_SECRET_PLATFORM_ADMIN`

Ver também: [doc/security/incident-response.md](../security/incident-response.md)
