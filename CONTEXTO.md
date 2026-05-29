# Boilerplate Enterprise — Contexto Geral

> **Propósito deste arquivo:** base de contexto para novas conversas (humanas ou com IA). Resume a essência do projeto — o que é, para onde vai, o que já existe, como está organizado e como contribuir — sem substituir o PRD completo.
>
> **Última atualização:** Maio 2026 · **Limite:** ~900 linhas · **Fonte de verdade detalhada:** [`prd.md`](./prd.md)

---

## 1. Resumo executivo

**Boilerplate** é uma plataforma SaaS de **gestão empresarial modular e adaptativa**. O cliente não troca de sistema ao crescer: a mesma plataforma evolui da operação informal (P1) até escala multi-unidade (P4), ativando módulos conforme fase, tipo de negócio e maturidade.

| Dimensão | Valor |
|----------|-------|
| **Produto** | ERP modular + Aprendiz IA + marketplace de extensões |
| **Mercado** | PMEs brasileiras (PT-BR no MVP) |
| **Modelo** | Multi-tenant SaaS, schema PostgreSQL por organização |
| **Estado (Maio/2026)** | R0–R2.5 ✅ · R3 em andamento · R4 planejado |
| **Stack** | Next.js 16 · PostgreSQL 16 · TypeScript · Bun · Turborepo |
| **Repositório** | Monorepo com apps tenant, admin interno, marketplace e ecossistema comunitário |

**North star:** corrigir a fundação (R0–R2) para escalar de forma operacional até o topo (R4), com onboarding simples para colaboradores e comunidade externa.

---

## 2. Problema e proposta de valor

### Problema

| Perfil | Dor |
|--------|-----|
| Informal (P1 / E0–E1) | ERPs caros e complexos; usa planilha |
| Crescendo (P2 / E2–E3) | Ferramentas fragmentadas; vendas ≠ estoque ≠ caixa |
| Estabelecido (P3 / E3–E4) | Fiscal exige técnico |
| Em escala (P4 / E4–E5) | Dados espalhados; falta governança e BI |

**Gap:** não existe plataforma que escale com o cliente de forma fluida entre simplicidade e ERP completo.

### Proposta

- Diagnóstico automático no onboarding → configuração inicial
- Módulos integrados desde o dia 1
- **Aprendiz IA** — ensina processos, executa automações
- Evolução guiada com transparência (`/evolucao`)
- **Integradores** — camada única para serviços externos
- **Perfis de negócio** — mesma plataforma, UX adequada ao segmento
- **Platform-admin** — operação interna (CRM SaaS, comms, roadmap)

---

## 3. Glossário — não misturar escalas

Referência completa: [`.specs/_shared/glossary.md`](./.specs/_shared/glossary.md)

| Sigla | Nome | Escala | Uso |
|-------|------|--------|-----|
| **R0–R4** | Marco de **entrega** (engenharia) | R0 fundação → R4 escala | Roadmap de sprints |
| **P1–P4** | **Fase de produto** do tenant | 1 informal → 4 escala | `organizations.phase`, pacotes, preço |
| **E0–E10** | **Estágio de evolução** empresarial | 0 sobrevivência → 10 mega corp | Maturidade real do negócio do cliente |
| **D0–D5** | **Profundidade** do módulo | 0 inexistente → 5 escala | Quão completo o módulo está vs alvo |

**Atenção:** R0 ≠ E0 · P2 ≠ E2

### Setores

| Termo | Onde |
|-------|------|
| **Setor core** | Catálogo global (`core_sectors`) — Financeiro, Comercial, Operação… |
| **Setor tenant** | Instância por org (`sectors`), default `geral` |

### Dois CRMs (domínios distintos)

| Termo | Módulo | Descrição |
|-------|--------|-----------|
| **CRM Plataforma** | `platform-crm` | Funil SaaS: lead → trial → org (schema global) |
| **CRM Comercial (tenant)** | `core-crm` | Pipeline do cliente com *seus* leads (schema tenant) |
| **Cadastro operacional** | `core-clientes` | Não substitui CRM |

---

## 4. Para onde vamos — roadmap

### Marcos de entrega (R)

