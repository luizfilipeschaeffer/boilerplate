# PRD — Plataforma de Gestão Modular Adaptativa

**Versão:** 0.8 — Categorias hierárquicas, fornecedores e ordens de compra  

**Status:** Marco **R0** ✅ · **R1** ✅ · **R2** (tenant P1–P2) ✅ · **R2.5** ✅ · **R3.1** (compras + categorias) em entrega · Trilha `platform-admin` ✅ · **Próximo:** Marco **R3** — Fiscal homologado  

**Stack:** Next.js **16.2.6** · PostgreSQL 16 (Docker, porta **5454**, schema global `boilerplate`) · TypeScript · **Bun** · Turborepo · tRPC · NextAuth v5 · shadcn/ui  

**Idioma:** PT-BR (único no MVP)  

**Última atualização:** 22 Maio 2026 — PRD v0.8 (`ops-compras`, árvore de categorias, cadastro de fornecedores)

**Referências de mercado:** [Estrutura Organizacional por Segmento, Setor e Módulos](doc/estudo-de-mercado/Estrutura%20Organizacional%20por%20Segmento,%20Setor%20e%20Módulos.md) · [Módulos Vitais por Segmento](doc/estudo-de-mercado/Módulos%20Vitais%20por%20Segmento.md)

### Como lemos “fase” e escalas neste documento

| Sigla | Nome | Escala | Uso |
|-------|------|--------|-----|
| **R0–R4** | Marco de **entrega** (engenharia) | R0 fundação … R4 escala | §14 — o que o time implementa por sprint |
| **P1–P4** | **Fase de produto** do tenant | 1 informal … 4 escala | `organizations.phase`, pacotes de módulos, precificação |
| **E0–E10** | **Estágio de evolução** empresarial | 0 sobrevivência … 10 mega corp | §4.2 — maturidade real do negócio do cliente |
| **D0–D5** | **Profundidade** do módulo | 0 inexistente … 5 escala | §5.0.1 — o quão completo um módulo está hoje vs alvo |
| **Setor core** | Catálogo global (`core_sectors`) | slugs fixos | Financeiro, Comercial, Operação… — §5.0 |
| **Setor tenant** | Instância por organização | `sectors` | Departamento na empresa; default `geral` |

> **Não confundir:** marco **R0** (fundação técnica) ≠ estágio **E0** (sobrevivência do negócio). Fase de produto **P2** ≠ estágio **E2** (estruturação).

---

## 0. Decisões de Produto (v0.7)

Resumo das decisões tomadas para o primeiro ciclo de entrega:

| Tema | Decisão |
|------|---------|
| Escopo entregue (tenant) | **P1** (core + Aprendiz + PWA) e **P2** (fluxo de caixa, vendedores, relatórios) — ver §14.0 |
| Perfis de negócio | **10 tipos ativos** no onboarding; **7+ tipos planejados** em §5.5.1; **40 segmentos de mercado** no catálogo global (§5.0.2) |
| Classificação | **Quádruplo eixo:** estágio **E** (referência) + fase **P** (módulos) + **tipo de negócio** + **setor core** → pacote e UX (§6.4, §5.0) |
| Core por setor | Módulos organizados em **setores universais**; catálogo global `core_modules_catalog` + seed (§5.0, §8.10) |
| Profundidade | Todo módulo de produto com **D atual** e **D alvo**; changelog público de evolução (§5.0.1, §17.8) |
| Evolução visível ao cliente | Rota `/evolucao` (tenant): % do caminho por setor, próximas melhorias, feed de releases |
| Painel da plataforma | App/área **`platform-admin`** com CRM de clientes SaaS, comunicação omnichannel e analytics de demanda de módulos (ver §17) |
| Onboarding | Perguntas de diagnóstico + **CNPJ** + **tipo de negócio** no dia 1 |
| UI | **shadcn/ui** — blocks `login-01` (auth) e `dashboard-01` (área logada); layout **desktop-first**, responsivo |
| Offline | **PWA** com fila de sincronização para operações críticas (ex.: vendas) |
| Catálogo | **Grade genérica** produto/serviço (`core-catalogo`), campos evoluem com a fase |
| Acesso | Modelar **usuário → N empresas → setor**; MVP opera 1 empresa com setor default `Geral` |
| Dados | **Schema PostgreSQL por tenant** desde o dia 1; dev local via **Docker** (`localhost:5454`) |
| Toolchain | **Bun** — install, scripts, `bunx`; sem pnpm/npm no monorepo (§8.1.2) |
| Integrações | **Integradores** conectam serviços externos aos módulos e entre módulos (ver §8.7) |
| Entidades core | `Cliente`, `Item` (produto/serviço), `Venda` — módulos estendem, não duplicam (ver §8.8) |
| Comunicação entre módulos | Contrato de **eventos de domínio**; MVP usa transação síncrona + bus in-process (ver §8.9) |
| Fiscal | Domínio **`fiscal-core`** (pai) + **sub-módulos** instaláveis (`fiscal-nfce`, `fiscal-cte`, …); MVP com scaffold vazio; emissão via `fiscal-engine` + integradores (§9) |
| Cobrança | **Central de precificação** por fase **P**/módulo + múltiplos **gateways** (adapters); estágio **E** e profundidade **D** informam CSM, não precificam no MVP |
| Aprendiz | **No MVP** — camadas 1–2 com templates; camada 3 mínima (gatilhos fixos) |

---

## 1. Visão do Produto

Uma plataforma SaaS de gestão empresarial que se adapta à fase real do cliente — do empreendedor informal ao negócio em expansão — entregando apenas o que ele precisa, quando ele precisa, com capacidade de evolução modular sem fricção de migração.

O cliente nunca "troca de sistema". Ele cresce dentro do mesmo ambiente.

---

## 2. Problema

| Perfil | Dor Real |

|--------|----------|

| Informal (P1 / E0–E1) | ERPs são caros e complexos demais. Usa planilha ou caderno. |

| Crescendo (P2 / E2–E3) | Ferramentas simples não conectam vendas, estoque e caixa. |

| Estabelecido (P3 / E3–E4) | Sistemas fiscais exigem técnico para configurar. |

| Em escala (P4 / E4–E5) | Dados ficam espalhados em sistemas diferentes; precisa de governança e BI. |

**Gap central:** o mercado oferece ou ferramentas simples demais (sem evolução) ou ERPs completos demais (sem adoção). Não existe uma plataforma que escale com o cliente de forma fluida e inteligente.

---

## 3. Proposta de Valor

- **Diagnóstico automático** → sistema se configura sozinho na primeira entrada

- **Módulos que se integram** → dados do dia 1 seguem o cliente até P4 / estágios E mais altos

- **Aprendiz IA** → o cliente ensina seus processos; a IA executa e sugere automações

- **Evolução guiada** → sistema detecta o momento certo de sugerir o próximo módulo (fase P e profundidade D)

- **Transparência de evolução** → cliente vê para onde a plataforma caminha (% profundidade por setor, changelog de melhorias — §5.0.1)

- **Performance nativa** → Next.js App Router + PostgreSQL otimizado, sem overhead de ERP legado

- **Integradores** → serviços externos e módulos conversam por uma camada única, com responsabilidades claras

- **Perfis de negócio** → mesma plataforma atende PF, varejo, atacado, cadeia industrial etc., com módulos adequados ao **tipo** e à **fase**

- **Painel da plataforma** → time interno acompanha relacionamento, conversas (WhatsApp, Telegram, e-mail…) e prioriza o roadmap pelo que o mercado mais pede

---

## 4. Usuários-Alvo

### Persona Principal — "Dona Maria" (P1–P2 · E0–E2)

- Proprietária de pequeno negócio (moda, alimentação, serviços)

- 30–55 anos, smartphone como ferramenta principal

- Não quer aprender sistema; quer resultado

### Persona Secundária — "Marcos" (P2–P3 · E2–E3)

- Dono de loja com 2–5 funcionários

- Já usa alguma ferramenta, mas é fragmentada

- Quer controle sem precisar de contador para tudo

### Persona Terciária — "Grupo" (P4 · E4–E5)

- Gestor de rede ou franquia

- Precisa de visão consolidada e integrações

- Avalia ROI por unidade

### 4.1 Modelo de Acesso — Empresa, Setor e Fase de Produto

A **fase de produto (P1–P4)** é atributo da **empresa** (tenant) — determina módulos elegíveis e precificação. O **setor tenant** define escopo de ferramentas, processos e permissões dentro da mesma empresa. O **setor core** (catálogo) agrupa módulos por área funcional (§5.0).

```
Usuário
  └── Membership (empresa + papel global: dono, gerente, vendedor…)
        └── Acesso por setor (subset de módulos/nav/permissões)
              └── Dados operacionais no schema tenant_xxx
```

| Conceito | Escopo | MVP |
|----------|--------|-----|
| **Organização (tenant)** | Empresa com schema isolado, fase, módulos ativos | 1 org por fluxo principal |
| **Setor tenant** | Departamento na empresa (`sectors`) | Default `Geral`; futuro: template a partir de `core_sectors` |
| **Fase de produto (P)** | Tier de módulos (1–4) | P1–P2 entregues; diagnóstico classifica P1–P4 |
| **Estágio de evolução (E)** | Maturidade empresarial (0–10) | Referência + analytics; campo `evolution_stage` (futuro) |
| **Contexto de sessão** | `organizationId` + `sectorId` | Obrigatório no JWT/sessão |

**Troca de contexto:** o usuário escolhe empresa (futuro: lista de memberships) e setor; nav e RBAC filtram por setor + módulos ativos da fase P da empresa.

**Schema global (`boilerplate`):** `users`, `organizations` (+ `tipo_negocio`, `segmento_atuacao`, `phase`), `memberships`, `sectors`, `modulos_ativos`, `modulo_demanda`, catálogo `core_*` / `market_*` (§8.10), `module_depth_changelog`, entidades `platform_*` (§17).

---

### 4.2 Estágios de Evolução Empresarial (E0–E10)

Modelo de maturidade **real** do negócio — independente do tamanho físico (funcionários/faturamento). Uma software house de 15 pessoas pode estar estruturalmente à frente de uma indústria de 300 funcionários.

| Estágio | Título | Descrição | O que muda |
|---------|--------|-----------|------------|
| **E0** | Sobrevivência | Negócio inicial, geralmente sozinho ou poucos clientes | Foco em vender e sobreviver; sem processos; tudo depende do dono |
| **E1** | Operação inicial | Clientes recorrentes e pequeno fluxo de caixa | Primeiras contratações; organização básica; controle financeiro simples |
| **E2** | Estruturação | Empresa deixa de ser improvisada | Processos internos; CRM, ERP, suporte, marketing básico |
| **E3** | Crescimento local | Marca ganha relevância regional | Equipes por função; metas, indicadores, liderança intermediária |
| **E4** | Expansão regional | Múltiplas cidades ou regiões | Filiais; padronização operacional; gestão descentralizada |
| **E5** | Empresa escalável | Crescimento acelerado com replicação | Automação; tecnologia forte; times especializados; cultura organizacional |
| **E6** | Corporação nacional | Presença consolidada no país | Governança; compliance; múltiplos departamentos; grande operação financeira |
| **E7** | Grupo empresarial | Várias empresas, marcas ou unidades | Holdings; aquisições; conselhos; estratégia corporativa |
| **E8** | Multinacional | Operação internacional | Adaptação cultural, tributária e jurídica global; gestão distribuída |
| **E9** | Conglomerado global | Influência mundial e grande poder econômico | Ecossistema próprio; milhares de funcionários; operações gigantescas |
| **E10** | Mega corporação global | Molda mercados globais | Influência política/econômica; inovação em larga escala |

**Resumo da evolução:**

- **E0 → E2:** do caos operacional à organização básica
- **E3 → E5:** de empresa pequena a negócio escalável
- **E6 → E8:** de empresa nacional a potência internacional
- **E9 → E10:** de gigante a influência global de mercado

**O que normalmente muda entre estágios:** quantidade de clientes, funcionários, complexidade operacional, dependência do fundador, automação, governança, presença geográfica, estrutura financeira, capacidade de escala, poder de marca.

**Fatores que definem o estágio (peso relativo):**

| Fator | Peso |
|-------|------|
| Escalabilidade | Altíssimo |
| Dependência do dono | Altíssimo |
| Estrutura operacional | Alto |
| Automação | Alto |
| Alcance geográfico | Alto |
| Governança | Médio |
| Faturamento | Médio |
| Quantidade de funcionários | Médio |
| Marca / influência | Médio |

**Exemplos ilustrativos:**

| Empresa | Estágio aproximado |
|---------|-------------------|
| Pequeno MEI local | E0–E1 |
| Agência regional | E2–E3 |
| Franquia nacional | E5–E6 |
| Grande banco nacional | E6–E7 |
| Amazon | E9 |
| Google / Apple / Microsoft | E9–E10 |

**Velocidade de evolução por segmento** (mesma estrutura E0–E10, ritmo diferente):

| Segmento | Ritmo | Nota |
|----------|-------|------|
| Software / SaaS | Muito rápido | Pouca estrutura física; 20 pessoas podem estar em E5–E6 (ex.: Stripe no início) |
| E-commerce | Rápido | Logística terceirizada + automação (ex.: ecossistema Shopify) |
| Consultoria / agência | Lento | Crescimento = contratar pessoas; muitas ficam em E2–E4 |
| Indústria | Lento | Fábricas, estoque, máquinas, distribuição; 200 funcionários podem ser E3–E4 |
| Restaurante | Lento local / rápido em franquia | Operação local E2–E3; rede tipo McDonald's E8–E9 |
| Varejo | Médio | PDV + fiscal + estoque |

