# Criar migration de módulo comunitário

## Objetivo
Declarar migrations versionadas no manifesto do módulo para execução pelo `module-migration-runner`.

## Quando usar
Ao adicionar ou alterar tabelas `{moduleId}_*` em módulo comunitário.

## Arquivos permitidos
- `community/*/src/**`
- `community/*/migrations/**`
- manifesto / `ecosystem.publication.json`

## Arquivos proibidos
- `@boilerplate/db` imports
- SQL executado fora do runner

## Checklist
- [ ] Migration id único `YYYYMMDDNNNN_descricao`
- [ ] checksum SHA256 no manifesto
- [ ] `tenantScoped: true` quando aplicável
- [ ] `requiresBackup: true` para DDL destrutivo
