# Boilerplate — Plataforma de Gestão Modular Adaptativa

Monorepo da plataforma descrita em [prd.md](./prd.md).

## Pré-requisitos

- [Bun](https://bun.sh) 1.2+ (runtime e package manager — **não** usar pnpm/npm neste repo)
- Docker Desktop (PostgreSQL local na porta **5454**)

### Instalar Bun (Windows)

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

Reabra o terminal e confira: `bun --version`.

## Setup rápido

```bash
# 1. Banco
bun run db:up

# 2. Dependências (na raiz)
bun install

# 3. Variáveis de ambiente
cp .env.example .env
# Gere AUTH_SECRET: openssl rand -base64 32

# 4. Prisma
bun run db:generate
bun run db:push

# 5. Super admin do platform-admin (somente dev local)
# Copie .env.example → .env.development e preencha:
#   PLATFORM_ADMIN_SEED_EMAIL=seu@email.dev
#   PLATFORM_ADMIN_SEED_PASSWORD=senha-forte-local
bun run db:seed-platform-admin

# 6. Dev
bun run dev
# Tenant: http://localhost:3000 — login dev com qualquer e-mail/senha
# Platform-admin: http://localhost:3002 — use o e-mail/senha do seed acima
```

### Rede local (celular / outro PC)

1. No `.env.development` da raiz, use o IP da máquina (ex. `192.168.3.3`):

   ```env
   NEXT_PUBLIC_APP_URL=http://192.168.3.3:3000
   DEV_ALLOWED_ORIGIN=http://192.168.3.3:3000,http://localhost:3000
   NEXT_PUBLIC_PLATFORM_ADMIN_URL=http://192.168.3.3:3002
   ```

2. Copie os exemplos por app (ajuste o IP se mudar):

   - `apps/web/.env.development.example` → `apps/web/.env.development`
   - `apps/platform-admin/.env.development.example` → `apps/platform-admin/.env.development`

3. `bun run dev` já escuta em `192.168.3.3` (todas as interfaces). Acesse:

   - Tenant: http://192.168.3.3:3000
   - Admin: http://192.168.3.3:3002

4. Se não abrir de outro aparelho, libere as portas **3000** e **3002** no Firewall do Windows para rede privada.

## PostgreSQL (Docker)

- Host: `localhost`
- Porta: **5454**
- URL: `postgresql://boilerplate:boilerplate@localhost:5454/boilerplate`

Detalhes: [infra/docker/README.md](./infra/docker/README.md).

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `bun install` | Instala workspaces |
| `bun run clean` | Remove `node_modules`, `.next`, `.turbo`, `dist` e outros caches |
| `bun run ci` | Pipeline local (generate, validate, lint, build) — igual ao GitHub Actions |
| `bun run dev` | Turborepo — `apps/web` (:3000) e `platform-admin` (:3002) |
| `bun run build` | Build de produção |
| `bunx --bun shadcn@latest …` | CLI shadcn em `apps/web` |
| `bun run db:up` | Sobe Postgres no Docker |
| `bun run db:push` | Aplica schema Prisma |
| `bun run db:restart` | Zera o banco, recria schema public e roda seed do superadmin |
| `bun run db:seed-platform-admin` | Cria/atualiza `platform_admin` (dev) |
| `bun run db:migrate-tenants` | Atualiza DDL dos schemas `tenant_*` |

## Platform-admin — primeiro operador (segurança)

### Desenvolvimento local

1. Defina no `.env.development` (gitignored), **sem** commitar senha:

   ```env
   PLATFORM_ADMIN_SEED_EMAIL=voce@empresa.dev
   PLATFORM_ADMIN_SEED_PASSWORD=senha-forte-apenas-local
   ```

2. Execute: `bun run db:seed-platform-admin`

3. Acesse http://localhost:3002/login com essas credenciais.

A senha é armazenada como **bcrypt** em `platform_users.password_hash`.

### Produção e staging

- O script **recusa** rodar com `NODE_ENV=production` unless `ALLOW_PLATFORM_ADMIN_SEED=true`.
- **Não** use senha fixa em `.env` de produção.
- Fluxo recomendado:
  - Criar o primeiro `platform_admin` via pipeline com secrets do provedor (GitHub Actions, Vercel, etc.), **uma vez**; ou
  - Inserção manual controlada / convite corporativo (SSO futuro).
- Para bootstrap em ambiente efêmero (ex.: review app), injete `PLATFORM_ADMIN_SEED_*` como secrets de CI e set `ALLOW_PLATFORM_ADMIN_SEED=true` só naquele job — nunca no repositório.

## Estrutura (alvo)

```
apps/web              # App tenant (Next 16.2.6)
apps/platform-admin   # Painel interno
packages/*            # db, module-registry, shared, …
infra/docker          # PostgreSQL :5454
```