---

### 4.3 Mapeamento Estágio E ↔ Fase de Produto P

A plataforma implementa hoje **P1–P4** (código e precificação). Os estágios **E0–E10** orientam visão de produto, CSM e roadmap; nem todo E alto exige P5+ no curto prazo.

| Estágio E | Título | Fase P | Situação na plataforma (Mai/2026) |
|-----------|--------|--------|-----------------------------------|
| E0–E1 | Sobrevivência / operação inicial | P1 | Core MVP entregue (R1) |
| E2 | Estruturação | P1–P2 | P2 entregue — finanças, vendedores, relatórios (R2) |
| E3 | Crescimento local | P2–P3 | R3 em andamento — fiscal homologado, comissões |
| E4 | Expansão regional | P3–P4 | P4 planejado — multi-loja, BI |
| E5 | Empresa escalável | P4+ | Visão §5.9 — automação, API, cultura |
| E6–E10 | Nacional → mega corp | — | Roadmap de longo prazo; sem tier P5–P10 no código atual |

**Módulos críticos por faixa de estágio E** (estudo de mercado — referência de cobertura):

| Faixa E | Módulos críticos (mercado) |
|---------|----------------------------|
| E0–E1 | Financeiro, CRM, Vendas |
| E2–E3 | ERP, Estoque, RH |
| E4–E5 | BI, Automação, Processos |
| E6–E7 | Compliance, Governança, Integrações |
| E8–E10 | Data Lake, IA, Segurança global, Multi-operação |

**Módulos emergentes (todos os segmentos):** IA operacional, automação de processos, BI em tempo real, cibersegurança, gestão de APIs, data warehouse/lake, IA agêntica, workflow automation, observabilidade, governança de dados.

---

## 5. Fases de Produto (P1–P4) e Módulos

### 5.0 Core organizado por setor

Os módulos de produto pertencem a **setores core** (catálogo global). Isso facilita gestão no `platform-admin`, navegação futura no tenant e narrativa de evolução para o cliente.

**Setores universais** (estudo de mercado + produto):

| Setor core (`slug`) | Camada | Presença | Módulos de produto (exemplos) |
|---------------------|--------|----------|-------------------------------|
| `comercial` | Tática | Universal | `core-clientes`, `core-vendas`, `core-ranking`, `ops-vendedores`, `core-crm` |
| `operacao` | Operacional | Universal | `core-catalogo`, `core-estoque-basico`, `segment-moda`, `segment-alimentacao` |
| `financeiro` | Tática | Universal | `fin-fluxo-caixa`; planejado: `fin-contas-pagar`, `fin-dre-simplificado` |
| `fiscal` | Compliance | Crescente | `fiscal-core`, sub-módulos `fiscal-*` |
| `analytics` | Estratégica | Crescente | `rel-basico`; planejado: `bi-dashboards` |
| `pessoas` | Tática | Muito comum | `ops-vendedores`; planejado: `rh-comissoes` |
| `logistica` | Operacional | Muito comum | Planejado: `ops-multi-depot`, `ops-rotas`, `ops-frota` |
| `atendimento` | Operacional | Muito comum | Planejado: SAC/chat; automação via `aprendiz` |
| `tecnologia` | Técnica | Crescente | `aprendiz`; planejado: `api-parceiros` |
| `compliance` | Compliance | Crescente | `fiscal-sped`; planejado: LGPD |

**Camadas organizacionais:**

| Camada | Conteúdo típico | Setores core |
|--------|-----------------|--------------|
| Estratégica | BI, KPIs, IA, planejamento | `analytics`, `aprendiz` (camada 3) |
| Tática | ERP, CRM, BPM, gestão | `comercial`, `financeiro`, `fiscal` |
| Operacional | PDV, estoque, produção, frota | `operacao`, `logistica`, `atendimento` |
| Técnica | APIs, segurança, observabilidade | `tecnologia` |

**Módulos transversais de mercado** (presentes em vários setores): ERP, CRM, Financeiro, Estoque, BI, RH, Logística, Compliance, Automação, Atendimento/Suporte, Segurança, Infraestrutura/APIs.

**Mapeamento conceito de mercado → ID de produto:**

| Mercado | ID plataforma | Situação |
|---------|---------------|----------|
| ERP | Pacote `core-*` + finanças | Parcial P1–P2 |
| CRM | `core-clientes`, `core-crm` | Clientes ✅; CRM comercial ✅ (kanban S04) |
| Financeiro / Caixa | `fin-fluxo-caixa` | ✅ P2 |
| PDV / Vendas | `core-vendas` | ✅ P1 |
| Estoque | `core-estoque-basico` | ✅ P1 |
| Fiscal | `fiscal-core`, `fiscal-*` | Core ✅; emissão R3 |
| BI / Relatórios | `rel-basico` | ✅ P2 |
| RH / Comissão | `ops-vendedores`, `rh-comissoes` | Parcial / R3 |
| Automação / IA | `aprendiz` | ✅ templates + LLM opcional |
| WMS / TMS / Frota | `ops-*` | Planejado |
| Multi-loja | `ops-multi-loja`, `bi-dashboards` | P4 |

### 5.0.1 Profundidade de módulo (D0–D5)

Complementa `implementation_status` (existe código?) e fase P (quando é elegível). Responde: **quão completo o módulo está hoje** e **até onde queremos levá-lo**.

| Nível | Nome | Critério |
|-------|------|----------|
| **D0** | Inexistente | Não catalogado ou só referência de mercado (`market_*`) |
| **D1** | Essencial | Fluxo feliz único; dados manuais; sem integração entre módulos |
| **D2** | Conectado | Integra com ≥1 módulo core (eventos, lançamento automático, offline/PWA) |
| **D3** | Profissional | Relatórios, regras de negócio, papéis, refinamento por segmento/tipo |
| **D4** | Avançado | Fiscal, automação, multi-usuário avançado; Aprendiz camada 2+ |
| **D5** | Escala | Multi-unidade, API, BI, white-label — alinhado a P4 / E4+ |

**Campos no catálogo** (`core_modules_catalog` + espelho no `module-registry`): `depth_current`, `depth_target`, `depth_target_marco` (R0–R4), `depth_rubric` (JSON por módulo), `depth_notes` (interno).

**Agregados:** `sector_depth_pct = média(depth_current / depth_target)` por setor; `platform_depth_pct` nos módulos com `registry_sync=true`.

**Snapshot Mai/2026 (produto):**

| Módulo | D atual | D alvo | Marco alvo |
|--------|---------|--------|------------|
| `core-vendas` | 2 | 4 | R3 |
| `core-clientes` | 2 | 3 | R2 |
| `core-crm` | 2 | 3 | R3 |
| `fin-fluxo-caixa` | 2 | 3 | R2 |
| `fiscal-core` | 1 | 3 | R3 |
| `fiscal-nfce` (e sub-módulos) | 0 | 2 | R3 |
| `rel-basico` | 2 | 4 | R4 |
| `aprendiz` | 2 | 4 | R3 |
| `ops-vendedores` | 2 | 3 | R2 |

**Changelog (`module_depth_changelog`):** histórico de promoções de profundidade (título, resumo público, `delivery_marco`, `show_to_tenants`). Exemplos já entregues: `core-vendas` D1→D2 (PWA offline); `fin-fluxo-caixa` D1→D2 (lançamento automático na venda confirmada).

**Regra de engenharia:** ao fechar marco R, atualizar `depth_current` nos módulos afetados e registrar changelog.

**Tenant — `/evolucao`:** barras por setor (% do caminho), próximas melhorias, feed “o que melhorou na plataforma”. Copy: *“A plataforma evolui em camadas; você não precisa trocar de sistema — os mesmos dados ganham novas capacidades.”*

**Não expor ao cliente:** siglas R, IDs `market_*`, notas internas `depth_notes`.

### 5.0.2 Segmentos de mercado (catálogo)

**40 segmentos** documentados em `doc/estudo-de-mercado/` (Agronegócio, Varejo, Saúde, E-commerce, …), cada um com matriz **segmento × setor × módulos de mercado** (~90 linhas) e lista de **módulos vitais**.

| Conceito | Papel |
|----------|-------|
| `market_segment` | Vocabulário do estudo; priorização e cobertura no `platform-admin` |
| `tipo_negocio` | Perfil operacional no onboarding (10 ativos) |
| `segmento_atuacao` | Refinamento UX (moda, alimentação, agro…) |

Ex.: “Alimentação / Food Service” → `tipo_negocio=varejo` + `segmento_atuacao=alimentacao` + módulos de mercado PDV, KDS, Delivery.

Os 40 segmentos **não** viram 40 tipos no onboarding; interesse antecipado continua em `modulo_demanda` e `tipo_negocio_interesse` (§17.5).

---

### Fase de produto P1 — Informal

> "Vendo para amigos e indicações, sem estrutura" · estágios **E0–E1**

**Módulos disponíveis (MVP):**

- `core-catalogo` — cadastro genérico de **produto ou serviço**; formulário evolui conforme fase/módulos ativos

- `core-clientes` — cadastro, histórico de compras, contato

- `core-vendas` — registro de venda, forma de pagamento, status

- `core-estoque-basico` — entrada/saída, alerta de estoque baixo (serviços sem controle de estoque)

- `core-ranking` — itens mais vendidos, clientes que mais compram

- `fiscal-core` — módulo **pai** fiscal (certificado, séries, fila, shell UI); sub-módulos `fiscal-*` instaláveis conforme tipo/fase (§9)

- `aprendiz` — automações por templates no MVP (ver §7.6)

**Acesso:** Layout **desktop-first** (block `dashboard-01`), totalmente responsivo. Menus mínimos na fase **P1**. **PWA** para uso offline.

---

### Fase de produto P2 — Crescendo

> "Tenho ponto fixo ou vendo online, preciso de controle" · estágios **E2–E3**

**Módulos adicionais:**

- `fin-fluxo-caixa` — entradas, saídas, saldo projetado

- `fin-contas-pagar` — vencimentos, alertas, parcelamentos

- `ops-vendedores` — cadastro de vendedor, atribuição de vendas

- `rel-basico` — relatórios de período, ticket médio, inadimplência

---

### Fase de produto P3 — Estabelecido

> "Loja consolidada, preciso emitir nota e gerir equipe" · estágios **E3–E4**

**Módulos adicionais:**

- Sub-módulos fiscais (ex.: `fiscal-nfce`, `fiscal-nfe`, `fiscal-cte`, `fiscal-sped`) — ativados por pacote, não monólito (§9)

- `rh-comissoes` — regras de comissão por vendedor, produto ou meta

- `ops-multi-caixa` — múltiplos pontos de venda simultâneos

- `fin-dre-simplificado` — demonstrativo de resultado simplificado

---

### Fase de produto P4 — Escala

> "Tenho mais de uma loja ou quero franquear" · estágios **E4–E5**

**Módulos adicionais:**

- `ops-multi-loja` — gestão centralizada com visão por unidade

- `bi-dashboards` — painéis com metas, comparativos e tendências

- `api-parceiros` — webhooks e API REST para integrações externas

- `white-label` — plataforma com identidade do franqueador

### 5.9 Visão de longo prazo — estágios E5–E10

Faixa além de **P4** no produto atual; orienta backlog estratégico e catálogo `market_*` (sem datas de sprint).

| Estágio E | Capacidades de produto (direção) |
|-----------|----------------------------------|
| **E5** | Automação avançada, cultura organizacional, `bi-dashboards`, `api-parceiros`, integrações profundas |
| **E6** | Governança, compliance corporativo, consolidação financeira multi-unidade |
| **E7** | Holdings, multi-empresa, estratégia de grupo, relatórios consolidados |
| **E8** | Multinacional — localização, tributação global, operações distribuídas |
| **E9–E10** | Ecossistema, data lake, IA agêntica em escala, segurança global |

Módulos de mercado típicos nessas faixas: data warehouse/lake, governança de dados, observabilidade, IAM avançado, workflow enterprise.

### 5.5 Perfis de Negócio (tipo operacional)

Independente da **fase de produto P** e do **estágio E** (referência), cada organização tem um **tipo de negócio** que define fluxos, campos do catálogo e **pacote de módulos recomendados**.

| `TipoNegocio` | Descrição | Ênfase funcional |
|---------------|-----------|------------------|
| `pessoa_fisica` | Autônomo / MEI / profissional liberal | Vendas simples, poucos clientes, estoque opcional, fiscal simplificado |
| `varejo` | Venda direta ao consumidor final | PDV, estoque por unidade, NFC-e (fase 3), ranking |
| `atacado` | Venda em volume para revenda | Tabela de preço por cliente, pedido mínimo, NF-e B2B, comissão |
| `fornecedor` | Fornece insumos/produtos para outros negócios | Catálogo B2B, pedidos de compra, contas a receber, lead time |
| `distribuidor` | Revenda/logística de **mercadoria** em rede (estoque, margem, canais) | Multi-depósito, rotas de entrega de produto, integração atacado+varejo — **não** é transporte de carga |
| `transportadora` | Prestação de **serviço de transporte** de cargas (frete) | Frota, motoristas, CT-e, MDF-e, romaneio, tabela de frete, rastreio de viagem, manifesto |
| `fabricante` | Fabrica e comercializa produtos (próprios ou sob encomenda) | Ordem de produção, ficha técnica, custo por lote, NF-e, vínculo fornecedor↔cliente |
| `industria` | Indústria de transformação em escala | BOM multi-nível, capacidade produtiva, MRP, qualidade, NF-e, integração chão de fábrica |
| `produtor_rural` | Produção agropecuária e extrativismo rural | Safra, rebanho, gleba, rastreabilidade, NF-e produtor rural / NFA-e, sazonalidade, SIF/SIE quando aplicável |

