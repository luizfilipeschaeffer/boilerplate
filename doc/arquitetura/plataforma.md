# Arquitetura da Plataforma Boilerplate

> Diagramas e visão estrutural do monorepo **Boilerplate Enterprise** — gestão empresarial modular, multi-tenant, com marketplace de extensões.
>
> **Atualizado:** Maio 2026 · **Complementos:** [`CONTEXTO.md`](../../CONTEXTO.md) · [`prd.md`](../../prd.md) · [`doc/ecosystem/README.md`](../ecosystem/README.md)

---

## 1. Visão geral do produto

```mermaid
flowchart TB
  subgraph usuarios["Quem usa"]
    U1["Cliente SaaS<br/>dona, gerente, vendedor"]
    U2["Time Boilerplate<br/>super admin"]
    U3["Desenvolvedor comunidade"]
    U4["Visitante marketplace"]
  end

  subgraph apps["Aplicações Next.js 16"]
    WEB["apps/web :3000<br/>App tenant"]
    ADMIN["apps/platform-admin :3002<br/>Operação interna"]
    MKT["apps/marketplace :3003<br/>Catálogo público"]
  end

  subgraph nucleo["Núcleo da plataforma"]
    SDK["SDK & contratos<br/>sdk-core · sdk-server · sdk-events · sdk-react"]
    REG["module-registry<br/>catálogo e ativação"]
    DB["packages/db<br/>Prisma global + DDL tenant"]
    BUS["event-bus<br/>domínio + filas opcionais"]
    INT["integrators<br/>payment · fiscal · messaging · social"]
  end

  subgraph dados["Persistência"]
    PG[("PostgreSQL 16")]
    G["schema boilerplate<br/>global"]
    T["schema tenant_&lt;slug&gt;<br/>por organização"]
  end

  U1 --> WEB
  U2 --> ADMIN
  U3 --> COMM["community/*"]
  U4 --> MKT
  WEB --> nucleo
  ADMIN --> nucleo
  MKT --> nucleo
  COMM --> SDK
  nucleo --> PG
  PG --> G
  PG --> T
```

| Dimensão | Decisão |
|----------|---------|
| **Produto** | ERP modular + Aprendiz IA + extensões comunitárias |
| **Isolamento** | Schema PostgreSQL **por tenant** (não só RLS) |
| **Extensibilidade** | Módulos oficiais + `community/*` governados por contratos |
| **Integrações** | Sempre via **integradores** — módulos não chamam APIs externas direto |
| **Runtime** | Bun + Turborepo · env centralizado na raiz do monorepo |

---

## 2. Monorepo — mapa de workspaces

Workspaces definidos em `package.json` raiz: `apps/*`, `packages/*`, `community/*`, `modules/*`.

```mermaid
flowchart LR
  subgraph apps_ws["apps/"]
    web["web<br/>tenant SaaS"]
    pa["platform-admin<br/>operação"]
    mp["marketplace<br/>extensões"]
  end

  subgraph packages_ws["packages/ — infra compartilhada"]
    db["db"]
    mr["module-registry"]
    sck["sdk-core / sdk-server<br/>sdk-events / sdk-react"]
    eb["event-bus"]
    int["integrators"]
    bill["billing"]
    shr["shared"]
    dom["crm · crm-ui · fiscal-engine<br/>aprendiz-engine · ai-runtime<br/>agents · workflows"]
    ops["observability · sandbox<br/>platform-api · cli"]
    lic["license-client/server<br/>update-client/server"]
  end

  subgraph modules_ws["modules/ — domínio plugável"]
    mo["crm · billing · fiscal<br/>aprendiz · civil-obras<br/>crm-helpdesk"]
  end

  subgraph community_ws["community/"]
    exm["example-module"]
    exi["example-integrator"]
  end

  subgraph infra_ws["infra/"]
    docker["docker<br/>Postgres :5454"]
  end

  web --> packages_ws
  pa --> packages_ws
  mp --> packages_ws
  modules_ws --> sck
  community_ws --> sck
  packages_ws --> docker
```

### Papel de cada camada de pasta