| Marco | Foco | Status |
|-------|------|--------|
| **R0** | Monorepo, auth, multi-tenant, registry, billing, CI | ✅ |
| **R1** | Core MVP P1: catálogo, clientes, vendas, estoque, ranking, Aprendiz, PWA offline | ✅ |
| **R2** | P2: fluxo de caixa, vendedores, relatórios, segmentos moda/alimentação, Asaas | ✅ |
| **R2.5** | Catálogo global, profundidade D, `/roadmap`, `/evolucao` | ✅ |
| **R3** | Fiscal homologado, pedidos, multi-loja, compras, CRM tenant, Aprendiz v2 | 🚧 |
| **R4** | BI, API pública, white-label, escala multi-unidade | ⏳ |

### Fases de produto (P) — o que o tenant recebe

| Fase | Perfil | Módulos típicos |
|------|--------|-----------------|
| **P1** | Informal | Core + Aprendiz + PWA |
| **P2** | Crescendo | + fluxo de caixa, vendedores, relatórios |
| **P3** | Estabelecido | + fiscal, pedidos, multi-loja, compras |
| **P4** | Escala | + BI, multi-empresa, governança |

Ordem natural de implantação (produto): CRM → Financeiro → ERP → RH → Atendimento → Workflow → BI → APIs → BPM → IAM → Analytics → Observabilidade → Governança de Dados.

Ver também: [`doc/ordem-desenvolvimento.md`](./doc/ordem-desenvolvimento.md)

---

## 5. Estado atual do repositório (Maio 2026)

### Entregue ✅

- Monorepo Turborepo + Bun workspaces
- Multi-tenant: schema global `boilerplate` + schemas `tenant_*` por org
- Auth NextAuth v5 com `organizationId`, `sectorId`, `branchId` na sessão
- Module registry com nav dinâmico e ativação por org/fase
- Módulos core P1/P2 implementados (ver §7)
- PWA com fila offline de vendas + sync IndexedDB
- Onboarding diagnóstico + `recomendarModulos` + `modulo_demanda`
- Billing: PricingEngine, planos, bundles, gateways de pagamento
- Integradores: payment-mock, payment-asaas, fiscal-noop, mocks comms
- Platform-admin completo (CRM, comms, insights, módulos, roadmap, comunidade)
- CRM tenant MVP (`core-crm`) — pipeline, leads, deals
- Pedidos, multi-loja (filiais), setores tenant, compras (em entrega R3.1)
- CI GitHub Actions + ecosystem security lint
- Deploy Vercel documentado (2 apps + Neon Postgres)

### Em andamento 🚧

- `ops-compras` — categorias hierárquicas, fornecedores, ordens de compra (R3.1)
- Emissão fiscal homologada via `fiscal-engine` + integradores
- Configurações tenant avançadas (CRUD setores, formas de pagamento)
- `rh-comissoes`, Aprendiz v2

### Scaffold / planejado ⏳

- Sub-módulos fiscais (`fiscal-nfce`, `fiscal-nfe`, etc.) — estrutura pronta, emissão pendente
- Integradores produção: Stripe, Mercado Pago, Focus NFe, Resend, Meta WhatsApp
- `apps/marketplace` — catálogo público de extensões (dev :3003)
- API pública, webhooks, white-label (R4)

---

## 6. Arquitetura técnica

### Visão em camadas

```
┌─────────────────────────────────────────────────────────────┐
│  Apps (Next.js 16 App Router)                               │
│  web (:3000) · platform-admin (:3002) · marketplace (:3003) │
├─────────────────────────────────────────────────────────────┤
│  UI: shadcn/ui · Tailwind 4 · Server Actions · tRPC         │
├─────────────────────────────────────────────────────────────┤
│  Domínio: packages/db · modules/* · community/*              │
├─────────────────────────────────────────────────────────────┤
│  SDK: sdk-core (contratos) · sdk-server · sdk-events ·      │
│       sdk-react · module-registry                           │
├─────────────────────────────────────────────────────────────┤
│  Infra: event-bus · integrators · billing · observability   │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 16                                              │
│  schema boilerplate (global) + tenant_<slug> (por org)      │
└─────────────────────────────────────────────────────────────┘
```

### Princípios arquiteturais

