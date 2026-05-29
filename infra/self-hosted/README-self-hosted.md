# Self-hosted — Boilerplate Enterprise

Instalação Docker oficial para VPS do cliente.

## Requisitos

- Docker e Docker Compose v2
- Conta na plataforma central Boilerplate

## Instalação na VPS (um comando)

O cliente informa **apenas a imagem** (usuário Docker Hub publicado pelo CI). O script baixa o compose, grava o `.env`, faz `pull` e sobe **postgres, redis, web, worker e license-agent** automaticamente.

```bash
BOILERPLATE_IMAGE=minhaempresa curl -fsSL https://raw.githubusercontent.com/boilerplate/boilerplate/main/infra/self-hosted/install-vps.sh | bash
```

Com versão fixa:

```bash
BOILERPLATE_IMAGE=minhaempresa:1.2.0 curl -fsSL .../install-vps.sh | bash
```

Opcional na mesma linha (senão configura no wizard `/setup`):

```bash
BOILERPLATE_IMAGE=minhaempresa \
INSTALLATION_KEY=inst_xxxx \
CENTRAL_API_URL=https://platform.seudominio.com.br \
curl -fsSL .../install-vps.sh | bash
```

Repositório **privado** no Docker Hub:

```bash
DOCKER_USERNAME=minhaempresa DOCKER_TOKEN=seu-token \
BOILERPLATE_IMAGE=minhaempresa curl -fsSL .../install-vps.sh | bash
```

Instalação em `/opt/boilerplate` (padrão). Para outro diretório: `BOILERPLATE_INSTALL_DIR=/srv/boilerplate`.

Após subir, acesse `http://<ip-da-vps>:3000` e conclua **`/setup`** se o token ainda não foi informado.

## Formato de `BOILERPLATE_IMAGE`

| Valor | Resultado |
|-------|-----------|
| `minhaempresa` | `minhaempresa/self-hosted-*:latest` |
| `minhaempresa:1.2.0` | tag `1.2.0` em todos os serviços |
| `minhaempresa/self-hosted-web:1.2.0` | tag `1.2.0` (worker e license-agent no mesmo usuário) |

## Desenvolvimento local (build no repo)

```bash
cp infra/self-hosted/.env.example infra/self-hosted/.env
docker compose -f infra/self-hosted/docker-compose.yml up -d
```

## CI/CD (publicação das imagens)

Workflow [`.github/workflows/docker-publish.yml`](../../.github/workflows/docker-publish.yml) + secrets `DOCKER_USERNAME` e `DOCKER_TOKEN` — ver [`.github/DOCKER_PUBLISH.md`](../../.github/DOCKER_PUBLISH.md).

| Imagem | Função |
|--------|--------|
| `<usuario>/self-hosted-web` | ERP (`apps/web`) |
| `<usuario>/self-hosted-worker` | Jobs em background |
| `<usuario>/self-hosted-license-agent` | Heartbeat e licença |

## Primeiro acesso

1. **`/setup`** — wizard pós-instalação
2. Token de instalação + URL central (se não passou no install)
3. SSO com conta Boilerplate
4. Licença e domínios permitidos

## Serviços

| Serviço | Função |
|---------|--------|
| web | ERP + portal do cliente |
| worker | Jobs em background |
| postgres | Banco local |
| redis | Filas e cache |
| license-agent | Heartbeat + sync de licença |

## CLI

```bash
boilerplate license status
boilerplate modules install core-crm
boilerplate update
boilerplate doctor
```