| Pasta | Responsabilidade |
|-------|------------------|
| **`apps/web`** | UI e rotas do **cliente** (`/vendas`, `/crm`, `/catalogo`…), tRPC, Server Actions, auth tenant (NextAuth) |
| **`apps/platform-admin`** | CRM da plataforma, orgs, módulos/planos, integradores, segmentos, roadmap, moderação comunidade |
| **`apps/marketplace`** | Vitrine pública de extensões aprovadas |
| **`packages/*`** | Bibliotecas reutilizáveis — **não** são telas |
| **`modules/*`** | Pacotes de domínio com contrato `BoilerplateModule` (instaláveis / versionáveis) |
| **`community/*`** | Contribuições externas (PR + moderação antes de produção) |
| **`infra/docker`** | Postgres local para desenvolvimento |

---

## 3. Arquitetura em camadas

```mermaid
flowchart TB
  L1["Camada 1 — Apps<br/>Next.js App Router · shadcn/ui · Tailwind 4"]
  L2["Camada 2 — API na app<br/>tRPC · Route Handlers · Server Actions"]
  L3["Camada 3 — Domínio<br/>packages/db · modules/* · lógica em apps/*/lib"]
  L4["Camada 4 — Plataforma<br/>sdk-core contratos · module-registry · sdk-server"]
  L5["Camada 5 — Infra transversal<br/>event-bus · integrators · billing · observability"]
  L6["Camada 6 — Dados<br/>PostgreSQL: boilerplate + tenant_*"]

  L1 --> L2 --> L3 --> L4 --> L5 --> L6
```

### Princípios (invariantes)

1. **Schema por tenant** desde o dia 1 — dados operacionais isolados em `tenant_<slug>`.
2. **Entidades core não duplicadas** — `Cliente`, `Item`, `Venda` são estendidas, não reimplementadas por módulo.
3. **Comunicação por eventos de domínio** — handlers síncronos no MVP; BullMQ/Redis quando `REDIS_URL` está configurado.
4. **Integradores como única porta externa** — pagamento, fiscal, e-mail, WhatsApp, webhooks.
5. **Contratos versionados** em `@boilerplate/sdk-core` — oficiais e comunidade seguem as mesmas regras.
6. **Módulos comunitários** não importam `@boilerplate/db` diretamente — usam `sdk-server` / `sdk-events`.

---

## 4. Fluxo de uma requisição (app tenant)

```mermaid
sequenceDiagram
  participant B as Browser
  participant N as apps/web<br/>Next.js
  participant A as Auth / sessão JWT
  participant T as tRPC / Actions
  participant D as packages/db
  participant E as event-bus

  B->>N: HTTP / Server Component
  N->>A: organizationId + sectorId (+ branchId)
  A-->>N: OrgBootContext
  N->>T: operação de negócio
  T->>D: query no schema tenant_xxx<br/>ou global boilerplate
  D-->>T: dados
  opt side effect
    T->>E: publish(domain event)
    E->>E: handlers síncronos
    E->>D: persistDomainEvent (opcional)
  end
  T-->>B: resposta UI
```

**Bootstrap no servidor** (`apps/web/lib/modules/init-server.ts`):

1. `ensureModulesRegistered()` — catálogo em `module-registry`
2. `configureCredentialResolver()` — credenciais de integradores (BYOK / platform)
3. `initEventBus()` — bus + persistência + OTEL opcional
4. `registerDomainEventHandlers()` — reações entre módulos (ex.: venda → fluxo de caixa)

---

## 5. Modelo multi-tenant e acesso

```mermaid
flowchart TB
  subgraph global_schema["Schema global: boilerplate"]
    U[users]
    O[organizations<br/>phase · tipoNegocio · schemaName]
    M[memberships<br/>papel na empresa]
    S[sectors / setores tenant]
    MA[modulos_ativos]
    PC[platform_crm · comms · billing]
    IC[integrator credentials]
  end

  subgraph tenant_schema["Schema tenant: tenant_acme"]
    V[vendas · pedidos]
    C[clientes · crm deals]
    I[itens · estoque]
    F[fluxo_caixa · compras]
    MOD[tabelas de módulos<br/>ex.: civil_obras_*]
  end

  U --> M
  M --> O
  M --> S
  O -->|provision| tenant_schema
  MA -->|gate rotas/nav| WEB2[apps/web UI]
```

### Cadeia de autorização

