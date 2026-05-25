# Variáveis de ambiente — Vercel

Referência exata para configurar os dois projetos Vercel (`apps/web` e `apps/platform-admin`).

Legenda de escopo:

| Coluna | Significado |
|--------|-------------|
| **Web** | Projeto Vercel com Root Directory `apps/web` |
| **Admin** | Projeto Vercel com Root Directory `apps/platform-admin` |
| **P** | Production |
| **Pr** | Preview |
| **D** | Development (local) |

---

## 1. Banco de dados

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `DATABASE_URL` | ✓ | ✓ | ✓ | ✓ | ✓ | **Sim** | Connection string PostgreSQL (Neon). **Mesmo valor** nos dois projetos. |

---

## 2. Autenticação (Auth.js / next-auth)

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `AUTH_SECRET_WEB` | ✓ | — | ✓ | ✓ | opcional | **Sim*** | Secret JWT do app tenant. `openssl rand -base64 32` |
| `AUTH_SECRET_PLATFORM_ADMIN` | — | ✓ | ✓ | ✓ | opcional | **Sim*** | Secret JWT do platform-admin. **Valor diferente** do web. |
| `AUTH_SECRET` | ✓ | ✓ | fallback | fallback | ✓ | Não** | Legado compartilhado se os específicos acima não existirem |
| `AUTH_URL` | ✓ | ✓ | ✓ | ✓ | ✓ | **Sim** | URL pública **deste** app (ex.: `https://web.vercel.app`). **Um valor por projeto.** |
| `AUTH_TRUSTED_HOSTS` | ✓ | ✓ | opcional | — | — | Não | Hosts permitidos separados por vírgula |

\* Em Preview/Production, exija `AUTH_SECRET_*` distintos; não use valores da [denylist](../../packages/shared/src/env/denylist.ts).

\*\* Evite `AUTH_SECRET` único em produção — aumenta blast radius.

---

## 3. URLs públicas (client-safe)

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `NEXT_PUBLIC_APP_URL` | ✓ | ✓ | ✓ | ✓ | ✓ | **Sim** | URL do app tenant (links, CORS, redirects) |
| `NEXT_PUBLIC_PLATFORM_ADMIN_URL` | ✓ | ✓ | ✓ | ✓ | ✓ | **Sim** | URL do platform-admin |

---

## 4. Criptografia de integradores

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `INTEGRATOR_ENCRYPTION_KEY` | ✓ | ✓ | ✓ | ✓ | ✓ | **Sim** | KEK AES-256. `openssl rand -base64 32`. **Mesmo valor** nos dois projetos. |

---

## 5. Schema sync no deploy (opcional — sem seeds)

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `RUN_VERCEL_DB_BOOTSTRAP` | opcional | ✓ | opcional | opcional | — | Não | Executa `prisma generate` + `db push` antes do build. **Sem seeds.** Prefira habilitar em **um** projeto só. |

## 5b. Seeds — somente local (`bun run db:setup-remote`)

Configure em `.env.vercel.production` (gitignored). **Não** suba para a Vercel via `vercel:env-sync` nem no painel.

| Variável | Obrigatória | Descrição |
|----------|:-----------:|-----------|
| `ALLOW_PLATFORM_ADMIN_SEED` | Demo local | Cria operador inicial via seed |
| `ALLOW_INTEGRATOR_CREDENTIALS_SEED` | Demo local | Grava credenciais fake criptografadas (Resend, Asaas, etc.) |
| `PLATFORM_ADMIN_SEED_EMAIL` | Com seed | E-mail do super admin demo |
| `PLATFORM_ADMIN_SEED_PASSWORD` | Com seed | Senha (nunca commite) |
| `PLATFORM_ADMIN_SEED_NAME` | Não | Nome exibido (default: `Super Admin`) |

⚠️ Aceitável em ambiente demo/staging local; **não use em produção real**.

---

## 6. Rate limiting (Upstash — recomendado)

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `UPSTASH_REDIS_REST_URL` | ✓ | ✓ | recomendado | recomendado | — | Não | Injetado ao instalar Upstash Redis no Marketplace |
| `UPSTASH_REDIS_REST_TOKEN` | ✓ | ✓ | recomendado | recomendado | — | Não | Token REST Upstash |