1. **Schema por tenant** desde o dia 1 — isolamento real, não row-level only
2. **Módulos não duplicam entidades core** — `Cliente`, `Item`, `Venda` são estendidos
3. **Comunicação por eventos de domínio** — MVP síncrono + bus in-process; filas BullMQ preparadas
4. **Integradores conectam externos** — módulos não acessam APIs diretamente
5. **Contratos versionados** — `@boilerplate/sdk-core` governa módulos oficiais e comunitários
6. **Env centralizado** — variáveis só na raiz (`.env`, `.env.development`, `.env.local`)
7. **Bun exclusivo** — install, scripts, `bunx`; não usar pnpm/npm neste repo

### Modelo de acesso

```
Usuário
  └── Membership (empresa + papel: dono, gerente, vendedor…)
        └── Acesso por setor (subset de módulos/nav/permissões)
              └── Dados operacionais no schema tenant_xxx
```

Sessão JWT obriga: `organizationId` + `sectorId` (+ `branchId` quando multi-loja).

---

## 7. Módulos — catálogo oficial

Registro: `packages/module-registry/src/register-all.ts`  
Seed/catálogo: `packages/db/data/product-roadmap.json`

### Implementados (`implementationStatus: implemented`)

| ID | Nome | Setor | Rota tenant | Fase | D atual→alvo |
|----|------|-------|-------------|------|--------------|
| `core-catalogo` | Catálogo | operacao | `/catalogo` | P1 | 2→3 |
| `core-clientes` | Clientes | comercial | `/clientes` | P1 | 2→3 |
| `core-crm` | CRM Comercial | comercial | `/crm` | P2 | 2→3 |
| `core-vendas` | Vendas | comercial | `/vendas` | P1 | 2→4 |
| `core-pedidos` | Pedidos | comercial | `/pedidos` | P2 | 1→3 |
| `core-estoque-basico` | Estoque | operacao | `/estoque` | P1 | 2→3 |
| `core-ranking` | Ranking | comercial | `/ranking` | P1 | 2→3 |
| `ops-multi-loja` | Multi-loja | operacao | `/configuracoes/filiais` | P3 | 1→3 |
| `ops-compras` | Compras | operacao | `/compras` | P2 | 1→3 |
| `ops-vendedores` | Vendedores | pessoas | `/vendedores` | P2 | 3→4 |
| `fin-fluxo-caixa` | Fluxo de caixa | financeiro | `/fluxo-caixa` | P2 | 2→3 |
| `rel-basico` | Relatórios | analytics | `/relatorios` | P2 | 2→4 |
| `segment-moda` | Catálogo Moda | operacao | `/catalogo` | P2 | 1→3 |
| `segment-alimentacao` | Catálogo Alimentação | operacao | `/catalogo` | P2 | 1→3 |
| `aprendiz` | Aprendiz | tecnologia | `/aprendiz` | P1 | 2→4 |
| `fiscal-core` | Fiscal (pai) | fiscal | — | P1 | 1→3 |

### Scaffold (estrutura pronta, emissão/lógica pendente)

`fiscal-nfce`, `fiscal-nfe`, `fiscal-cte`, `fiscal-mdfe`, `fiscal-ciot`, `fiscal-sped`, `fiscal-rural`, `fiscal-contabil`

### Pacotes de domínio em `modules/`

| Pacote | Descrição |
|--------|-----------|
| `modules/aprendiz` | Engine do assistente IA |
| `modules/billing` | Lógica de cobrança tenant |
| `modules/crm` | Domínio CRM tenant |
| `modules/fiscal` | Domínio fiscal |

---

## 8. Integradores

Registro: `packages/integrators` · Catálogo: `packages/db/data/platform-catalog.json`

| ID | Tipo | Status | Uso |
|----|------|--------|-----|
| `payment-mock` | payment | ✅ | Dev local (default) |
| `payment-asaas` | payment | ✅ | Assinaturas/cobrança (sandbox com API key) |
| `payment-stripe` | payment | scaffold | Checkout internacional |
| `payment-mercadopago` | payment | scaffold | Mercado BR |
| `payment-pagseguro` | payment | planned | PagBank |
| `fiscal-noop` | fiscal | ✅ | Stub dev |
| `fiscal-focus-nfe` | fiscal | planned | Emissão NFC-e/NF-e |
| `fiscal-nfe-io` | fiscal | planned | Provedor alternativo |
| `email-resend-mock` | messaging | ✅ | E-mail simulado |
| `messaging-resend` | messaging | planned | E-mail transacional |
| `messaging-twilio-sms` | messaging | planned | SMS |
| `social-whatsapp-mock` | social | ✅ | WhatsApp simulado |
| `social-telegram-mock` | social | ✅ | Telegram simulado |
| `social-meta-whatsapp` | social | planned | Cloud API Meta |
| `webhook-generic` | webhook | planned | HTTP normalizado |