```
Usuário
  └── Membership (empresa + papel: dono, gerente, vendedor…)
        └── Acesso por setor (subset de módulos / nav / permissões)
              └── Dados operacionais no schema tenant_xxx
```

Sessão JWT exige: `organizationId` + `sectorId` (+ `branchId` quando multi-loja).

| Nível | Schema | Exemplos de conteúdo |
|-------|--------|----------------------|
| **Global** | `boilerplate` | orgs, planos, catálogo de módulos, CRM plataforma, credenciais integradores |
| **Tenant** | `tenant_<slug>` | vendas, estoque, CRM do cliente, compras, tabelas de módulos instalados |

- Prisma: `packages/db/prisma/schema.prisma` (**somente** global)
- DDL tenant: `packages/db/src/tenant/` + `bun run db:migrate-tenants`

---

## 6. Sistema de módulos

Dois registros complementares:

| Mecanismo | Onde | Função |
|-----------|------|--------|
| **Metadados de produto** | `packages/module-registry` (`register-all.ts`) | Nav, rotas, fase, setor, profundidade D, dependências, status scaffold/implemented |
| **Contrato runtime** | `packages/sdk-core` → `BoilerplateModule` | Capabilities, permissions, routes, eventHandlers, migrations, onInstall |

```mermaid
flowchart LR
  subgraph registro["Registro"]
    RA["registerAllModules()"]
    MR["module-registry Map"]
  end

  subgraph ativacao["Por organização"]
    CAT["core_modules_catalog"]
    ACT["modulos_ativos"]
  end

  subgraph runtime["Runtime tenant"]
    NAV["sidebar-nav dinâmico"]
    RTE["rotas App Router"]
    HND["event handlers"]
  end

  RA --> MR
  MR --> CAT
  ACT --> NAV
  ACT --> RTE
  modules_pkg["modules/*<br/>crm-helpdesk · civil-obras"] --> HND
  HND --> BUS2["event-bus"]
```

### Hierarquia fiscal (exemplo de módulo pai ↔ filhos)

```mermaid
flowchart TB
  FC[fiscal-core<br/>pai]
  NFC[fiscal-nfce]
  NFE[fiscal-nfe]
  CTE[fiscal-cte]
  SPED[fiscal-sped]
  CONT[fiscal-contabil]

  FC --> NFC
  FC --> NFE
  FC --> CTE
  FC --> SPED
  CONT --> SPED
```

Módulos **implementados** no tenant incluem: `core-catalogo`, `core-clientes`, `core-crm`, `core-vendas`, `core-pedidos`, `core-estoque-basico`, `fin-fluxo-caixa`, `ops-compras`, `aprendiz`, etc. (lista completa em [`CONTEXTO.md` §7](../../CONTEXTO.md)).

Pacotes em `modules/` com lógica própria: `civil-obras`, `crm-helpdesk`, `crm`, `fiscal`, `billing`, `aprendiz`.

---

## 7. Barramento de eventos

```mermaid
flowchart TB
  PUB["Publisher<br/>emitDomainEvent / getEventBus().publish"]
  SYNC["Handlers síncronos<br/>Map in-process"]
  ASYNC["Handlers assíncronos<br/>BullMQ + Redis"]
  DLQ["Dead letter queue"]
  PERS["persistDomainEvent<br/>packages/db"]
  OTEL["observability / OTEL"]

  PUB --> SYNC
  PUB --> ASYNC
  ASYNC --> DLQ
  PUB --> PERS
  PUB --> OTEL
```

| Pacote | Papel |
|--------|-------|
| `@boilerplate/event-bus` | Implementação atual (registerHandler, publish, versão de evento, fila opcional) |
| `@boilerplate/shared` … `domain-event-bus` | Ponte legada → redireciona para event-bus |
| `@boilerplate/sdk-events` | API para módulos registrarem handlers sem acoplar ao db |

**Exemplos de eventos:** `venda.confirmada`, `crm.deal.etapa_alterada`, `ordem_compra.criada`, `civil-obras.entrada.publicada`, `crm-helpdesk.ticket.created`.

**Padrão clássico:** `venda.confirmada` → lançamento automático no fluxo de caixa.

---

## 8. Integradores (camada anti-corrupção externa)