---

## 7. Webhooks e e-mail

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `PAYMENT_WEBHOOK_SECRET` | ✓ | — | **Sim** | ✓ | — | Com pagamentos | HMAC sha256 para `/api/webhooks/payment/*` |
| `RESEND_FROM_EMAIL` | ✓ | — | ✓ | ✓ | ✓ | Não | Remetente fallback se integrador Resend não configurado |

Credenciais Resend/Asaas reais: configure via **platform-admin → Integradores → Credenciais** (não via env).

---

## 8. Segurança platform-admin (opcional)

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `PLATFORM_ADMIN_ALLOWED_IPS` | — | ✓ | opcional | — | — | Não | IPs permitidos separados por vírgula |

---

## 9. LLM / Aprendiz (opcional)

| Variável | Web | Admin | P | Pr | D | Obrigatória | Descrição |
|----------|:---:|:-----:|:-:|:-:|:-:|:-----------:|-----------|
| `APRENDIZ_LLM_ENABLED` | ✓ | — | — | — | — | Não | `true` para usar LLM |
| `OPENAI_API_KEY` | ✓ | — | — | — | — | Com LLM | Chave OpenAI |
| `APRENDIZ_LLM_MODEL` | ✓ | — | — | — | — | Não | Ex.: `gpt-4o-mini` |

---

## 10. Variáveis automáticas Vercel (não configurar manualmente)

| Variável | Descrição |
|----------|-----------|
| `VERCEL` | `1` em runtime Vercel |
| `VERCEL_ENV` | `production` \| `preview` \| `development` |
| `VERCEL_URL` | Host do deployment atual |
| `NODE_ENV` | `production` em deploy |

---

## Checklist — Preview demo 100% funcional

1. Rode localmente: `bun run db:setup-remote` (`.env.vercel.production` com seeds abaixo).
2. Configure no painel Vercel apenas auth/URLs (sem `ALLOW_*` nem `PLATFORM_ADMIN_SEED_*`).

Copie para o projeto **platform-admin** (Preview — painel Vercel):

```env
DATABASE_URL=<neon>
INTEGRATOR_ENCRYPTION_KEY=<openssl rand -base64 32>
AUTH_SECRET_PLATFORM_ADMIN=<openssl rand -base64 32>
AUTH_URL=https://<seu-admin>.vercel.app
NEXT_PUBLIC_APP_URL=https://<seu-web>.vercel.app
NEXT_PUBLIC_PLATFORM_ADMIN_URL=https://<seu-admin>.vercel.app
RUN_VERCEL_DB_BOOTSTRAP=true
```

Seeds (apenas `.env.vercel.production` local, para `db:setup-remote`):

```env
ALLOW_PLATFORM_ADMIN_SEED=true
ALLOW_INTEGRATOR_CREDENTIALS_SEED=true
PLATFORM_ADMIN_SEED_EMAIL=admin@demo.suaempresa.com
PLATFORM_ADMIN_SEED_PASSWORD=<secret>
PLATFORM_ADMIN_SEED_NAME=Super Admin
```

Copie para o projeto **web** (Preview):

```env
DATABASE_URL=<mesmo neon>
INTEGRATOR_ENCRYPTION_KEY=<mesmo valor>
AUTH_SECRET_WEB=<openssl rand -base64 32>
AUTH_URL=https://<seu-web>.vercel.app
NEXT_PUBLIC_APP_URL=https://<seu-web>.vercel.app
NEXT_PUBLIC_PLATFORM_ADMIN_URL=https://<seu-admin>.vercel.app
```

Opcional em ambos (Upstash):

```env
UPSTASH_REDIS_REST_URL=<upstash>
UPSTASH_REDIS_REST_TOKEN=<upstash>
```

---

## O que **nunca** colocar em `NEXT_PUBLIC_*`

- `DATABASE_URL`
- `AUTH_SECRET*` / `INTEGRATOR_ENCRYPTION_KEY`
- `PLATFORM_ADMIN_SEED_PASSWORD`
- `UPSTASH_REDIS_REST_TOKEN`
- `PAYMENT_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