**Credenciais:** criptografadas com KEK (`INTEGRATOR_ENCRYPTION_KEY`); platform-admin → Integradores → Credenciais; override BYOK no tenant → Configurações → Integradores.

---

## 9. Estrutura do monorepo

```
boilerplate/
├── apps/
│   ├── web/                 # App tenant (cliente SaaS) — :3000
│   ├── platform-admin/      # Operação interna — :3002
│   └── marketplace/         # Catálogo público extensões — :3003
├── packages/
│   ├── db/                  # Prisma, multi-tenant, seeds, migrations tenant
│   ├── module-registry/     # Registro e metadados de módulos
│   ├── sdk-core/            # Contratos (módulo, eventos, marketplace, permissions)
│   ├── sdk-server/          # Runtime server-side para módulos
│   ├── sdk-events/          # Handlers e publishers de eventos
│   ├── sdk-react/           # Providers React para módulos
│   ├── event-bus/           # Bus de eventos (in-process + BullMQ/Redis)
│   ├── integrators/         # Adapters payment, fiscal, messaging, social
│   ├── billing/             # PricingEngine, gateways
│   ├── shared/              # Utils, env, security, secrets
│   ├── crm/                 # Lógica CRM tenant
│   ├── crm-ui/              # Componentes CRM compartilhados
│   ├── aprendiz-engine/     # Motor do Aprendiz
│   ├── fiscal-engine/       # Motor de emissão fiscal
│   ├── ai-runtime/          # Runtime LLM
│   ├── agents/              # Agentes IA
│   ├── workflows/             # Workflows duráveis
│   ├── observability/       # Logs, métricas
│   ├── sandbox/             # Sandbox para módulos comunitários
│   ├── cli/                 # create-boilerplate-module
│   └── eslint-plugin-boilerplate/
├── modules/                 # Módulos oficiais (core team)
├── community/               # Módulos/integradores da comunidade
│   ├── example-module/
│   ├── example-integrator/
│   └── CONTRIBUTING.md
├── infra/docker/            # PostgreSQL :5454
├── doc/                     # Documentação estendida
├── .specs/                  # Specs de features (CRM suite, etc.)
├── .cursor/skills/          # Skills Cursor (create-module, create-integrator)
├── prd.md                   # PRD completo (2300+ linhas)
├── CONTEXTO.md              # Este arquivo
└── turbo.json
```

### Workspaces (package.json raiz)

`apps/*`, `packages/*`, `community/*`, `modules/*`

---

## 10. Apps em detalhe

### `apps/web` — Tenant (:3000)

**Usuário:** cliente SaaS (dona de loja, gerente, vendedor)

**Rotas principais (dashboard):**

| Rota | Módulo |
|------|--------|
| `/dashboard` | Home + missões primeiros passos |
| `/catalogo` | Catálogo |
| `/clientes` | Clientes |
| `/crm` | CRM Comercial |
| `/vendas` | Vendas (+ offline PWA) |
| `/pedidos` | Pedidos |
| `/estoque` | Estoque |
| `/compras` | Compras (+ fornecedores) |
| `/fluxo-caixa` | Fluxo de caixa |
| `/vendedores` | Vendedores |
| `/ranking` | Ranking |
| `/relatorios` | Relatórios |
| `/aprendiz` | Aprendiz IA |
| `/evolucao` | Progresso por setor + changelog |
| `/comunicacao` | Comms tenant |
| `/configuracoes/*` | Membros, filiais, setores, pagamentos, integradores, cobrança |

**Auth:** NextAuth v5 · dev: qualquer e-mail/senha · produção: fluxo completo com verificação de e-mail

