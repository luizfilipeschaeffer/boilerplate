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

## Bootstrap do banco (local — recomendado)

O deploy **não** roda seed por padrão (`RUN_VERCEL_DB_BOOTSTRAP` desligado na Vercel).
Prepare o Neon **da sua máquina** antes do primeiro deploy:

```bash
# .env.vercel.production com DATABASE_URL (Neon) + INTEGRATOR_ENCRYPTION_KEY + seeds
bun run db:setup-remote
```

O script [`packages/db/scripts/vercel-bootstrap.ts`](../../packages/db/scripts/vercel-bootstrap.ts) é idempotente:

1. `prisma generate` + `prisma db push`
2. Seed roadmap (módulos, integradores, segmentos)
3. Seed platform-admin — se `ALLOW_PLATFORM_ADMIN_SEED=true` no `.env.vercel.production`
4. Seed credenciais demo — se `ALLOW_INTEGRATOR_CREDENTIALS_SEED=true`

### Bootstrap no deploy (opcional — não recomendado)

Só se quiser rodar no build da Vercel, defina `RUN_VERCEL_DB_BOOTSTRAP=true` **no painel** (projeto platform-admin).

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
3. Configure variáveis — ver [environment-variables.md](./environment-variables.md) (seção **Platform Admin** + **Bootstrap**)
4. Deploy (este deploy roda o bootstrap se `RUN_VERCEL_DB_BOOTSTRAP=true`)

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
| `RUN_VERCEL_DB_BOOTSTRAP` | `true` |
| `ALLOW_PLATFORM_ADMIN_SEED` | `true` |
| `ALLOW_INTEGRATOR_CREDENTIALS_SEED` | `true` |
| `PLATFORM_ADMIN_SEED_EMAIL` | `admin@demo.suaempresa.com` |
| `PLATFORM_ADMIN_SEED_PASSWORD` | senha forte (secret) |
| `PLATFORM_ADMIN_SEED_NAME` | `Super Admin` |

## Comandos locais (espelham Vercel)

```bash
# Simular build Vercel (sem bootstrap)
bun run check:vercel

# Bootstrap manual (precisa DATABASE_URL + INTEGRATOR_ENCRYPTION_KEY)
RUN_VERCEL_DB_BOOTSTRAP=true \
ALLOW_PLATFORM_ADMIN_SEED=true \
ALLOW_INTEGRATOR_CREDENTIALS_SEED=true \
PLATFORM_ADMIN_SEED_EMAIL=admin@demo.dev \
PLATFORM_ADMIN_SEED_PASSWORD=senha-local \
bun run db:vercel-bootstrap

# Build com bootstrap (como platform-admin na Vercel)
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
| Login admin falha | Seed não rodou | Confirme `RUN_VERCEL_DB_BOOTSTRAP=true` no admin; veja logs do build |
| `INTEGRATOR_ENCRYPTION_KEY` | Ausente ou curta | Gere 32 bytes base64; configure em ambos projetos |
| Prisma engine error | Binary não no bundle | Rode redeploy; build copia engine para `apps/*/src/generated/prisma` |
| Integradores sem credencial | Seed desligado | `ALLOW_INTEGRATOR_CREDENTIALS_SEED=true` |
| Auth redirect errado | `AUTH_URL` incorreto | Uma URL por app, com `https://` |

## Segurança em Production

- **Não** use `ALLOW_PLATFORM_ADMIN_SEED` em produção real com senha fixa
- **Não** use `ALLOW_INTEGRATOR_CREDENTIALS_SEED` em produção real (chaves fake do repo)
- Configure `PAYMENT_WEBHOOK_SECRET` antes de expor webhooks de pagamento
- Use secrets distintos: `AUTH_SECRET_WEB` ≠ `AUTH_SECRET_PLATFORM_ADMIN`

Ver também: [doc/security/incident-response.md](../security/incident-response.md)