> **Fase P** responde *“qual tier de módulos a plataforma oferece?”* · **Estágio E** responde *“quão madura é a empresa?”* · **Tipo** responde *“que modelo operacional ela exerce?”* · **Setor core** organiza *“em qual área da empresa cada módulo atua?”*  
> A interseção P × tipo × setor determina módulos **elegíveis**, **recomendados** e **prioridade de UX**; profundidade **D** mede o quanto cada módulo já entregou dessa visão.

**Módulos por tipo (exemplos — matriz completa em §6.4):**

| Tipo | Módulos típicos além do core Fase 1 |
|------|-------------------------------------|
| `pessoa_fisica` | `core-vendas`, `core-clientes`; estoque desligável |
| `varejo` | + `core-estoque-basico`, `core-ranking`; P2+ → `ops-compras`; fase 3 → `fiscal-nfce` + `fiscal-sped` (§9.3) |
| `atacado` | + `ops-tabela-preco`, `ops-compras` (P2+); fase 3 → `fiscal-nfe` + `fiscal-sped` |
| `fornecedor` | + `fin-contas-receber` (vendas B2B); **não** usar `ops-compras` como comprador — tipo é quem **vende** para outros |
| `distribuidor` | + `ops-multi-depot`, `ops-rotas`, `ops-compras` (P2+); fase 4 → `ops-multi-loja` |
| `transportadora` | + `ops-frota`, `ops-romaneio`; fase 2 → `fiscal-cte`, `fiscal-mdfe` |
| `fabricante` | + `ops-ordem-producao`, `ops-ficha-tecnica`, `ops-compras` (P2+); fase 3 → `fiscal-nfe` |
| `industria` | + `ops-bom`, `ops-mrp`, `ops-compras` (P2+); fiscal NF-e, qualidade |
| `produtor_rural` | + `ops-safra-rebanho`, `ops-lote-rastreio`, `ops-gleba`, `ops-compras` (P2+); fiscal rural |

> **`ops-pedidos-compra` (legado no texto antigo):** substituído por **`ops-compras`** — ordens de **compra** que o tenant envia a fornecedores cadastrados (§13.5). Distinto de `core-pedidos` (pedidos de **venda** ao cliente).

Módulos marcados como futuros entram no registry com flag `status: 'planned'` até implementação; o diagnóstico pode **sugerir** sem ativar.

### 5.5.1 Tipos planejados (ainda não no onboarding)

Tipos com `status: 'planned'` no registry de negócio. **Não aparecem** na pergunta 1 do onboarding até homologação de módulos e matriz fase × tipo. Interesse antecipado → `modulo_demanda` + `tipo_negocio_interesse` (§17.5).

**Critério para promover a tipo ativo** (≥ 2 itens):

1. Documento fiscal dominante distinto (NFS-e, DI, CT-e já coberto, etc.)
2. Entidade operacional core distinta (obra, contrato de locação, manifesto 3PL…)
3. Pacote default de módulos claramente diferente na matriz §6.4

Caso contrário: tipo existente + `segmentoAtuacao` + módulos avulsos.

#### Ativos hoje (10) — onboarding

`pessoa_fisica` · `varejo` · `atacado` · `fornecedor` · `distribuidor` · `transportadora` · `fabricante` · `industria` · `produtor_rural`

#### Planejados — prioridade alta

| `TipoNegocio` (futuro) | Descrição | Fiscal / módulos âncora |
|------------------------|-----------|-------------------------|
| `prestador_servicos` | Serviços com agenda/contrato (clínicas, salões, consultoria, TI, manutenção) | NFS-e; `ops-agenda`, `ops-contrato`; estoque opcional |
| `operador_logistico` | Armazém geral, WMS, 3PL (guarda e movimenta carga alheia, sem revenda) | NF serviço armazenagem; `ops-wms`, `ops-deposito`; distinto de `distribuidor` e `transportadora` |
| `importador_exportador` | Comércio exterior, trading | DI/DU-E, câmbio, Incoterm; `ops-comex`, `fiscal-comex` |

#### Planejados — prioridade média

| `TipoNegocio` (futuro) | Descrição | Fiscal / módulos âncora |
|------------------------|-----------|-------------------------|
| `construcao` | Construtora, empreiteira, obra por medição | NF-e serviço/obras; `ops-obra`, `ops-medicao`, materiais por projeto |
| `representante_comercial` | Agente/representante sem estoque próprio | Comissão; `ops-comissao-rep`, pedidos vinculados ao fabricante |
| `locadora` | Locação de equipamentos, veículos, imóveis comerciais | Contrato + ciclo de cobrança; `ops-locacao`, ativo imobilizado |

#### Planejados — prioridade baixa / avaliar módulo antes de tipo

| `TipoNegocio` (futuro) | Descrição | Nota |
|------------------------|-----------|------|
| `cooperativa` | Cooperativa agro, crédito, compra coletiva | Pode iniciar como `produtor_rural` + módulo `ops-cooperativa` |
| `franqueador` | Dono da rede/franquia | Pode iniciar como Fase 4 + `white-label` + `ops-multi-loja` |

#### Não viram tipo — usar tipo + segmento + módulo

| Perfil | Enquadramento |
|--------|----------------|
| Restaurante, bar, delivery | `varejo` + segmento alimentação + `ops-comanda` |
| Farmácia, posto | `varejo` + segmento regulado |
| E-commerce / marketplace | `varejo` ou `atacado` + integradores canal |
| Atacarejo | `varejo` ou `atacado` + flag `atacarejo` |
| Franqueado | `varejo`/`atacado` + multi-loja |
| Hotel, escola, clínica convênio | `prestador_servicos` (quando ativo) + segmento + módulo vertical |
| Gráfica / sob encomenda | `fabricante` |
| Corretor imóveis/seguros | `representante_comercial` (quando ativo) ou `prestador_servicos` |

#### Fluxo onboarding enquanto tipo está `planned`

1. Usuário não vê o ID na lista principal.
2. Opção **“Meu negócio não está na lista”** → captura texto livre + sugestão do tipo planejado mais próximo (heurística).
3. Persiste `organizations.tipo_negocio` = tipo ativo mais próximo + `organizations.tipo_negocio_interesse` = ID planejado.
4. `platform-insights` agrega demanda para priorizar implementação.

```typescript
type TipoNegocioStatus = 'active' | 'planned' | 'deprecated';

interface TipoNegocioDefinition {
  id: TipoNegocio | TipoNegocioPlanejado;
  label: string;
  status: TipoNegocioStatus;
  prioridade?: 'alta' | 'media' | 'baixa';
  pacotesModulos: Record<Fase, string[]>;
}
```

### 5.6 Dois mundos de “cliente” (terminologia)

| Termo no sistema | Quem é | Onde vive |
|------------------|--------|-----------|
| **Cliente da plataforma** | Empresa assinante do SaaS (tenant) | Schema `public` + CRM §17 |
| **Cliente do negócio** | Consumidor/parceiro do tenant | Schema `tenant_xxx` · módulo `core-clientes` |

O **Painel da Plataforma** gerencia apenas **clientes da plataforma**. O módulo `core-clientes` gerencia **clientes do negócio** de cada tenant.

---

## 6. Diagnóstico Automático

O diagnóstico é executado no onboarding e pode ser revisado a qualquer momento.

### 6.1 Fluxo de Onboarding (dia 1)

Sequência:

1. **Conta** — registro/login (block shadcn `login-01`)
2. **Empresa** — nome, provisionamento do schema `tenant_xxx`
3. **Diagnóstico** — perfil do negócio + maturidade + **CNPJ** (abaixo)
4. **Ativação** — módulos da **fase P** + pacote recomendado pelo **tipo de negócio** (entregue: P1–P2 conforme diagnóstico)
5. **Primeiro passo** — cadastrar primeiro item (produto/serviço) ou cliente

**Perguntas do diagnóstico (tenant):**

1. **Tipo de negócio** (obrigatório): pessoa física · varejo · atacado · fornecedor · distribuidor · fabricante · indústria · produtor rural · **transportadora**
2. Segmento de atuação (ícone: moda, alimentação, serviços, agro, indústria, outros — refinamento de UX)
3. Ponto fixo ou loja física? (sim / não / online)
4. Vendas por mês (faixa)
5. Tem funcionários? (sim / não)
6. Emite nota fiscal? (sim / não / não sei)

> A pergunta 1 substitui o antigo “segmento único” como eixo principal de modularização operacional.

**CNPJ (obrigatório no fluxo, valor opcional):**

- A empresa **possui CNPJ?** (sim / não)
- Se sim: número com validação de formato (sem consulta Receita Federal no MVP)
- Campos: `organizations.has_cnpj`, `organizations.cnpj`, `organizations.fiscal_ready`

### 6.2 Engine de Classificação

```typescript

type Fase = 1 | 2 | 3 | 4;

type TipoNegocio =
  | 'pessoa_fisica'
  | 'varejo'
  | 'atacado'
  | 'fornecedor'
  | 'distribuidor'
  | 'transportadora'
  | 'fabricante'
  | 'industria'
  | 'produtor_rural';

interface DiagnosticoInput {
  tipoNegocio: TipoNegocio;
  segmentoAtuacao: Segmento;       // refinamento (ícone)
  temPontoFixo: boolean;
  vendasMes: 'ate50' | '50a200' | '200a1000' | 'acima1000';
  temFuncionarios: boolean;
  emiteNota: boolean | null;
  possuiCnpj: boolean;
  cnpj?: string | null;
}

function classificarFase(input: DiagnosticoInput): Fase {

 let score = 0;

 if (input.temPontoFixo) score += 1;

 if (input.vendasMes === '50a200') score += 1;

 if (input.vendasMes === '200a1000') score += 2;

 if (input.vendasMes === 'acima1000') score += 3;

 if (input.temFuncionarios) score += 1;

 if (input.emiteNota) score += 2;

 if (score <= 1) return 1;

 if (score <= 3) return 2;

 if (score <= 5) return 3;

 return 4;

}

```

> **Implementado:** `classificarFase()` → **P1–P4** apenas. **Não** classifica estágio **E0–E10** no onboarding atual.

### 6.2.1 Estágio de evolução E (futuro)

Função planejada `estimarEstagioEvolucao(input, tipoNegocio)` com questionário ampliado:

- Dependência do dono, nível de automação, alcance geográfico, número de unidades, processos documentados

**Coeficiente de velocidade por segmento** (§4.2): SaaS/e-commerce aceleram; indústria/restaurante local desaceleram.

Persistência opcional: `organizations.evolution_stage` (Int 0–10) — somente leitura/analytics e CSM no início; **não** altera pacote P no MVP.

### 6.3 Resultado do Diagnóstico

Ao final, o sistema:

1. Persiste `organization.phase`, `organization.tipo_negocio`, `organization.segmento_atuacao`
2. Ativa módulos do **pacote base da fase** ∩ **elegíveis para o tipo**
3. Configura menus, fluxos e campos do `core-catalogo` conforme tipo + fase
4. Sugere módulos `planned` ainda não implementados (lista de interesse → analytics §17)
5. Registra baseline para evolução de fase e feedback ao time de produto

### 6.4 Engine de Recomendação de Módulos (fase P × tipo)

```typescript
interface ModuloRecomendacao {
  moduleId: string;
  prioridade: 'obrigatorio' | 'recomendado' | 'opcional' | 'futuro';
  motivo: string;
}

function recomendarModulos(fase: Fase, tipo: TipoNegocio): ModuloRecomendacao[] {
  const pacoteFase = PACOTES_POR_FASE[fase];           // módulos por maturidade
  const pacoteTipo = PACOTES_POR_TIPO[tipo];           // módulos por operação
  return intersectarEOrdenar(pacoteFase, pacoteTipo);  // ver matriz abaixo
}

async function ativarPacoteDiagnostico(orgId: string, input: DiagnosticoInput) {
  const fase = classificarFase(input);
  const recomendados = recomendarModulos(fase, input.tipoNegocio);
  for (const m of recomendados.filter(r => r.prioridade !== 'futuro')) {
    await ativarModulo(orgId, m.moduleId);
  }
  await registrarDemandaModulosFuturos(orgId, recomendados.filter(r => r.prioridade === 'futuro'));
}
```

**Matriz resumida (ativação vs sugestão):**

| Tipo \ Fase | 1 | 2 | 3 | 4 |
|-------------|---|---|---|---|
| **pessoa_fisica** | core-* (estoque opcional) | + fin-fluxo-caixa | + fiscal se CNPJ | — |
| **varejo** | core-* + estoque + ranking | + fin, vendedores | + nfce | + multi-loja, BI |
| **atacado** | core-* + tabela preço (futuro) | + fin, rel | + nfe, comissões | + distribuição |
| **fornecedor** | core-* + catálogo B2B | + contas receber | + nfe | + API parceiros |
| **distribuidor** | core-* | + multi-depot (futuro) | + nfe, rotas | + multi-loja, BI |
| **transportadora** | core-* (serviço frete, não PDV) | + frota, tabela frete | + cte, mdfe | + BI, API parceiros |
| **fabricante** | core-* + OP simples (futuro) | + ficha técnica, custos | + nfe, lote | + BI, API |
| **industria** | core-* + BOM (futuro) | + MRP, capacidade | + nfe, qualidade | + BI consolidado |
| **produtor_rural** | core-* + gleba/safra (futuro) | + rebanho, rastreio | + NF rural, lote | + multi-fazenda |

