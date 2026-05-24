## Resumo

<!-- Descreva o que este módulo ou integrador faz, para qual segmento/público, e qual problema resolve. -->

## Tipo de contribuição

- [ ] **Módulo** — `community/<id>/`
- [ ] **Integrador** — `community/<id>/`

## Metadados (obrigatório)

Preencha `community/<id>/ecosystem.publication.json` (copie de [ecosystem.publication.template.json](../../community/ecosystem.publication.template.json)).

| Campo | Valor |
|-------|-------|
| **ID (`externalId`)** | |
| **Pacote npm** | `@boilerplate-community/` |
| **Versão** | |
| **Publicador** | Nome / e-mail |
| **Categoria** (integradores) | payment / messaging / fiscal / … |

## Guia completo

Siga [doc/ecosystem/publicacao-pr-comunidade.md](../../doc/ecosystem/publicacao-pr-comunidade.md).

---

## Ecosystem security checklist

- [ ] Usa contratos `@boilerplate/sdk-core` (sem tipos ad hoc)
- [ ] **Sem** import de `@boilerplate/db` no código em `community/`
- [ ] **Sem** `process.env` no módulo/integrador
- [ ] **Sem** variáveis `NEXT_PUBLIC_*` no pacote community
- [ ] Capabilities no contrato correspondem ao uso real
- [ ] Tabelas de módulo prefixadas com `{moduleId}_`
- [ ] Event handlers declaram `eventVersion` (semver range)
- [ ] Integrador: `configSchema` alinhado a `platform-catalog.json`
- [ ] Testes adicionados/atualizados (`src/contract.test.ts` mínimo)
- [ ] `bun run lint:ecosystem` passa localmente
- [ ] `bun audit --audit-level=high` sem vulnerabilidades bloqueantes
- [ ] `ecosystem.publication.json` incluído e preenchido
- [ ] `dist/manifest.json` gerado via `boilerplate publish` (recomendado)

## Arquivos fora de `community/<id>/`

Liste alterações e justifique cada uma:

| Arquivo | Motivo |
|---------|--------|
| | |

Exemplos esperados: `packages/db/src/module-migrations.ts`, `packages/db/data/platform-catalog.json`, `packages/event-bus/src/catalog.ts`.

## Trust level solicitado

Marque apenas o nível **inicial** da submissão (moderação pode elevar após review):

- [x] `community` (padrão para PRs da comunidade)
- [ ] `verified` (somente se já aprovado em moderação anterior)
- [ ] `certified` / `official` (core team — não aplicável a PRs community)

## Testes executados localmente

```bash
bun run lint:ecosystem
bun run --filter @boilerplate-community/<id> test
bun run --filter @boilerplate-community/<id> lint
```

- [ ] Comandos acima executados com sucesso

## Rollout pós-merge (para o time da plataforma)

<!-- O que deve acontecer após merge: registro em EcosystemPublication, smoke test, aprovação em /comunidade, etc. -->

## Evidências

<!-- Screenshots, saída de healthCheck, logs de teste, link para issue/RFC -->

## RFC / breaking changes

- [ ] Não altera contratos públicos do SDK
- [ ] Altera contratos — link para RFC em `doc/rfcs/`:

---

/cc @boilerplate/core-team