**Offline:** PWA + IndexedDB + `GET /api/sync` + fila de vendas

### `apps/platform-admin` — Operação interna (:3002)

**Usuário:** time Boilerplate (super admin)

| Rota | Função |
|------|--------|
| `/dashboard` | Visão geral |
| `/crm` | CRM Plataforma (leads, deals, notas) |
| `/comms` | Inbox omnichannel (mock WhatsApp/Telegram/e-mail) |
| `/organizacoes` | Tenants + provisioning |
| `/modulos/*` | Catálogo, planos, bundles, ativações |
| `/integradores/*` | Gateways + credenciais criptografadas |
| `/segmentos/*` | 40 segmentos de mercado + fases |
| `/roadmap` | Profundidade D por setor + changelog |
| `/insights` | Demanda de módulos |
| `/comunidade` | Moderação de publicações comunitárias |

**Seed dev:** `PLATFORM_ADMIN_SEED_EMAIL` + `PLATFORM_ADMIN_SEED_PASSWORD` → `bun run db:seed-platform-admin`

### `apps/marketplace` — Catálogo público (:3003)

Extensões aprovadas da comunidade. Sobe com `bun run dev` (filtro turbo).

---

## 11. Banco de dados

### Dois níveis de schema

| Nível | Schema | Conteúdo |
|-------|--------|----------|
| **Global** | `boilerplate` | users, organizations, memberships, sectors, modulos_ativos, catálogo core_*, platform_*, billing, integradores |
| **Tenant** | `tenant_<slug>` | Dados operacionais: vendas, estoque, clientes, CRM, compras… |

Prisma: `packages/db/prisma/schema.prisma` (somente schema global)  
DDL tenant: `packages/db/src/tenant/` + `db:migrate-tenants` (não usa migrations SQL Prisma para tenants)

### Comandos essenciais

```bash
bun run db:up                    # Docker Postgres :5454
bun run db:generate              # Prisma client
bun run db:push                  # Schema global
bun run db:migrate-tenants       # DDL schemas tenant_*
bun run db:seed-platform-admin   # Super admin dev
bun run db:seed-roadmap          # Catálogo setores/módulos/segmentos
bun run db:seed-integrator-credentials  # Credenciais fake dev
bun run db:restart               # Zera banco + recria
```

**URL local:** `postgresql://boilerplate:boilerplate@localhost:5454/boilerplate`

### Entidades globais importantes

- `Organization` — phase, tipoNegocio, segmento, provisioningStatus, schemaName
- `ModuloAtivo` / `ModuloDemanda` — módulos ativos e demanda do mercado
- `CoreModulesCatalog` / `CoreSectors` / `MarketSegment` — catálogo de produto
- `ModuleDepthChangelog` — histórico público de evolução
- `PlatformLead` / `CrmDeal` / `PlatformCommsThread` — operação interna
- `TenantIntegrator` — credenciais BYOK por tenant

---

## 12. Eventos de domínio

Bus: `@boilerplate/event-bus` (in-process; BullMQ/Redis para async futuro)

Eventos ativos (exemplos):

```
venda.confirmada · venda.cancelada · estoque.baixo · cliente.criado
item.criado · missao.concluida · pedido.convertido
crm.lead.criado · crm.deal.criado · crm.deal.etapa_alterada
ordem_compra.criada · ordem_compra.enviada · compra.recebida
estoque.reposicao_sugerida
```

**Padrão:** venda confirmada → lançamento automático no fluxo de caixa (`recordSaleCashInflow`)

Módulos comunitários registram handlers via `@boilerplate/sdk-events` — **proibido** importar `@boilerplate/db` diretamente.

---

## 13. SDK e contratos de módulo

### Contrato `BoilerplateModule` (`packages/sdk-core`)

```typescript
{
  id, version, coreContract,
  capabilities: { database, queues, webhooks, billing, ai, externalHttp,
                  filesystem: false, processEnv: false, crossTenant: false },
  requiredPermissions: ["modulo.read", "modulo.write"],
  routes: [{ path, label, permission }],
  eventHandlers: [...],
  migrations?: [...],
  onInstall?, onUninstall?
}
```

### Zonas de contribuição