Células com “(futuro)” geram evento `modulo.demanda_registrada` consumido pelo **Painel da Plataforma** (§17.4).

**Regras adicionais:**

- `pessoa_fisica` sem CNPJ: não sugerir módulos fiscais até `fiscal_ready`
- `atacado` / `fornecedor` / `distribuidor`: priorizar NF-e de mercadoria na fase 3
- `transportadora`: pacote fiscal **`fiscal-cte` + `fiscal-ciot` + `fiscal-mdfe`** (dependência CT↔MDF §9.5); **sem** `fiscal-nfce`
- `varejo`: pacote **`fiscal-nfce` + `fiscal-sped`** (+ `fiscal-nfe` se B2B); ver §9.3
- `distribuidor` ≠ `transportadora`: distribuidor movimenta estoque próprio; transportadora presta frete sobre carga de terceiros
- `fabricante` vs `industria`: fabricante → OP e ficha técnica primeiro; indústria → BOM/MRP e chão de fábrica
- `produtor_rural`: sub-módulo **`fiscal-rural`** + `fiscal-sped`; operacional: safra, gleba, rastreio (§5.5)
- `fabricante` / `industria` / `produtor_rural`: campos estendidos no `core-catalogo` conforme módulos ativos

---

## 7. Aprendiz IA — Engine de Inteligência

O Aprendiz é o diferencial estratégico da plataforma. Não é um chatbot genérico — é um agente treinado pelo próprio cliente para automatizar **os processos específicos do negócio dele**.

### 7.1 Conceito

O cliente ensina o Aprendiz através de uma interface de "gravação de processo":

```

"Toda vez que uma venda for realizada para um cliente novo,

cadastre-o automaticamente e envie uma mensagem de boas-vindas."

```

O Aprendiz interpreta, confirma a regra com o cliente, e executa.

### 7.2 Camadas do Aprendiz

```

┌─────────────────────────────────────────────────────┐

│  CAMADA 3 — Sugestão Proativa                        │

│  Detecta padrões e sugere automações e módulos       │

├─────────────────────────────────────────────────────┤

│  CAMADA 2 — Execução Autônoma                        │

│  Executa regras aprendidas sem intervenção           │

├─────────────────────────────────────────────────────┤

│  CAMADA 1 — Aprendizado por Instrução                │

│  Cliente ensina processos em linguagem natural       │

└─────────────────────────────────────────────────────┘

```

### 7.3 Exemplos de Automações por Fase

**Fase P1 (E0–E2):**

- "Quando estoque do produto X cair abaixo de 5, me avisa"

- "Registra a venda e já desconta do estoque"

**Fase P2 (E2–E3):**

- "Quando um cliente não compra há 30 dias, coloca na lista de reativação"

- "Fecha o caixa toda sexta às 18h e me manda o resumo"

**Fase P3 (E3–E4):**

- "Emite NFC-e automaticamente para vendas no balcão"

- "Calcula a comissão do vendedor no fechamento do mês"

**Fase P4 (E4–E5):**

- "Consolida os resultados das 3 lojas e gera o DRE comparativo"

- "Alerta se qualquer unidade tiver queda de vendas acima de 20% vs mês anterior"

### 7.4 Gatilhos de Sugestão de Módulo

O Aprendiz monitora sinais de uso e dispara sugestões contextuais:

| Sinal Detectado | Sugestão |

|-----------------|----------|

| >200 vendas/mês registradas | "Você já tem volume para controlar seu fluxo de caixa. Quer ativar?" |

| Cliente tenta emitir nota e não tem o módulo | "Para emitir notas, ative o módulo Fiscal. R$ 40/mês." |

| 3+ vendedores cadastrados sem comissão | "Posso calcular comissões automaticamente. Quer configurar?" |

| Usuário abre relatório >5x/semana | "Quer um painel automático com esses dados todo dia?" |

### 7.5 Arquitetura do Aprendiz

```

Cliente (linguagem natural)

       ↓

 Parser de Intenção (LLM via API)

       ↓

 Validador de Regra (confirma com o usuário)

       ↓

 Compilador de Automação (converte em job estruturado)

       ↓

 Runtime de Execução (fila de jobs — BullMQ + Redis)

       ↓

 Monitor de Resultado (confirma execução, loga, aprende)

```

### 7.6 Escopo do Aprendiz no MVP (Fase 1)

| Camada | MVP Fase 1 |
|--------|------------|
| 1 — Instrução | Sim: interface + **templates fixos** (estoque baixo, desconto na venda) |
| 2 — Execução | Sim: regras compiladas simples; fila BullMQ para jobs adiados |
| 3 — Proativa | Mínimo: gatilhos hardcoded (sem LLM em todo fluxo) |

Parser LLM: **feature flag**; criação de regra pode começar só por template. LLM concentrado na criação/edição de regras customizadas pós-MVP.

---

## 8. Arquitetura Técnica

### 8.1 Stack

| Camada | Tecnologia | Justificativa |

|--------|-----------|---------------|

| Frontend | **Next.js 16.2.6** (App Router) + **shadcn/ui** | Blocks `login-01` e `dashboard-01`; RSC; layout desktop-first responsivo |

| API | **tRPC** + Route Handlers | Type-safety ponta a ponta; webhooks em Route Handlers |

| UI Kit | shadcn/ui + Tailwind | Componentes em `apps/web/components/ui`; sem override de tokens |

| Banco | **PostgreSQL 16** (imagem Docker oficial) | JSONB, schema por tenant; dev: host `localhost`, porta **5454** |

| Dev DB | Docker Compose em `infra/docker/` | `docker compose up -d`; volume persistente; ver §8.1.1 |

| Cache | Redis | Sessões, jobs, cache de queries quentes |

| Fila | BullMQ | Jobs do Aprendiz, emissão fiscal assíncrona |

| Auth | NextAuth v5 | Multi-tenant, RBAC por módulo |

| Storage | S3-compatible | Documentos fiscais, uploads |

| Deploy | Vercel + Railway (DB prod) | Desenvolvimento local: PostgreSQL no Docker (§8.1.1) |

### 8.1.1 Ambiente de desenvolvimento — Docker PostgreSQL

Banco local **obrigatório** via Docker (não usar PostgreSQL instalado no host como padrão do time).

| Parâmetro | Valor |
|-----------|--------|
| Imagem | `postgres:16-alpine` |
| Porta no host | **5454** (mapeamento `5454:5432`) |
| Arquivos | `infra/docker/docker-compose.yml` |
| Database | `boilerplate` |
| Usuário / senha (dev) | `boilerplate` / `boilerplate` |

**Comandos:**

```bash
cd infra/docker
docker compose up -d
docker compose ps
```

**URL de conexão (apps e Prisma):**

```
DATABASE_URL=postgresql://boilerplate:boilerplate@localhost:5454/boilerplate
```

Copiar `.env.example` na raiz do monorepo para `.env.local` (nunca commitar segredos reais).

**Versão Next.js:** fixar em **16.2.6** no `package.json` de `apps/web` e `apps/platform-admin` (`"next": "16.2.6"`). Upgrades de patch/minor alinhados em PR explícito.

### 8.1.2 Toolchain — Bun (monorepo)

**Decisão:** usar **Bun** como runtime e gerenciador de pacotes do monorepo. **Não** usar pnpm nem npm no dia a dia do projeto (CI pode usar `bun install --frozen-lockfile`).

| Uso | Comando |
|-----|---------|
| Instalar dependências | `bun install` (raiz do monorepo) |
| Dev (Turborepo) | `bun run dev` |
| Build | `bun run build` |
| Executar binário | `bunx <pkg>` (ex.: shadcn, prisma) |
| Script em pacote | `bun run --filter @boilerplate/web dev` |

**Arquivos:**

| Arquivo | Função |
|---------|--------|
| `package.json` (raiz) | `"workspaces": ["apps/*", "packages/*"]` |
| `bun.lock` | Lockfile (commitar) |
| `bunfig.toml` | Opcional: registry, install settings |

**Compatibilidade:**

- Turborepo: suportado (`turbo run dev` via `bun run dev`).
- Next.js 16.2.6: suportado (`bun run dev` em `apps/web`).
- Prisma: `bunx prisma migrate dev`, client gerado normalmente.
- shadcn CLI: `bunx --bun shadcn@latest init` e `bunx --bun shadcn@latest add login-01 dashboard-01`.

**Instalação (Windows):** `powershell -c "irm bun.sh/install.ps1 | iex"` — ver [README.md](README.md).

### 8.2 Multi-tenancy

Estratégia: **schema por tenant** no PostgreSQL.

```sql

-- Cada empresa tem seu schema isolado

CREATE SCHEMA tenant_abc123;

-- Tabelas replicadas por schema

CREATE TABLE tenant_abc123.vendas (

 id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

 cliente_id  UUID REFERENCES tenant_abc123.clientes(id),

 total       NUMERIC(12,2) NOT NULL,

 status      TEXT NOT NULL,

 created_at  TIMESTAMPTZ DEFAULT now()

);

```

**Vantagens:** isolamento total de dados, backup por cliente, queries sem filtro de tenant_id, migração de fase sem risco cross-tenant.

**Metadados da organização (schema `boilerplate`):**

```sql
ALTER TABLE organizations ADD COLUMN phase SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE organizations ADD COLUMN tipo_negocio TEXT NOT NULL;  -- enum §5.5
ALTER TABLE organizations ADD COLUMN segmento_atuacao TEXT;
ALTER TABLE organizations ADD COLUMN has_cnpj BOOLEAN;
ALTER TABLE organizations ADD COLUMN cnpj TEXT;
ALTER TABLE organizations ADD COLUMN fiscal_ready BOOLEAN DEFAULT false;
```

Dados de **CRM/comunicação da plataforma** ficam apenas em `public` — nunca no schema do tenant.

### 8.3 Modularização — Contrato de Módulo

Cada módulo é um pacote independente que segue este contrato:

```typescript

// types/module.ts

interface ModuleDefinition {

 id: string;                        // ex: 'fin-fluxo-caixa'

 name: string;

 faseMinima: 1 | 2 | 3 | 4;

 dependencias: string[];            // módulos que devem estar ativos

 // Banco de dados

 migrations: MigrationFile[];       // migrations do módulo

 seeds?: SeedFile[];

 // Interface

 routes: RouteDefinition[];         // páginas que o módulo adiciona

 navItems: NavItem[];               // itens de menu que o módulo adiciona

 widgets?: DashboardWidget[];       // cards no dashboard principal

 // Aprendiz

 automacoes: AutomacaoTemplate[];   // templates disponíveis para o Aprendiz

 gatilhos: GatilhoDefinition[];     // sinais que este módulo emite

 // Integração entre módulos (ver §8.9)

 eventosPublicados?: DomainEventType[];

 eventosConsumidos?: Partial<Record<DomainEventType, string>>; // handler name

 // Integradores externos (ver §8.7)

 integradores?: IntegratorBinding[];  // quais integradores este módulo usa/expõe

 // Hierarquia (módulos pai ↔ sub-módulos — §9)

 parentModuleId?: string;             // ex: 'fiscal-core', 'fiscal-contabil'

 submodulos?: string[];                // apenas em módulos pai; filhos registrados

 // Fiscal — sub-módulos de capacidade (§9)

 fiscalCapability?: FiscalCapability; // ex: 'nfce', 'cte' — registra no fiscal-core

 tiposNegocioElegiveis?: TipoNegocio[]; // filtro soft na recomendação; hard na ativação opcional

 implementationStatus?: 'scaffold' | 'implemented' | 'deprecated';

}

```

### 8.4 Estrutura de Pastas

```

/

├── apps/

│   ├── web/                        # App do tenant (clientes do negócio)

│   └── platform-admin/             # Painel interno — CRM, comunicação, analytics (§17)

│       ├── app/

│       │   ├── (auth)/             # login-01, registro, onboarding + CNPJ

│       │   ├── (dashboard)/        # dashboard-01 + nav dinâmico

│       │   │   ├── layout.tsx      # shell sidebar (dashboard-01)

│       │   │   └── [modulo]/       # rotas dinâmicas por módulo

│       │   └── api/

│       │       ├── trpc/

│       │       └── webhooks/

│       └── modules/                # cada módulo é uma pasta aqui

│           ├── core-catalogo/      # produto/serviço evolutivo

│           ├── core-vendas/

│           ├── core-clientes/

│           ├── core-estoque-basico/

│           ├── core-ranking/

│           ├── fiscal-core/        # módulo pai fiscal

│           ├── fiscal-nfce/        # sub-módulos (scaffold MVP → implemented)

│           ├── fiscal-nfe/

│           ├── fiscal-cte/

│           ├── fiscal-mdfe/

│           ├── fiscal-ciot/

│           ├── fiscal-sped/

│           ├── fiscal-contabil/    # módulo pai contábil (usa fiscal-sped)

│           ├── fiscal-rural/       # planejado — produtor_rural

│           └── aprendiz/

│   └── platform-admin/             # módulos só schema global

│       └── modules/

│           ├── platform-crm/

│           ├── platform-comms/

│           └── platform-insights/

│

├── packages/

│   ├── db/                         # Prisma + schemas global + tenant

│   ├── module-registry/            # registry + ativarModulo

│   ├── integrators/                # hub de integradores (ver §8.7)

│   ├── billing/                    # PricingEngine + PaymentGatewayAdapter

│   ├── aprendiz-engine/

│   ├── fiscal-engine/              # FiscalAdapter plugável

│   └── shared/                     # types, event-bus, i18n pt-BR

│

└── infra/

   ├── migrations/global/          # schema público (tenants, planos)

   └── scripts/

```

