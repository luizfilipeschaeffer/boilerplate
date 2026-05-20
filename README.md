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

# 5. Dev
bun run dev
# Abra http://localhost:3000 — login dev com qualquer e-mail/senha
```

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
| `bun run dev` | Turborepo — todos os apps em dev |
| `bun run build` | Build de produção |
| `bunx --bun shadcn@latest …` | CLI shadcn em `apps/web` |
| `bun run db:up` | Sobe Postgres no Docker |

## Estrutura (alvo)

```
apps/web              # App tenant (Next 16.2.6)
apps/platform-admin   # Painel interno
packages/*            # db, module-registry, shared, …
infra/docker          # PostgreSQL :5454
```