| Zona | Caminho | Quem |
|------|---------|------|
| **Core** | `packages/*` | Core team |
| **Oficial** | `modules/<id>/` | Core team → `register-all.ts` |
| **Comunidade** | `community/<id>/` | Externos → PR + moderação |

### Regras de segurança (ecossistema)

- `filesystem`, `processEnv`, `crossTenant` = **false** sempre
- Sem `@boilerplate/db` em `community/`
- Tabelas tenant: prefixo `{moduleId}_*`
- Capabilities declaradas = uso real
- RFC em `doc/rfcs/` para breaking changes (14 dias)

**Skills Cursor:** `.cursor/skills/create-module/` e `create-integrator/`

**CLI:** `bunx create-boilerplate-module <id>`

---

## 14. Billing e precificação

Engine: `packages/billing` · Seed: `platform-catalog.json`

- Preço por módulo (`moduloPrecos`) — centavos/mês, fase mínima, cobrança avulsa
- Planos (`essencial`, `profissional`, `escala`) — bundles de módulos por fase P
- Bundles temáticos (`varejo-fiscal`, `transporte-fiscal`)
- Gateways: mock (dev) → Asaas (sandbox/prod) → Stripe/MP (futuro)

Estágio **E** e profundidade **D** informam CSM e roadmap — **não precificam** no MVP.

---

## 15. Ecossistema e comunidade

### Fluxo de publicação

1. Desenvolvedor implementa em `community/<id>/` + `ecosystem.publication.json`
2. PR com template `.github/PULL_REQUEST_TEMPLATE/ecosystem.md`
3. CI `ecosystem-security.yml` + code review
4. Moderação em platform-admin → `/comunidade`
5. Aprovação → marketplace + disponível para tenants

**Documentação:** [`doc/ecosystem/publicacao-pr-comunidade.md`](./doc/ecosystem/publicacao-pr-comunidade.md)

**Exemplos:** `community/example-module/`, `community/example-integrator/`

### CI ecossistema

```bash
bun run lint:ecosystem          # ESLint regras community/
bun run --filter @boilerplate-community/example-module test
bun run ci:local                # CI completo local (espelha GitHub Actions)
```

---

## 16. CI/CD e deploy

### Pipeline local

```bash
bun run ci           # validate + lint + build (precisa Postgres)
bun run ci:local     # + ecosystem lint + example-module tests
bun run check:vercel # Simula build Vercel antes do deploy
```

### GitHub Actions

- `ci.yml` — lint, validate Prisma, build, check:vercel fresh
- `ecosystem-security.yml` — segurança community/

### Vercel

- **2 projetos:** `apps/web` + `apps/platform-admin`
- **DB:** Neon Postgres compartilhado
- **Env:** centralizado na raiz; ver [`doc/vercel/README.md`](./doc/vercel/README.md)
- **Prisma engine:** `binaryTargets` + `outputFileTracingIncludes` nos next.config

---

## 17. Setup rápido (dev)

```bash
# Pré-requisitos: Bun 1.2+, Docker Desktop

bun run db:up
bun install
cp .env.example .env
# AUTH_SECRET: openssl rand -base64 32

bun run db:generate
bun run db:push
bun run db:seed-platform-admin   # após .env.development com seed email/senha
bun run dev

# Tenant:    http://localhost:3000
# Admin:     http://localhost:3002
# Marketplace: http://localhost:3003
```

**Importante:** pare o dev server antes de `bun run build` no Windows (EPERM Prisma).

---

## 18. Documentação existente

| Documento | Conteúdo |
|-----------|----------|
| [`prd.md`](./prd.md) | PRD completo v0.8 — visão, arquitetura, §8–§17 |
| [`README.md`](./README.md) | Setup, comandos, deploy |
| [`.specs/_shared/glossary.md`](./.specs/_shared/glossary.md) | Glossário siglas |
| [`doc/ordem-desenvolvimento.md`](./doc/ordem-desenvolvimento.md) | Fases 1–5 produto |
| [`doc/ecosystem/`](./doc/ecosystem/) | Publicação comunitária |
| [`doc/vercel/`](./doc/vercel/) | Deploy e env vars |
| [`doc/modulos/crm-suite/crm.md`](./doc/modulos/crm-suite/crm.md) | Visão CRM omnichannel |
| [`doc/modulos/nota-fiscal/modulo-fiscal.md`](./doc/modulos/nota-fiscal/modulo-fiscal.md) | Domínio fiscal |
| [`doc/estudo-de-mercado/`](./doc/estudo-de-mercado/) | Segmentos e módulos vitais |
| [`.specs/002–006`](./.specs/) | Specs CRM suite, pipeline, timeline, comms |
| [`SECURITY.md`](./SECURITY.md) | Segurança e incident response |
| [`community/CONTRIBUTING.md`](./community/CONTRIBUTING.md) | Guia contribuidor |