### 8.5 Registry de Módulos

```typescript

// packages/module-registry/index.ts

import { coreVendas }      from '@/modules/core-vendas/module';

import { coreClientes }    from '@/modules/core-clientes/module';

import { finFluxoCaixa }   from '@/modules/fin-fluxo-caixa/module';

import { fiscalCore }      from '@/modules/fiscal-core/module';
import { fiscalNfce }      from '@/modules/fiscal-nfce/module';
import { fiscalCte }       from '@/modules/fiscal-cte/module';
// ... demais fiscal-*

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
 'core-vendas':       coreVendas,
 'fiscal-core':       fiscalCore,
 'fiscal-nfce':       fiscalNfce,
 'fiscal-cte':        fiscalCte,
 // ...
};

// Pacotes fiscais por tipo (usado por recomendarModulos)
export const PACOTES_FISCAL_POR_TIPO: Partial<Record<TipoNegocio, string[]>> = {
  varejo: ['fiscal-nfce', 'fiscal-sped'],
  transportadora: ['fiscal-cte', 'fiscal-mdfe', 'fiscal-ciot'],
};

// Ativação de módulo (roda na compra/upgrade)

export async function ativarModulo(tenantId: string, moduloId: string) {

 const modulo = MODULE_REGISTRY[moduloId];

 // 1. Valida dependências (+ parentModuleId: ex. fiscal-core antes de fiscal-cte)

 const ativas = await getModulosAtivos(tenantId);

 for (const dep of modulo.dependencias) {

   if (!ativas.includes(dep)) throw new Error(`Dependência não atendida: ${dep}`);

 }

 if (modulo.parentModuleId && !ativas.includes(modulo.parentModuleId)) {

   await ativarModulo(tenantId, modulo.parentModuleId); // ou erro, conforme política

 }

 // 2. Roda migrations do módulo no schema do tenant

 await runMigrations(tenantId, modulo.migrations);

 // 3. Registra módulo como ativo

 await db.modulosAtivos.create({ tenantId, moduloId, ativadoEm: new Date() });

 // 4. Invalida cache de nav e dashboard

 await cache.del(`nav:${tenantId}`);

 await cache.del(`dashboard:${tenantId}`);

 // 5. Se sub-módulo fiscal: registrar fiscalCapability no fiscal-core

 if (modulo.fiscalCapability) {

   await registerFiscalCapability(tenantId, modulo.fiscalCapability);

 }

}

```

### 8.6 Nav Dinâmico

```typescript

// app/(dashboard)/layout.tsx

async function getNavItems(tenantId: string): Promise<NavItem[]> {

 const modulosAtivos = await getModulosAtivos(tenantId); // cached

 return modulosAtivos

   .flatMap(id => MODULE_REGISTRY[id].navItems)

   .sort((a, b) => a.ordem - b.ordem);

}

export default async function DashboardLayout({ children }) {

 const { tenantId } = await auth();

 const navItems = await getNavItems(tenantId);

 return (

   <div>

     <Sidebar items={navItems} />

     <main>{children}</main>

   </div>

 );

 }

```

Filtrar `navItems` também por **setor** (`sectorId`) e permissões do módulo.

### 8.7 Integradores — Hub de Serviços Externos

**Responsabilidade:** camada única entre **módulos de negócio** e **serviços externos** (pagamento, fiscal, mensageria, e-commerce, contabilidade, etc.). Os módulos **não chamam APIs externas diretamente** — declaram dependência de um integrador; o integrador implementa o protocolo e publica resultados para o bus de eventos.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Módulo A   │────▶│   Integrator     │────▶│  Serviço externo    │
│ (core-vendas)│     │  (ex: payments)  │     │  (Stripe, Asaas…)   │
└─────────────┘     └────────┬─────────┘     └─────────────────────┘
                             │
┌─────────────┐              │ eventos normalizados
│  Módulo B   │◀─────────────┘
│ (fin-caixa) │
└─────────────┘
```

**Tipos de integrador:**

| Tipo | Exemplos | Pacote |
|------|----------|--------|
| `payment` | Stripe, Asaas, Mercado Pago | `packages/integrators/payment/` |
| `fiscal` | Focus NFe, NFE.io (futuro) | `packages/integrators/fiscal/` → delega `fiscal-engine` |
| `messaging` | WhatsApp, Telegram, e-mail, SMS | `packages/integrators/messaging/` |
| `social` | Meta/WhatsApp Business API, Telegram Bot API | `packages/integrators/social/` (usado por `platform-comms`) |
| `webhook` | Entrada/saída genérica | `packages/integrators/webhook/` |

**Contrato (`IntegratorDefinition`):**

```typescript
interface IntegratorDefinition {
  id: string;                              // ex: 'payment-stripe'
  tipo: 'payment' | 'fiscal' | 'messaging' | 'webhook' | 'custom';
  modulosSuportados: string[];             // módulos que podem registrar bindings
  conectar(tenantId: string, credenciais: unknown): Promise<void>;
  desconectar(tenantId: string): Promise<void>;
  healthCheck(tenantId: string): Promise<IntegratorHealth>;
  // handlers inbound (webhook do provedor → evento de domínio)
  onWebhook?(payload: unknown): Promise<DomainEvent[]>;
}
```

**Registry:** `INTEGRATOR_REGISTRY` em `packages/integrators`, análogo ao `MODULE_REGISTRY`. Configuração por tenant em schema global: `tenant_integrators (tenant_id, integrator_id, config_encrypted, ativo)`.

**Interconexão entre módulos via integrador:** quando um serviço externo dispara mudança (ex.: pagamento confirmado), o integrador normaliza para evento `pagamento.confirmado`; módulos inscritos reagem sem conhecer o provedor.

**MVP:** integrador `payment-mock` + estrutura `fiscal-noop`; um gateway real (ex.: Asaas) na primeira entrega de cobrança.

### 8.8 Entidades Core (decisão de dados)

Agregados compartilhados no schema do tenant — **módulos estendem, não duplicam**:

| Entidade | Módulo dono | Regras |
|----------|-------------|--------|
| `Cliente` | `core-clientes` | Referenciado por vendas, ranking, Aprendiz |
| `Category` | `core-catalogo` | Árvore `catalog_categories` (categoria + subcategoria no MVP); ver §13.3 |
| `Item` | `core-catalogo` | `tipo: 'produto' \| 'servico'`; `category_id` opcional; serviço sem estoque obrigatório |
| `Supplier` | `ops-compras` | Cadastro de quem **abastece** o estoque; distinto de tipo negócio `fornecedor` (§13.4) |
| `PurchaseOrder` | `ops-compras` | OC com linhas; estados §13.5; agrupamento por fornecedor |
| `Venda`, `VendaItem` | `core-vendas` | Fonte de verdade comercial |

**Evolução por fase (UI única, campos desbloqueados):**

| Fase | Campos adicionais (exemplo) |
|------|----------------------------|
| 1 | nome, tipo, preço, unidade, estoque opcional |
| 2+ | SKU, custo, `category_id` (árvore §13.3), fornecedores e OC (`ops-compras`) |
| 3+ | NCM, CFOP (placeholders via `fiscal-core`) |
| 4+ | variações, vínculo multi-loja (módulos `ops-*`) |

Extensões de segmento (grade, validade) = tabelas 1:N em módulos futuros referenciando `item_id`.

### 8.9 Eventos de Domínio (comunicação entre módulos)

**Contrato:** cada módulo declara `eventosPublicados` e `eventosConsumidos`.

**Implementação em camadas:**

| Estágio | Comportamento |
|---------|----------------|
| MVP crítico | Transação única (ex.: `venda.confirmada` → baixa estoque no mesmo request) |
| MVP geral | Bus in-process + tabela `domain_events` (auditoria) |
| Pós-MVP | BullMQ para handlers assíncronos e integradores |

**Eventos Fase 1 (mínimo):** `venda.confirmada`, `venda.cancelada`, `estoque.baixo`, `cliente.criado`, `item.criado`.

**Eventos Compras (P2+, `ops-compras`):** `ordem_compra.criada`, `ordem_compra.enviada`, `compra.recebida`, `estoque.reposicao_sugerida` (geração automática a partir de estoque baixo — §13.5).

**Offline (PWA):** operações enfileiradas no cliente; replay na API com **idempotency key**; integradores e módulos processam após sync.

### 8.10 Interface — shadcn/ui

| Área | Block / padrão | Observação |
|------|----------------|------------|
| Login / registro | **`login-01`** | `app/(auth)/`; NextAuth callbacks |
| Dashboard shell | **`dashboard-01`** | Sidebar + header + área de conteúdo; nav injetado pelo registry |
| Módulos | Cards, Table, Form (`Field` + `FieldGroup`) | Compor sobre primitivos shadcn; sem CSS ad hoc em componentes base |

**Instalação (referência):**

```bash
cd apps/web
bunx --bun shadcn@latest init
bunx --bun shadcn@latest add login-01 dashboard-01
```

Conteúdo dos módulos renderiza dentro do slot `<main>` do `dashboard-01`. Widgets do dashboard = `DashboardWidget[]` do registry.

### 8.11 PWA e Offline

- Service Worker: cache de shell + assets estáticos
- IndexedDB: fila `offline_queue` (vendas, clientes)
- Sync ao reconectar: tRPC mutations com `Idempotency-Key`
- Conflito MVP: última escrita vence; log em `domain_events` para suporte

### 8.12 Catálogo global de produto (roadmap)

Schema `boilerplate` — gestão de setores, módulos, segmentos e profundidade. Populado por `bun run db:seed-roadmap` (ver `packages/db/scripts/seed-product-roadmap.ts`).

| Tabela | Função |
|--------|--------|
| `core_sectors` | Setores universais (slug, camada, presença) |
| `core_modules_catalog` | Módulos produto + referências de mercado; `depth_current`, `depth_target`, `implementation_status`, `delivery_marco`, `sector_slug` |
| `market_segments` | 40 segmentos do estudo de mercado |
| `segment_sector_modules` | Matriz segmento × setor × módulos de mercado |
| `segment_vital_modules` | Módulos vitais por segmento |
| `module_depth_changelog` | Histórico de evolução de profundidade (público/interno) |

**`ModuleDefinition` (registry)** — campos adicionais planejados: `sectorSlug`, `camada`, `depthCurrent`, `depthTarget`, `depthTargetMarco`. Sincronização `syncRegistryToCatalog()` evita drift código ↔ catálogo.

**Tenant `sectors`:** campo opcional `core_sector_slug` vincula instância ao template do setor core.

---

## 9. Domínio Fiscal Modular

O fiscal **não é um módulo monolítico**. É um **domínio em árvore**: módulo pai **`fiscal-core`** + **sub-módulos instaláveis** (uma capacidade documental cada). O **tipo de negócio** e a **fase** definem o pacote recomendado; a **ativação** segue o mesmo `ativarModulo()` do registry (§8.5).

**Regras:**

- Sub-módulos **nunca** chamam SEFAZ diretamente → `packages/fiscal-engine` via integrador `fiscal-*` (§8.7).
- Módulos operacionais (`core-vendas`, `ops-romaneio`) **publicam eventos**; sub-módulos fiscais **consomem** e emitem documentos.
- **MVP:** todos os `fiscal-*` existem como **scaffold** (`implementationStatus: 'scaffold'`), UI placeholder, migrations mínimas, **sem emissão** (`NoopFiscalAdapter`).

### 9.1 Hierarquia de módulos fiscais

```
fiscal-core                    ← pai obrigatório de qualquer capacidade fiscal
├── fiscal-nfce                ← capacidade: NFC-e (varejo)
├── fiscal-nfe                 ← capacidade: NF-e mercadoria B2B
├── fiscal-cte                 ← capacidade: CT-e (transporte)
├── fiscal-mdfe                ← capacidade: MDF-e (manifesto — ver §9.6)
├── fiscal-ciot                ← capacidade: CIOT (frete ANTT)
├── fiscal-sped                ← capacidade: SPED (obrigações acessórias)
├── fiscal-rural               ← capacidade: NF produtor / NFA-e (planejado)
└── fiscal-contabil            ← módulo pai contábil (futuro)
    └── (usa) fiscal-sped      ← mesma implementação SPED; não duplicar geração
```

| Camada | ID | Papel |
|--------|-----|--------|
| Pai fiscal | `fiscal-core` | Certificado A1, ambiente homolog/prod, séries, numeração, fila, registry de capabilities, menu **Fiscal**, persistência comum de documentos |
| Sub-módulo capacidade | `fiscal-{capability}` | Telas, migrations (`cte_*`, `nfce_*`), permissões, eventos, integração com operação |
| Pai contábil | `fiscal-contabil` | Plano de contas, lançamentos, fechamento (futuro); **depende de** `fiscal-sped` |
| Engine | `packages/fiscal-engine` | `FiscalAdapter` — métodos por tipo de documento |
| Integrador | `integrators/fiscal-*` | Provedor externo (Focus NFe, NFE.io…) |

### 9.2 Capacidades (`FiscalCapability`)

```typescript
type FiscalCapability =
  | 'nfce'
  | 'nfe'
  | 'cte'
  | 'mdfe'
  | 'ciot'
  | 'sped'
  | 'rural'
  | 'nfse';  // futuro — prestador_servicos

