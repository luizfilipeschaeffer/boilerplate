# Publicação Docker (self-hosted)

O workflow [`docker-publish.yml`](./workflows/docker-publish.yml) publica as imagens no **Docker Hub** após testes e build passarem.

## Secrets no GitHub

Em **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
|--------|--------|
| `DOCKER_USERNAME` | Usuário da conta Docker Hub |
| `DOCKER_TOKEN` | Access Token do Docker Hub (não use a senha da conta) |

### Como gerar o token

1. [hub.docker.com](https://hub.docker.com) → **Account Settings** → **Security**
2. **New Access Token** → permissão **Read, Write, Delete** (ou pelo menos Read & Write)
3. Copie o token e cole em `DOCKER_TOKEN` (só aparece uma vez)

## Imagens publicadas

Com usuário `minhaempresa`, o CI publica:

- `minhaempresa/self-hosted-web`
- `minhaempresa/self-hosted-worker`
- `minhaempresa/self-hosted-license-agent`

Tags: `latest` (branch `main`), SHA do commit, e semver em tags Git `v1.2.3`.

## VPS do cliente (zero-touch)

Um comando — só informar a imagem (usuário Docker Hub):

```bash
BOILERPLATE_IMAGE=minhaempresa curl -fsSL https://raw.githubusercontent.com/<org>/<repo>/main/infra/self-hosted/install-vps.sh | bash
```

O script instala em `/opt/boilerplate`, grava `.env`, faz pull e `docker compose up -d` de todos os serviços.

Repositório **privado**: incluir `DOCKER_USERNAME` e `DOCKER_TOKEN` na mesma linha (o script faz `docker login` automaticamente).