---

## 19. Metodologia de trabalho

### Como priorizamos

1. **Marco R** define entrega de engenharia (sprints)
2. **Profundidade D** mede completude real de cada módulo
3. **`modulo_demanda`** + platform-insights informam prioridade de mercado
4. **Specs** (`.specs/`) detalham features grandes antes da implementação
5. **Changelog público** (`module_depth_changelog`) alimenta `/evolucao`

### Definition of done (módulo)

- [ ] Registrado em `register-all.ts` com status e profundidade D
- [ ] Rotas tenant + nav dinâmico
- [ ] Tabelas tenant registradas em `module-migrations.ts` (se DB)
- [ ] Eventos publicados/consumidos conforme domínio
- [ ] RBAC com permissões do contrato
- [ ] Seed/catálogo atualizado se necessário
- [ ] CI verde (`bun run ci`)

### Correção de fundação → topo

A estratégia atual **não é linear do zero ao fim**, mas **consolidar camadas**:

```
Fundação (R0) → Core operacional (R1–R2) → [CORRIGIR AQUI] → Fiscal/Equipe (R3) → Escala (R4)
                      ↑                           ↑
              Multi-tenant sólido          Integradores reais
              Event bus + SDK              Configurações tenant
              Módulos D2+ estáveis         Comunidade operacional
```

Objetivo: cada marco deixa a base **mais operacional** para o próximo, não apenas adiciona features.

---

## 20. Personas

| Persona | Fase | Perfil |
|---------|------|--------|
| **Dona Maria** | P1–P2 / E0–E2 | Pequeno negócio, smartphone, quer resultado |
| **Marcos** | P2–P3 / E2–E3 | Loja 2–5 funcionários, ferramentas fragmentadas |
| **Grupo** | P4 / E4–E5 | Rede/franquia, visão consolidada, ROI por unidade |

### Tipos de negócio (onboarding)

10 perfis ativos no MVP (varejo, atacado, serviços, transportadora, produtor rural, fabricante, etc.) + 40 segmentos de mercado no catálogo global.

---

## 21. Aprendiz IA

Pacote: `packages/aprendiz-engine` · Módulo: `aprendiz`

| Camada | Status | Descrição |
|--------|--------|-----------|
| 1 | ✅ | Templates + respostas guiadas |
| 2 | 🚧 | Execução autômoma (Aprendiz v2 — R3) |
| 3 | ⏳ | Sugestão proativa (R4) |

LLM opcional: `APRENDIZ_LLM_ENABLED` + `OPENAI_API_KEY`

Integrações: cadastro conversacional, missões primeiros passos, automações fixas.

---

## 22. Segments e estudo de mercado

40 segmentos em `product-roadmap.json` (agronegócio, varejo, e-commerce, saúde, restaurante, franquias…).

Cada segmento tem `vitalModules` — usado para recomendação e roadmap.

Estudos: [`doc/estudo-de-mercado/`](./doc/estudo-de-mercado/)

---

## 23. Specs ativas (.specs/)

| Spec | Tema |
|------|------|
| `002--crm-suite-roadmap` | Roadmap CRM omnichannel |
| `003--crm-event-timeline` | Timeline de eventos CRM |
| `004--core-crm-pipeline-mvp` | Pipeline MVP tenant |
| `005--crm-leads-gestao-avancada` | Leads avançado |
| `006--tenant-comms-omnichannel` | Comms tenant |

---

## 24. Comandos de referência rápida