// fiscal-core mantém o que está ativo no tenant
async function getActiveFiscalCapabilities(tenantId: string): Promise<FiscalCapability[]>

// Ativar sub-módulo registra capability + roda migrations
// ex: ativarModulo('fiscal-cte') → capabilities += 'cte'
```

Cada sub-módulo declara no `module.ts`:

```typescript
{
  id: 'fiscal-cte',
  parentModuleId: 'fiscal-core',
  fiscalCapability: 'cte',
  dependencias: ['fiscal-core', 'ops-romaneio'], // ou core-vendas conforme fluxo
  faseMinima: 2,
  tiposNegocioElegiveis: ['transportadora'],
  implementationStatus: 'scaffold', // MVP
}
```

**Nav:** menu **Fiscal** (pai) exibe **somente** subitens das capabilities ativas (NFC-e, CT-e, SPED…). Varejo não vê CT-e; transportadora não vê NFC-e (salvo add-on explícito).

### 9.3 Matriz tipo de negócio × sub-módulos fiscais

Recomendação na ativação pós-diagnóstico (§6.4). Add-ons podem ativar fora do pacote.

| `tipo_negocio` | Sub-módulos fiscais recomendados (por fase) |
|----------------|---------------------------------------------|
| `pessoa_fisica` | Fase 3+: `fiscal-nfse` (futuro) se CNPJ; senão nenhum até `fiscal_ready` |
| `varejo` | Fase 3: `fiscal-nfce`; B2B opcional: `fiscal-nfe`; obrigação: `fiscal-sped` |
| `atacado` | Fase 2–3: `fiscal-nfe`; Fase 3+: `fiscal-sped` |
| `fornecedor` | Fase 3: `fiscal-nfe` + `fiscal-sped` |
| `distribuidor` | Fase 3: `fiscal-nfe` (+ `fiscal-nfce` se PDV); `fiscal-sped` |
| `transportadora` | Fase 2: `fiscal-cte`, `fiscal-ciot`; Fase 2–3: `fiscal-mdfe` (§9.6); **sem** `fiscal-nfce` |
| `fabricante` | Fase 3: `fiscal-nfe` + `fiscal-sped` |
| `industria` | Fase 3: `fiscal-nfe` + `fiscal-sped` |
| `produtor_rural` | Fase 3: `fiscal-rural` + `fiscal-sped` (blocos aplicáveis) |

**Pacotes comerciais (exemplo billing §12):**

| Bundle | Sub-módulos incluídos |
|--------|------------------------|
| Varejo Fiscal | `fiscal-nfce` + `fiscal-sped` (+ `fiscal-nfe` opcional) |
| Transporte Fiscal | `fiscal-cte` + `fiscal-mdfe` + `fiscal-ciot` |
| Indústria Fiscal | `fiscal-nfe` + `fiscal-sped` |

### 9.4 `fiscal-sped` e `fiscal-contabil`

| Módulo | Escopo |
|--------|--------|
| **`fiscal-sped`** | Geração de obrigações SPED (Fiscal, Contribuições, blocos conforme escopo); job por **competência**; lê documentos já autorizados nos sub-módulos de emissão |
| **`fiscal-contabil`** | Domínio contábil (plano de contas, lançamentos, fechamento — **futuro**); **`dependencias: ['fiscal-core', 'fiscal-sped']`** |

**Dois caminhos de ativação do SPED (mesma implementação):**

1. **Varejo / atacado** — ativa `fiscal-sped` diretamente (sem `fiscal-contabil`).
2. **Contabilidade completa** — ativa `fiscal-contabil`, que **reutiliza** APIs/eventos de `fiscal-sped` (não duplicar gerador de arquivo).

### 9.5 CT-e e MDF-e — dependência jurídica (em estudo)

| Decisão técnica atual | Decisão jurídica |
|----------------------|------------------|
| `fiscal-cte` e `fiscal-mdfe` são **sub-módulos irmãos** sob `fiscal-core` | **TBD:** obrigatoriedade de MDF-e vinculado a CT-e em viagem de carga |
| Ativação independente permitida no código até conclusão do estudo | Pode virar `dependencias: ['fiscal-cte']` em `fiscal-mdfe` ou apenas recomendação soft na matriz |

**Ação:** documento jurídico/técnico (ANTT + SEFAZ) → atualizar `fiscal-mdfe/module.ts` e §9.3.

### 9.6 Disparo a partir da operação (eventos)

| Sub-módulo | Evento origem típico | Documento |
|------------|---------------------|-----------|
| `fiscal-nfce` | `venda.confirmada` (balcão) | NFC-e |
| `fiscal-nfe` | `pedido.faturado` / `venda.confirmada` B2B | NF-e |
| `fiscal-cte` | `romaneio.fechado` / `viagem.criada` | CT-e |
| `fiscal-mdfe` | `viagem.encerrada` (vários CT-e) | MDF-e |
| `fiscal-ciot` | `contrato.frete.fechado` | CIOT |
| `fiscal-sped` | `competencia.fechada` (job mensal) | Arquivos SPED |

Pipeline único para emissão em tempo real:

```
Evento de domínio
     ↓
Sub-módulo fiscal-* (valida capability ativa)
     ↓
Job BullMQ — resposta imediata ao usuário
     ↓
FiscalAdapter via integrador fiscal-*
     ↓
SEFAZ / provedor → XML/PDF em storage
     ↓
Evento fiscal.documento.autorizado + SSE
```

### 9.7 `FiscalAdapter` e integradores

```typescript
// packages/fiscal-engine/types.ts
interface FiscalAdapter {
  emitirNFCe(dados: DadosNFCe): Promise<ResultadoEmissao>;
  emitirNFe(dados: DadosNFe): Promise<ResultadoEmissao>;
  emitirCTe(dados: DadosCTe): Promise<ResultadoEmissao>;
  emitirMDFe(dados: DadosMDFe): Promise<ResultadoEmissao>;
  emitirCIOT(dados: DadosCIOT): Promise<ResultadoEmissao>;
  cancelar(tipo: FiscalCapability, chave: string): Promise<void>;
  consultar(tipo: FiscalCapability, chave: string): Promise<StatusDocumento>;
  gerarSped?(competencia: Competencia, blocos: SpedBloco[]): Promise<ArquivoSped>;
}

class NoopFiscalAdapter implements FiscalAdapter { /* MVP — retorna não implementado */ }
class FocusNFeAdapter implements FiscalAdapter { /* métodos conforme homologação por capability */ }
```

- Provedor pode não suportar todas as capabilities → integrador expõe `capabilitiesSuportadas: FiscalCapability[]`.
- Sub-módulo verifica suporte antes de enfileirar emissão.

> **Provedor:** avaliação Focus NFe, NFE.io, Bling — escolha por capability, não um único fornecedor obrigatório para todos os documentos.

### 9.8 MVP — scaffold de cada `fiscal-*`

| Entregável | Conteúdo |
|------------|----------|
| `fiscal-core` | Implementado: config, registry, menu shell, `NoopFiscalAdapter` |
| Cada `fiscal-nfce` … `fiscal-ciot`, `fiscal-sped`, `fiscal-contabil`, `fiscal-rural` | `module.ts` + pasta `migrations/` stub + rota “Em breve” + `implementationStatus: 'scaffold'` |
| Ativação em tenant | Permitida para testar nav, matriz §9.3 e pricing; emissão retorna erro controlado |
| Homologação | Por sub-módulo: `scaffold` → `implemented` quando adapter + SEFAZ validados |

**Checklist scaffold (por sub-módulo):**

- [ ] `ModuleDefinition` com `parentModuleId: 'fiscal-core'`
- [ ] `fiscalCapability` correspondente
- [ ] Entrada em `MODULE_REGISTRY` e `PACOTES_FISCAL_POR_TIPO`
- [ ] Preço na `PricingEngine` (§12.2)
- [ ] Permissões RBAC: `fiscal-{cap}.emitir`, `fiscal-{cap}.cancelar`

---

## 10. Performance

### 10.1 Princípios

- **Zero JS desnecessário no cliente** — RSC (React Server Components) para tudo que não precisa de interatividade

- **Queries paginadas sempre** — nenhuma listagem sem cursor-based pagination

- **Cache em camadas** — Redis para dados quentes, `unstable_cache` do Next.js para dados de servidor

- **Índices por padrão de acesso** — definidos no contrato do módulo, não como afterthought

### 10.2 Padrão de Query

```typescript

// Todas as queries do módulo seguem este padrão

export async function getVendas(

 tenantId: string,

 { cursor, limit = 50, filtros }: QueryParams

) {

 return db.query(sql`

   SELECT v.*, c.nome as cliente_nome

   FROM ${schema(tenantId)}.vendas v

   LEFT JOIN ${schema(tenantId)}.clientes c ON c.id = v.cliente_id

   WHERE v.created_at < ${cursor ?? 'now()'}

     AND (${filtros.status}::text IS NULL OR v.status = ${filtros.status})

   ORDER BY v.created_at DESC

   LIMIT ${limit + 1}

 `);

}

```

### 10.3 Índices Obrigatórios por Módulo

Cada módulo declara seus índices no `module.ts`:

```typescript

indexes: [

 { table: 'vendas', columns: ['created_at DESC'] },

 { table: 'vendas', columns: ['cliente_id', 'created_at DESC'] },

 { table: 'vendas', columns: ['status', 'created_at DESC'] },

]

```

---

## 11. RBAC — Controle de Acesso

Permissões são definidas por módulo, não pelo sistema central.

```typescript

// Papéis globais

type Papel = 'dono' | 'gerente' | 'vendedor' | 'financeiro' | 'aprendiz_viewer';

// Cada módulo declara suas permissões

permissions: {

 'fin-fluxo-caixa': {

   ver:    ['dono', 'gerente', 'financeiro'],

   editar: ['dono', 'financeiro'],

   fechar: ['dono'],

 },

 'core-vendas': {

   ver:     ['dono', 'gerente', 'vendedor'],

   registrar: ['dono', 'gerente', 'vendedor'],

   cancelar:  ['dono', 'gerente'],

 }

}

```

---

## 12. Modelo de Negócio

### 12.0 Central de Precificação e Gateways

**`packages/billing`** concentra precificação e pagamentos — separado dos módulos de negócio (via **integradores** `payment-*`).

```typescript
// PricingEngine — schema global
interface PrecoModulo {
  moduleId: string;
  faseMinima: 1 | 2 | 3 | 4;
  precoMensalCentavos: number;
  incluidoNoPlano?: string[];  // planos que já incluem
}

// Cálculo: plano base da fase + soma dos add-ons ativos
function calcularMensalidade(tenantId: string): Promise<ResumoCobranca>;

