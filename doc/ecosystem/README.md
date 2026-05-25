# Ecossistema — documentação

| Documento | Descrição |
|-----------|-----------|
| **[publicacao-pr-comunidade.md](./publicacao-pr-comunidade.md)** | Guia completo para desenvolvedores submeterem PR padronizada (módulos e integradores) |
| [ecosystem.publication.schema.json](./ecosystem.publication.schema.json) | JSON Schema dos metadados `ecosystem.publication.json` |

## Fluxo resumido

1. Desenvolvedor implementa em `community/<id>/` + `ecosystem.publication.json`
2. PR com template `.github/PULL_REQUEST_TEMPLATE/ecosystem.md`
3. CI `ecosystem-security.yml` + code review
4. Moderação em platform-admin → **Comunidade**
5. Aprovação → marketplace + tenants

## Templates

- Metadados: [community/ecosystem.publication.template.json](../../community/ecosystem.publication.template.json)
- Contributing: [community/CONTRIBUTING.md](../../community/CONTRIBUTING.md)