| Comando | Descrição |
|---------|-----------|
| `bun run dev` | web + platform-admin + marketplace |
| `bun run dev:community` | web + example-module |
| `bun run build` | Build produção (turbo) |
| `bun run clean` | Limpa caches |
| `bun run test` | Testes (turbo) |
| `bun run db:migrate-tenants` | Roda antes do dev (predev hook) |
| `bun run db:setup-remote` | Bootstrap remoto Vercel/Neon |
| `bun run vercel:env-sync` | Sync env vars Vercel |

---

## 25. Decisões técnicas importantes

| Decisão | Motivo |
|---------|--------|
| Bun (não pnpm/npm) | Performance, scripts unificados, lockfile único |
| Schema PostgreSQL por tenant | Isolamento forte, migração independente |
| Next.js App Router + Server Actions | SSR, actions tipadas, sem API REST separada no MVP |
| tRPC | API tipada interna |
| shadcn/ui + Tailwind 4 | UI consistente, blocks login-01/dashboard-01 |
| NextAuth v5 | Sessão com contexto org/setor/filial |
| Event bus in-process (MVP) | Simplicidade; BullMQ pronto para async |
| Credenciais envelope encryption | KEK + rotação; BYOK tenant |
| Module registry como fonte | Nav, ativação, catálogo sincronizados |
| Env só na raiz | Evita drift entre apps |
| Prisma só schema global | Tenants via DDL programático |

---

## 26. O que NÃO fazer

- Usar pnpm/npm neste repositório
- Criar `.env` dentro de `apps/web` ou `apps/platform-admin`
- Importar `@boilerplate/db` em pacotes `community/`
- Ler `process.env` em módulos comunitários
- Duplicar entidades core (Cliente, Item, Venda) em novos módulos
- Confundir CRM Plataforma com CRM tenant
- Commitar senhas ou `INTEGRATOR_ENCRYPTION_KEY` de produção
- Rodar `db:seed-platform-admin` em produção sem `ALLOW_PLATFORM_ADMIN_SEED=true`

---

## 27. Próximos passos imediatos (R3)

Prioridade atual conforme PRD §14:

1. **Fiscal homologado** — `fiscal-engine` + integrador (Focus NFe ou similar)
2. **`fiscal-nfce` / `fiscal-nfe`** → `implemented`
3. **Compras R3.1** — categorias, fornecedores, OC automática, reposição estoque
4. **Configurações tenant** — CRUD setores, formas de pagamento, módulos por setor
5. **Platform-admin org detail** — módulos por setor core, filiais
6. **`rh-comissoes`**
7. **Aprendiz v2** — camada 2 execução autônoma
8. **Integradores produção** — Resend, Meta WhatsApp

---

## 28. Como usar este arquivo em novas conversas

### Para humanos

1. Leia §1–§5 para contexto geral
2. Consulte §7–§8 para módulos/integradores
3. Use §9–§11 para navegar o código
4. Verifique §27 para prioridade atual

### Para IA (Cursor/Copilot)

Referencie no início da conversa:

```
Leia CONTEXTO.md na raiz do repo antes de implementar.
Respeite glossário R/P/E/D e regras do SDK (§13).
```

Ou adicione como rule em `.cursor/rules/` apontando para este arquivo.

### Manutenção

Atualize este arquivo quando:

- Concluir um marco R
- Mudar status de módulo (`implemented` ↔ `scaffold`)
- Adicionar app ou package significativo
- Alterar decisões arquiteturais (§25)

**Não duplicar o PRD** — linkar [`prd.md`](./prd.md) para detalhes.

---

## 29. Links úteis

| Recurso | URL/caminho |
|---------|-------------|
| PRD | `./prd.md` |
| Setup | `./README.md` |
| Glossário | `./.specs/_shared/glossary.md` |
| Ecossistema | `./doc/ecosystem/publicacao-pr-comunidade.md` |
| Vercel | `./doc/vercel/README.md` |
| Product roadmap JSON | `./packages/db/data/product-roadmap.json` |
| Platform catalog JSON | `./packages/db/data/platform-catalog.json` |
| Module registry | `./packages/module-registry/src/register-all.ts` |
| Skills create-module | `./.cursor/skills/create-module/SKILL.md` |
| Skills create-integrator | `./.cursor/skills/create-integrator/SKILL.md` |

---

*Boilerplate Enterprise — Plataforma de Gestão Modular Adaptativa · Contexto v1.0 · Maio 2026*