// PaymentGatewayAdapter (registrado como integrador)
interface PaymentGatewayAdapter {
  criarAssinatura(tenantId: string, itens: ResumoCobranca): Promise<SubscriptionRef>;
  cancelar(subscriptionId: string): Promise<void>;
  // webhooks → integrator onWebhook → domain events
}
```

**MVP:** tabela de preços por **fase P**/módulo + `payment-mock`; primeiro gateway real (ex.: Asaas) via `INTEGRATOR_REGISTRY`.

**Profundidade D e estágio E:** não alteram preço no MVP; alimentam `/evolucao` (tenant) e argumentação comercial (CSM). Upsell futuro pode considerar add-ons quando módulo atinge D alvo.

### 12.1 Planos Base

| Plano | Preço | Fase | Módulos Incluídos |

|-------|-------|------|-------------------|

| Essencial | R$ 49/mês | 1–2 | core-catalogo, core-clientes, core-vendas, core-estoque-basico, core-ranking |

| Profissional | R$ 129/mês | 3 | Essencial + fin-fluxo-caixa + bundle **Varejo Fiscal** (`fiscal-nfce` + `fiscal-sped`) + ops-vendedores, rh-comissoes |

| Escala | R$ 299/mês | 4 | Profissional + ops-multi-loja, bi-dashboards, api-parceiros |

### 12.2 Módulos e sub-módulos avulsos (Add-ons)

Cobrança por **ID de módulo** (inclui sub-módulos fiscais). Bundles descontam conjuntos (§9.3).

| Módulo / sub-módulo | Preço (ex.) |

|---------------------|-------------|

| `fiscal-nfce` | R$ 35/mês |

| `fiscal-nfe` | R$ 40/mês |

| `fiscal-cte` | R$ 45/mês |

| `fiscal-mdfe` | R$ 25/mês |

| `fiscal-ciot` | R$ 20/mês |

| `fiscal-sped` | R$ 30/mês |

| Bundle **Transporte Fiscal** (`cte`+`mdfe`+`ciot`) | R$ 89/mês |

| Bundle **Varejo Fiscal** (`nfce`+`sped`) | R$ 55/mês |

| `fiscal-contabil` | sob consulta |

| `aprendiz-pro` | R$ 59/mês |

| `white-label` | sob consulta |

| `api-parceiros` | R$ 79/mês |

### 12.3 Trial

- 14 dias grátis, fase 2 completa, sem cartão

- Ao final, diagnóstico recalculado e plano sugerido automaticamente

---

## 13. Catálogo — Grade Genérica e Refinamentos

### 13.1 MVP — Grade genérica + tipo de negócio

O cadastro usa **`core-catalogo`** único; **tipo de negócio** (§5.5) define quais campos e módulos aparecem:

| Tipo | Comportamento catálogo Fase 1 |
|------|------------------------------|
| `pessoa_fisica` | Produto/serviço; estoque opcional |
| `varejo` | Unidade, preço, estoque |
| `atacado` | Embalagem, preço tabela (campo simples até módulo dedicado) |
| `fornecedor` | SKU, prazo de entrega |
| `distribuidor` | Multi-unidade de medida (futuro) |
| `transportadora` | Tipo de serviço (frete, coleta, entrega); rota, peso/volume, tabela por eixo/km |
| `fabricante` | Produto acabado, insumo, lote de fabricação |
| `industria` | Insumo, semiacabado, acabado (futuro BOM) |
| `produtor_rural` | Cultura, safra, rebanho, gleba, quantidade por hectare/cabeça |

`segmentoAtuacao` (moda, alimentação, agro…) refina ícones e templates do Aprendiz, não substitui `tipoNegocio`.

### 13.2 Extensões por segmento de atuação (pós-MVP)

| Segmento atuação | Módulos de extensão |
|-----------------|---------------------|
| Moda & vestuário | `ops-grade-produto` |
| Alimentação | `ops-validade`, `ops-ficha-tecnica` |
| Agro | `ops-safra-rebanho`, `ops-gleba` (alinha a `produtor_rural`) |

> Extensões referenciam `item_id`; elegibilidade cruzada com matriz §6.4.

### 13.3 Categorias hierárquicas (extensão `core-catalogo`)

- Tabela tenant `catalog_categories`: `id`, `parent_id` (nullable), `name`, `slug`, `sort_order`, `active`.
- **MVP:** profundidade máxima **2 níveis** (categoria raiz + subcategoria); expansão futura via `parent_id` sem migração destrutiva.
- `catalog_items.category_id` — FK opcional; serviços podem permanecer sem categoria.
- **UI:** painel em árvore (filtro) + tabela de itens; CRUD de categorias; mover item entre categorias no formulário.
- **P1:** categorias opcionais; **P2+:** recomendado em missões de primeiros passos.

### 13.4 Fornecedores e abastecimento por categoria (`ops-compras`)

Entidade **`Supplier`** (cadastro separado de `core-clientes`):

| Campo | Uso |
|-------|-----|
| `name`, `document`, `email`, `phone` | Identificação |
| `lead_time_days` | Prazo médio de entrega |
| `notes`, `active` | Operação |

Relação N:N **`supplier_categories`** (`supplier_id`, `category_id`, `is_default`):

- Fornecedor pode abastecer subcategorias (folhas) diretamente.
- Vínculo na **categoria pai** implica abastecimento de **todas** as subcategorias filhas (herança na resolução de OC automática).
- Por categoria, no máximo um fornecedor `is_default` para desempate na geração automática.

### 13.5 Ordens de compra (`ops-compras`)

**Módulo:** `ops-compras` — setor `operacao`, `faseMinima: 2`, depende de `core-catalogo` + `core-estoque-basico`. Elegível para tipos com controle de estoque (§5.5).

**Estados da OC:** `rascunho` → `enviada` → `parcial` → `recebida` → `cancelada`.

**Linhas (`purchase_order_lines`):** `catalog_item_id`, `quantity`, `unit_cost_cents` (opcional no rascunho), `notes`.

**Fluxo automático (MVP):**

1. Usuário aciona **Gerar compra** (Estoque ou Compras).
2. Lista itens com `stock_qty <= stock_min` (`listLowStockItems`).
3. Resolve `category_id` → fornecedor via `supplier_categories` (preferir `is_default`).
4. Agrupa por fornecedor → uma OC `rascunho` por fornecedor.
5. Quantidade sugerida: `max(stock_min - stock_qty, 1)`.
6. Usuário revisa, ajusta e confirma (`enviada`).

Itens **sem categoria** ou **sem fornecedor** vinculado não entram na OC automática; exibir fila de pendências na UI.

**Pós-MVP (documentado, não bloqueia MVP):** recebimento → `stock_movements` entrada + `compra.recebida`; `fin-contas-pagar` → título a pagar; cotação multi-fornecedor; NF-e entrada.

---

## 14. Roadmap (marcos de entrega R0–R4)

> Marcos **R** = entregas de engenharia. Não confundir com fase de produto **P** nem estágio **E**.

### 14.0 Estado atual do repositório (Maio 2026)

| Área | Marco | Situação no código |
|------|-------|-------------------|
| Monorepo, auth, multi-tenant, registry, billing, CI | R0 | ✅ Entregue |
| Módulos core P1 (`core-catalogo` … `core-ranking`, `aprendiz`) | R1 | ✅ `implementationStatus: implemented` |
| Fiscal pai + sub-módulos `fiscal-*` | R1 | ✅ `fiscal-core` implementado; demais **scaffold** |
| Onboarding diagnóstico + `recomendarModulos` + `modulo_demanda` | R1 | ✅ |
| Cadastro conversacional, e-mail, senha | R1 | ✅ `apps/web` |
| Missões “primeiros passos” | R1 | ✅ `FASE1_MISSIONS` |
| PWA vendas offline + fila + IndexedDB sync | R1 | ✅ |
| `fin-fluxo-caixa`, `ops-vendedores`, `rel-basico` | R2 | ✅ P2 tenant |
| `segment-moda`, `segment-alimentacao`, Asaas mock, Aprendiz LLM | R2 | ✅ |
| `core-crm` (tenant) | R3 | ✅ **implemented** (pipeline MVP S04) |
| Emissão fiscal homologada | R3 | ⏳ Planejado |
| Catálogo global + profundidade D + seed roadmap | R2.5 | ✅ `db:seed-roadmap` + §8.12 |
| UI `/roadmap` + `/evolucao` (admin + tenant) | R2.5 | ✅ `platform-admin` + `apps/web` |
| `apps/platform-admin` | §17 | ✅ CRM, comms mock, insights, `/modulos` |
| Modelo E0–E10 + core por setor no PRD | Doc | ✅ v0.7 |
| `ops-compras` — categorias, fornecedores, OC automática | R3.1 | 🚧 Em entrega (§13.3–13.5) |

**Apps em produção local:** `apps/web` (tenant) · `apps/platform-admin` (interno, porta **3002**).

---

### Marco R0 — Fundação (semanas 1–4)

- [x] Monorepo Turborepo + **Bun workspaces** + `bun.lock`

- [x] **Next.js 16.2.6** em `apps/web` e `apps/platform-admin` (app interna operacional)

- [x] Docker PostgreSQL (`infra/docker`, porta **5454**) + `DATABASE_URL` em `.env` / `.env.development`

- [x] shadcn init + UI **login** e **dashboard** (base `example` / blocks `login-01` + `dashboard-01`)

- [x] Schema global (orgs, memberships, sectors, módulos ativos)

- [x] Provisionamento schema por tenant + ativação de módulos (`@boilerplate/db`)

- [x] NextAuth v5 + sessão `organizationId` + `sectorId` (org real via Prisma)

- [x] tRPC router base + module-registry

- [x] `packages/integrators` (registry + payment-mock + fiscal-noop + mocks comms §17)

- [x] `packages/billing` (PricingEngine + tabela de preços)

- [x] Nav dinâmico (módulos do DB; submenu Fiscal)

- [x] CI/CD básico (GitHub Actions: `lint` + `build` + Prisma validate)

### Marco R1 — Core MVP (semanas 5–10) — fase de produto P1

- [x] Onboarding: **tipo de negócio** (10 perfis) + perguntas maturidade + **CNPJ**

- [x] Engine `recomendarModulos(fase, tipo)` + `modulo_demanda`

- [x] `core-catalogo` (campos variáveis por tipo) — **implemented** (CRUD tenant)

- [x] `core-clientes`, `core-vendas`, `core-estoque-basico`, `core-ranking`

- [x] Domínio fiscal: `fiscal-core` + **scaffold** de todos os sub-módulos `fiscal-*` (§9.8)

- [x] **Aprendiz** MVP (templates + 1–2 automações)

- [x] Event bus in-process + `domain_events`

- [x] **PWA** + fila offline (vendas)

- [x] Cadastro conversacional (`/cadastro`, Aprendiz) + rascunho `signup_drafts`

- [x] Verificação de e-mail no cadastro + recuperação / primeira senha (`/esqueci-senha`, `/conta/senha`)

- [x] Missões de ativação pós-onboarding (`/dashboard` — primeiros passos)

- [x] Sincronização offline ampliada: IndexedDB + `GET /api/sync` (catálogo, clientes, vendas)

> **Fora do escopo R1:** `core-crm` no tenant permanece **scaffold** (previsto P2+).

### Marco R2 — Crescimento (semanas 11–16) — fase P2 — **concluído no código**

- [x] `fin-fluxo-caixa` — entradas/saídas, saldo projetado, contas a pagar (previsto + vencimento)

- [x] `ops-vendedores` — cadastro, comissão %, atribuição na venda, totais por vendedor

- [x] `rel-basico` — relatório por período, ticket médio, inadimplência (contas vencidas)

- [x] Integrador `payment-asaas` (`packages/integrators`) — mock sem API key; sandbox com `ASAAS_API_KEY`

- [x] Aprendiz: respostas via LLM opcional (`APRENDIZ_LLM_ENABLED` + `OPENAI_API_KEY`)

- [x] `segment-moda` e `segment-alimentacao` — hints de campos no catálogo (varejo/atacado)

- [x] Vendas confirmadas → lançamento automático no fluxo de caixa (`recordSaleCashInflow`)

### Marco R2.5 — Catálogo de produto (prep R3) — **concluído**

- [x] Schema `core_sectors`, `core_modules_catalog`, `market_segments`, `segment_*`, `module_depth_changelog` (§8.12)
- [x] `seed-product-roadmap.ts` + `product-roadmap.json` (setores, profundidades D, 40 segmentos, changelog R1/R2)
- [x] `sectorSlug` + `depthCurrent` / `depthTarget` no `module-registry` + `syncRegistryToCatalog()`
- [x] `platform-admin` → `/roadmap` (por setor, changelog, resumo)
- [x] Tenant → `/evolucao` (progresso por setor, próximas melhorias, feed público)
- [x] PRD v0.7 publicado ✅

### Marco R3 — Fiscal e Equipe (semanas 17–24) — fase P3

- [ ] `fiscal-engine` + integrador homologado (por capability)

- [ ] `fiscal-nfce` + `fiscal-nfe` → `implementationStatus: 'implemented'`

- [ ] `fiscal-sped` (competência mensal)

- [ ] Estudo jurídico CT-e ↔ MDF-e → regra em `fiscal-mdfe` (§9.5)

- [ ] `fiscal-cte` + `fiscal-ciot` + `fiscal-mdfe` (transportadora)

- [x] `core-pedidos` — pré-venda na tabela `sales` (status rascunho/pedido), conversão em venda confirmada, formas de pagamento por pedido
- [x] `ops-multi-loja` (MVP R3) — filiais por organização, `branchId` na sessão, vendas/pedidos por filial
- [x] Setores tenant — `sector_modules`, seletor de setor na sidebar, nav filtrado por setor
- [x] `ops-vendedores` D3 — convite por e-mail, vínculo `sellers.user_id` ↔ `users`, papel `vendedor`
- [ ] Configurações tenant — CRUD setores, formas de pagamento, módulos por setor (UI `/configuracoes`)
- [ ] `platform-admin` `/organizacoes/[id]` — detalhe com módulos por setor core, filiais e setores

- [ ] `rh-comissoes`

- [ ] Aprendiz v2 (camada 2 — execução autônoma)

- [ ] Gatilhos de sugestão de módulo
- [x] `platform-admin` rota `/roadmap` (setor, profundidade, changelog) — entregue em R2.5
- [x] Tenant `/evolucao` — evolução visível ao cliente — entregue em R2.5

### Marco R4 — Escala (semanas 25–36) — fase P4

- [ ] `ops-multi-loja` (consolidação BI / visão por unidade — além do MVP R3)

- [ ] `bi-dashboards`

- [ ] Aprendiz v3 (camada 3 — sugestão proativa)

- [ ] API pública + webhooks

- [ ] White-label

### 14.6 Visão de produto — estágios E5–E10

Backlog estratégico sem sprint fixo (detalhe §5.9): governança, multi-empresa, data lake, IA agêntica em escala. Alimenta catálogo `market_*` e priorização via `platform-insights`.

### Trilha Paralela — Painel da Plataforma (§17) — **concluída (MVP)**

- [x] `apps/platform-admin` + auth `platform_users` + RBAC `platform_*`

- [x] `platform-crm` — leads, organizações, pipeline, notas, contas/contatos, atividades, vínculo lead → org

- [x] `platform-comms` — inbox (`/comms`, `/comms/[threadId]`), threads/mensagens, consentimento LGPD; integradores **mock** (`email-resend-mock`, `social-whatsapp-mock`, `social-telegram-mock`)

- [x] `platform-insights` — demanda (`modulo_demanda`), funil, health score heurístico, cobertura matriz, export CSV

- [x] Vínculo conversa ↔ organização/lead ↔ diagnóstico (tipo + fase no thread e no CRM)

- [x] `platform-modulos` — gestão de `modulo_precos`, `planos_base`, `bundle_precos` (§12)

> **Pendente pós-MVP §17:** integradores reais (WhatsApp Cloud API, Resend prod), `platform_activity` como entidade separada de notas (hoje: `PlatformActivity` + `PlatformCrmNote`), NLP em comms (§17.5 — fase 2).

---

## 17. Painel de Gestão da Plataforma (`platform-admin`)

Área **interna** (time comercial, suporte, produto e engenharia). **Não** é visível aos usuários do tenant. Dados no **schema global** `boilerplate` (Prisma), sem misturar com `tenant_xxx`.

### 17.1 Objetivos

| Objetivo | Como |
|----------|------|
| Primeiro contato com lead/cliente | Módulo **comunicação** omnichannel |
| Relacionamento empresa ↔ plataforma | **CRM** de clientes da plataforma |
| Priorizar desenvolvimento | **Analytics** de módulos/funcionalidades mais solicitados |
| Onboarding assistido | Operador vê diagnóstico (tipo + fase) e ativa módulos com o cliente |

### 17.2 Arquitetura

```
apps/platform-admin/
  app/
    (auth)/              # login separado (mesmo NextAuth, roles platform_*)
    (crm)/               # pipeline, contas, contatos
    (comms)/             # inbox unificada
    (insights)/          # dashboards produto/engenharia
  modules/
    platform-crm/
    platform-comms/
    platform-insights/