```mermaid
flowchart LR
  MOD["Módulos de negócio"]
  SDKS["sdk-server<br/>credential-resolver"]
  INT["packages/integrators<br/>registry por tipo"]
  CRED["Credenciais criptografadas<br/>KEK · platform-admin · BYOK tenant"]
  EXT["APIs externas"]

  MOD --> SDKS
  SDKS --> INT
  INT --> CRED
  CRED --> EXT
```

| Tipo | Exemplos | Status típico |
|------|----------|----------------|
| `payment` | mock, asaas, stripe (scaffold) | cobrança / assinatura |
| `fiscal` | noop, focus-nfe (planned) | NFC-e / NF-e |
| `messaging` | resend-mock, resend (planned) | e-mail transacional |
| `social` | whatsapp-mock, meta (planned) | WhatsApp / Telegram |
| `webhook` | generic (planned) | HTTP normalizado |

Catálogo de produto: `packages/db/data/platform-catalog.json`.  
Módulos **nunca** embutem SDK de Stripe/Focus direto — passam pelo adapter registrado.

---

## 9. Três aplicações — comparação

```mermaid
flowchart TB
  subgraph web_app["apps/web — Tenant"]
    w_r["/dashboard · /vendas · /crm<br/>/configuracoes · /aprendiz"]
    w_u["Usuário: cliente SaaS"]
    w_a["Auth: NextAuth tenant"]
  end

  subgraph admin_app["apps/platform-admin — Operação"]
    a_r["/crm · /organizacoes · /modulos<br/>/integradores · /comunidade"]
    a_u["Usuário: platform_admin"]
    a_m["Módulos: platform-crm · platform-comms<br/>platform-modulos · platform-integradores"]
  end

  subgraph mkt_app["apps/marketplace"]
    m_r["Catálogo público extensões"]
  end

  web_app --> PG2[(PostgreSQL)]
  admin_app --> PG2
  mkt_app --> PG2
```

| App | Porta | Schema principal |
|-----|-------|------------------|
| **web** | 3000 | `tenant_*` + leitura global (módulos ativos, billing) |
| **platform-admin** | 3002 | `boilerplate` (CRM plataforma, provisioning) |
| **marketplace** | 3003 | Metadados públicos de publicações aprovadas |

### Dois CRMs (não confundir)

| Nome | Onde | O quê |
|------|------|-------|
| **CRM Plataforma** | `platform-crm` no admin | Funil SaaS: lead → trial → organização |
| **CRM Comercial** | `core-crm` no tenant | Pipeline do negócio do cliente |
| **Cadastro** | `core-clientes` | Base operacional — não substitui CRM |

---

## 10. SDK — dependências entre pacotes

```mermaid
flowchart BT
  sdk_core["sdk-core<br/>contratos: Module, Event, Integrator, Permissions"]
  sdk_server["sdk-server<br/>runtime server · credentials"]
  sdk_events["sdk-events<br/>registro de handlers"]
  sdk_react["sdk-react<br/>providers UI"]
  mod_reg["module-registry"]
  event_bus["event-bus"]
  db_pkg["db"]
  integrators["integrators"]

  sdk_server --> sdk_core
  sdk_events --> sdk_core
  sdk_events --> event_bus
  sdk_react --> sdk_core
  mod_reg --> sdk_core
  event_bus --> sdk_core
  sdk_server --> db_pkg
  sdk_server --> integrators
  apps["apps/web · platform-admin"] --> sdk_server
  apps --> mod_reg
  apps --> db_pkg
  modules_dir["modules/* · community/*"] --> sdk_core
  modules_dir --> sdk_events
```

**Capabilities** do módulo (`BoilerplateModule`): `database`, `queues`, `webhooks`, `billing`, `ai`, `externalHttp` — com bloqueios explícitos: `filesystem: false`, `crossTenant: false`.

---

## 11. Ecossistema comunitário

```mermaid
flowchart LR
  DEV["Desenvolvedor"]
  PR["PR + ecosystem.publication.json"]
  CI["CI ecosystem-security"]
  MOD["Moderação<br/>platform-admin /comunidade"]
  MKT2["marketplace"]
  TEN["Ativação no tenant"]

  DEV --> COMM2["community/&lt;id&gt;/"]
  COMM2 --> PR --> CI --> MOD
  MOD --> MKT2
  MOD --> TEN
```

Documentação: [`doc/ecosystem/publicacao-pr-comunidade.md`](../ecosystem/publicacao-pr-comunidade.md).

**Sandbox** (`packages/sandbox`): execução isolada para código comunitário antes de confiar em produção.

---

## 12. Deploy e ambientes

```mermaid
flowchart TB
  subgraph local["Desenvolvimento local"]
    BUN["bun run dev<br/>Turbo"]
    DOCK["Docker Postgres :5454"]
  end

  subgraph vercel["Produção / staging"]
    VW["Vercel — apps/web"]
    VA["Vercel — apps/platform-admin"]
    NEON[("Neon PostgreSQL<br/>schemas boilerplate + tenant_*")]
  end

  BUN --> DOCK
  VW --> NEON
  VA --> NEON
```

- Env **somente na raiz** (`.env`, `.env.development`, `.env.local`) — apps não têm `.env` próprio.
- Gate local: `bun run ci` / `bun run check:vercel`
- Docs: [`doc/vercel/README.md`](../vercel/README.md)

Modo **self-hosted** híbrido: pacotes `license-*`, `update-*`, scripts em `packages/db/src/self-hosted/`.

---

## 13. Pacotes de domínio e motores especializados

```mermaid
mindmap
  root((Boilerplate))
    Operacional
      core-vendas
      core-estoque
      ops-compras
    Comercial
      core-crm
      core-clientes
    Financeiro
      fin-fluxo-caixa
      billing package
    Fiscal
      fiscal-engine
      fiscal-core subtree
    IA
      aprendiz-engine
      ai-runtime
      agents
    Observabilidade
      observability
      workflows duráveis
```

| Pacote | Função |
|--------|--------|
| `fiscal-engine` | Motor de emissão fiscal plugável |
| `aprendiz-engine` | Missões, automações, ensino de processos |
| `ai-runtime` / `agents` | LLM e agentes |
| `workflows` | Orquestração durável (WDK / long-running) |
| `billing` | PricingEngine + adapters de pagamento |
| `crm` + `crm-ui` | Domínio e componentes CRM tenant |
| `platform-api` | Contratos e client HTTP para APIs de plataforma / setup |

---

## 14. Glossário rápido de escalas

| Sigla | Significado |
|-------|-------------|
| **R0–R4** | Marco de **entrega** de engenharia |
| **P1–P4** | **Fase de produto** do tenant (`organizations.phase`) |
| **E0–E10** | **Estágio de evolução** do negócio do cliente |
| **D0–D5** | **Profundidade** do módulo (quão completo vs. alvo) |

Detalhe: [`.specs/_shared/glossary.md`](../../.specs/_shared/glossary.md).

---

## 15. Onde ir mais fundo

| Tópico | Documento |
|--------|-----------|
| Contexto executivo e catálogo de módulos | [`CONTEXTO.md`](../../CONTEXTO.md) |
| PRD completo | [`prd.md`](../../prd.md) |
| Publicação comunidade | [`doc/ecosystem/`](../ecosystem/README.md) |
| CRM suite | [`doc/modulos/crm-suite/crm.md`](../modulos/crm-suite/crm.md) |
| Variáveis Vercel | [`doc/vercel/environment-variables.md`](../vercel/environment-variables.md) |
| Criar módulo (skill) | [`.cursor/skills/create-module/SKILL.md`](../../.cursor/skills/create-module/SKILL.md) |
| Criar integrador (skill) | [`.cursor/skills/create-integrator/SKILL.md`](../../.cursor/skills/create-integrator/SKILL.md) |

---

## 16. Comandos que materializam a arquitetura

```bash
bun run db:up                 # Postgres local
bun run db:push               # schema global (boilerplate)
bun run db:migrate-tenants    # DDL em todos tenant_*
bun run dev                   # web :3000 + platform-admin :3002 + marketplace :3003
bun run ci                    # pipeline local (espelha GitHub Actions)
```

Este arquivo é **descritivo** — reflete o estado do repositório; mudanças estruturais devem atualizar os diagramas aqui ou em `CONTEXTO.md` §6–9.