```

**Separação de responsabilidades:**

| Módulo plataforma | Função | Integradores |
|-------------------|--------|--------------|
| `platform-crm` | Lead → conta → organização; estágio, health, CSM | — |
| `platform-comms` | Threads, templates, atribuição a agente | `social-whatsapp`, `social-telegram`, `email-*` |
| `platform-insights` | Agregações, ranking de demanda, export | Lê `modulo_demanda`, `domain_events`, uso |

### 17.3 CRM — Cliente da Plataforma

Entidades (schema `boilerplate`):

| Entidade | Descrição | Status no código |
|----------|-----------|------------------|
| `platform_lead` | Contato antes de criar tenant | ✅ |
| `platform_account` | Conta comercial (org ou lead) | ✅ |
| `platform_contact` | Pessoas (decisores) | ✅ |
| `crm_deals` | Oportunidade / trial / expansão | ✅ (`CrmDeal`) |
| `platform_crm_notes` | Notas no card CRM | ✅ |
| `platform_activities` | Ligação, reunião, nota, mensagem (comms gera `message`) | ✅ |
| `platform_comms_*` | Threads, mensagens, consentimento | ✅ |

**Fluxo típico:**

1. Lead entra por WhatsApp/site → `platform_lead` + thread em `platform-comms`
2. SDR qualifica tipo de negócio e fase estimada (mesmas enums do §6)
3. Trial criado → `organizations` + schema tenant provisionado
4. Pós-venda: health score, módulos ativos, tickets, renovação

`core-clientes` **não** substitui este CRM — são domínios diferentes.

### 17.4 Comunicação / Social (`platform-comms`)

**Inbox unificada** para canais externos via integradores (§8.7):

| Canal | Integrador (ex.) | Uso |
|-------|------------------|-----|
| WhatsApp | `social-whatsapp` (Cloud API / parceiro) | Prospecção, suporte, onboarding assistido |
| Telegram | `social-telegram` | Bots, alertas, suporte técnico |
| E-mail | `email-resend` / `email-ses` | Transacional + sequências |
| SMS | `messaging-sms` | OTP, lembretes (opcional) |

**Recursos:**

- Thread por lead/conta/organização
- Templates aprovados (WhatsApp)
- Handoff bot → humano
- Webhook inbound → `platform_activity` + notificação ao agente
- Opt-in / LGPD: consentimento registrado por canal

Mensagens **não** são armazenadas no schema do tenant salvo se o cliente exportar conversa para o Aprendiz (futuro, opt-in).

### 17.5 Insights para Desenvolvimento (`platform-insights`)

Fontes de dados para priorizar o roadmap:

| Sinal | Origem | Métrica |
|-------|--------|---------|
| Módulo sugerido no diagnóstico mas `planned` | `modulo_demanda` | Contagem por `moduleId` + `tipoNegocio` |
| Tipo de negócio `planned` ou “não está na lista” | `tipo_negocio_interesse` | Contagem por ID planejado + segmento |
| Clique em “quero este módulo” | UI tenant | `feature_interest` |
| Tentativa de usar feature bloqueada | Middleware módulo | `module_blocked_attempt` |
| Upgrade/downgrade de plano | `billing` | Receita por módulo |
| Tickets/comms com palavra-chave | `platform-comms` | NLP/tags (fase 2) |

**Dashboards (time produto/engenharia):**

1. **Top módulos demandados** — filtro por tipo de negócio e fase
2. **Funil** — lead → trial → ativo → expansão
3. **Cobertura da matriz** — % células fase×tipo com módulos `implemented` vs `planned`
4. **Churn risk** — health score + queda de uso

Export semanal (CSV/API) para planejamento de sprints.

### 17.6 RBAC do Painel

| Papel | Permissões |
|-------|------------|
| `platform_admin` | Tudo |
| `platform_comercial` | CRM + comms + criar trial |
| `platform_suporte` | Comms + ver tenant (read-only) |
| `platform_produto` | Insights + CRM read |
| `platform_engenharia` | Insights + flags de módulo |

Autenticação: mesmo NextAuth com `user.platform_role` ou tabela `platform_users` separada.

### 17.7 UI

- App dedicada `platform-admin` (porta dev **3002**; futuro subdomínio `admin.`)
- shadcn shell + rotas: `/dashboard`, `/crm`, `/comms`, `/insights`, `/modulos`, `/organizacoes`
- **Entregue (MVP):** kanban/lista CRM, inbox omnichannel (mock), dashboards de insights, editor de precificação
- **Não entregue:** inbox com API real de WhatsApp/Telegram; webhooks inbound de provedores

### 17.8 Gestão de produto — roadmap por setor e profundidade

Objetivo: o time interno e o cliente enxergarem **onde estamos** e **para onde vamos** sem confundir marco R, fase P e estágio E.

**Rota planejada:** `platform-admin` → `/roadmap` (ou abas em `/modulos`).

| Vista | Conteúdo | Público |
|-------|----------|---------|
| Por setor core | Módulos agrupados; badge `implementation_status` + barra D atual→alvo | Produto, engenharia |
| Por marco R | Colunas R0–R4; cards de módulo | Engenharia |
| Por estágio E | Faixas E0–E2, E3–E5… + módulos vitais do estudo | Produto, comercial |
| Cobertura segmento | Heatmap segmento × módulo vital × status | Produto |
| Profundidade | Gap “implementado mas raso”; média por setor | Produto, CSM |
| Changelog | `module_depth_changelog`; releases que subiram D | Admin (edição); tenant (leitura pública) |
| Convencimento | KPI: releases/mês, Δ profundidade média, setor que mais evoluiu | Comercial |

**RBAC:** `platform_produto` e `platform_engenharia` leem; `platform_admin` edita notas de roadmap e changelog.

**Organização (`/organizacoes/[id]`):** módulos ativos agrupados por setor core; fase P; estágio E estimado (quando existir).

**Tenant (`/evolucao`):** % do caminho por setor; próximas melhorias; feed público do changelog — §5.0.1.

**Fontes:** catálogo §8.12; estudos em `doc/estudo-de-mercado/`.

---

## 15. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |

|-------|--------------|---------|-----------|

| Complexidade fiscal subestimada | Alta | Alto | Sub-módulos por documento + adapter por capability + homologação incremental |

| CT-e / MDF-e dependência incorreta | Média | Médio | Estudo jurídico §9.5 antes de hard dependency |

| Adoção baixa do Aprendiz | Média | Médio | Onboarding guiado com templates prontos por segmento |

| Performance com muitos tenants | Média | Alto | Schema isolation + connection pooling (PgBouncer) |

| Dependência de módulos mal gerenciada | Baixa | Alto | Validação de dependências na ativação + testes de contrato |

| Integradores mal isolados | Média | Alto | Proibir chamada externa fora de `packages/integrators`; contratos + testes de webhook |

| Custo de LLM (Aprendiz) escala antes da receita | Média | Médio | Cache de automações compiladas, LLM só na criação da regra |

| Complexidade fase × tipo explode combinações | Média | Alto | Matriz versionada em código; módulos `planned`; insights guiam implementação |

| LGPD em comms omnichannel | Média | Alto | Consentimento por canal; retenção configurável; sem cruzar dados tenant sem base legal |

---

## 16. Métricas de Sucesso

| Métrica | Meta (6 meses) |

|---------|----------------|

| Tenants ativos | 500 |

| Churn mensal | < 3% |

| Módulos por tenant (média) | ≥ 3 |

| Taxa de upgrade de fase | > 15% ao mês |

| NPS | ≥ 50 |

| Automações criadas pelo Aprendiz | > 2.000 |

| Uptime | 99,9% |

| Leads qualificados no CRM plataforma | > 200 |

| Tempo médio lead → tenant ativo | < 7 dias |

| Top 5 módulos demandados reportados no insights | 100% visíveis para produto |

| Tenants que visualizam `/evolucao` ao menos 1×/mês | > 40% dos ativos |

| Entradas no changelog de profundidade (públicas) | ≥ 1 release/mês após R2.5 |

---

## Apêndice A — Glossário

| Termo | Definição |

|-------|-----------|

| **Tenant / Organização** | Empresa com schema PostgreSQL isolado (`tenant_xxx`) |

| **Setor tenant** | Instância departamental na empresa (`sectors`); filtra ferramentas e permissões |

| **Setor core** | Catálogo global de áreas funcionais (`core_sectors`: comercial, financeiro…) |

| **Membership** | Vínculo usuário ↔ empresa com papel global |

| **Módulo** | Pacote de funcionalidade que segue `ModuleDefinition` |

| **Integrador** | Adapter de serviço externo; conecta provedores aos módulos via eventos normalizados |

| **Marco de entrega (R)** | Entrega de engenharia R0–R4 (§14); não é estágio E nem fase P |

| **Fase de produto (P)** | Tier de módulos da empresa (1–4); `organizations.phase`; precificação |

| **Estágio de evolução (E)** | Maturidade empresarial real (0–10); §4.2 |

| **Profundidade (D)** | Completude funcional de um módulo (0–5); `depth_current` / `depth_target`; §5.0.1 |

| **Fase** (legado no código) | Sinônimo de **fase de produto P** (1–4) — evitar ambiguidade com marco R ou estágio E |

| **Item** | Produto ou serviço no `core-catalogo` |

| **Aprendiz** | Engine de automação (templates no MVP; LLM opcional) |

| **Diagnóstico** | Onboarding com 5 perguntas + CNPJ → classificação de fase |

| **Gatilho** | Sinal de uso que dispara sugestão de módulo ou automação |

| **Evento de domínio** | Mensagem tipada entre módulos (ex.: `venda.confirmada`) |

| **PricingEngine** | Cálculo de mensalidade por fase + módulos ativos |

| **fiscal-core** | Módulo pai do domínio fiscal (config, capabilities, shell UI) |

| **Sub-módulo fiscal** | `fiscal-nfce`, `fiscal-cte`, etc. — capacidade instalável sob o pai |

| **FiscalCapability** | Identificador da capacidade (`nfce`, `cte`, `sped`…) registrada no tenant |

| **FiscalAdapter** | Interface em `fiscal-engine`; implementação por provedor SEFAZ |

| **Bundle fiscal** | Conjunto de sub-módulos na precificação (ex.: Varejo Fiscal, Transporte Fiscal) |

| **Tipo de negócio** | Perfil operacional (PF, varejo, fabricante, produtor rural…) — eixo do pacote de módulos |

| **Cliente da plataforma** | Organização/lead gerenciado pelo CRM interno (`platform-*`) |

| **Cliente do negócio** | Cadastro no `core-clientes` do tenant |

| **Painel da plataforma** | `apps/platform-admin` — CRM, comms e insights para o time interno |

| **modulo_demanda** | Registro de interesse em módulo ainda não implementado (priorização dev) |

| **tipo_negocio_interesse** | Tipo `planned` indicado no onboarding “não está na lista” (priorização produto) |

| **Tipo planejado** | `TipoNegocio` com `status: 'planned'` — documentado em §5.5.1, fora do onboarding |

| **market_segment** | Segmento do estudo de mercado (40); catálogo global; não substitui `tipo_negocio` |

| **module_depth_changelog** | Registro público/interno de aumento de profundidade D de um módulo |

| **core_modules_catalog** | Catálogo global de módulos, profundidade e status de desenvolvimento (§8.12) |

| **Category** | Nó em `catalog_categories` (categoria ou subcategoria) |

| **Supplier** | Fornecedor cadastrado no tenant (`suppliers`) — quem a empresa compra |

| **Fornecedor (tipo negócio)** | Perfil B2B de quem **vende** para outros — não confundir com **Supplier** |

| **Ordem de compra (OC)** | Documento `purchase_orders` em `ops-compras` |

| **ops-compras** | Módulo de compras: fornecedores, vínculo categoria, OC manual e automática (estoque baixo) |

---

### Histórico de marcos (produto)

| Data | Marco |
|------|--------|
| Sem. 1–4 | Marco R0 — fundação monorepo |
| Sem. 5–10 | Marco R1 — core MVP tenant (fase P1) |
| Mai/2026 | Trilha §17 — `platform-admin` MVP (CRM + comms mock + insights) |
| Mai/2026 | Marco R2 — fluxo de caixa, vendedores, relatórios, Asaas mock, Aprendiz LLM (fase P2) |
| Mai/2026 | PRD v0.7 — estágios E0–E10, setores core, profundidade D0–D5, catálogo roadmap |
| Mai/2026 | Marco R2.5 — catálogo global, seed roadmap, `/roadmap`, `/evolucao` |
| Mai/2026 | PRD v0.8 + Marco **R3.1** — categorias hierárquicas, `ops-compras`, OC automática |
| — | **Atual:** Marco R3 — fiscal homologado + `rh-comissoes` + Aprendiz v2 |

---

*Documento vivo — atualizar a cada sprint com decisões técnicas tomadas.*
