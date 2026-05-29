#!/usr/bin/env bash
# Instalação zero-touch na VPS: informe BOILERPLATE_IMAGE e o script sobe todo o stack.
#
# Uso:
#   BOILERPLATE_IMAGE=minhaempresa curl -fsSL https://raw.githubusercontent.com/.../install-vps.sh | bash
#   BOILERPLATE_IMAGE=minhaempresa:1.2.0 INSTALLATION_KEY=inst_xxx bash install-vps.sh
#
set -euo pipefail

REPO_RAW="${BOILERPLATE_INSTALL_REPO:-https://raw.githubusercontent.com/boilerplate/boilerplate/main}"
INSTALL_DIR="${BOILERPLATE_INSTALL_DIR:-/opt/boilerplate}"
COMPOSE_FILE="docker-compose.prod.yml"
DEFAULT_CENTRAL_URL="${BOILERPLATE_CENTRAL_URL:-https://platform.boilerplate.com.br}"

# Imagem publicada pelo CI (usuário Docker Hub). Sobrescreva na VPS se necessário.
: "${BOILERPLATE_IMAGE:?Defina BOILERPLATE_IMAGE (ex.: minhaempresa ou minhaempresa:1.2.0)}"

log() { printf '==> %s\n' "$*"; }
die() { printf 'ERRO: %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Comando obrigatório não encontrado: $1"
}

parse_boilerplate_image() {
  local img="$1"
  local registry tag

  if [[ "$img" == */self-hosted-web:* ]]; then
    registry="${img%%/self-hosted-web:*}"
    tag="${img##*:}"
  elif [[ "$img" == */self-hosted-web ]]; then
    registry="${img%%/self-hosted-web}"
    tag="latest"
  elif [[ "$img" == *:* ]]; then
    registry="${img%%:*}"
    tag="${img##*:}"
  else
    registry="$img"
    tag="latest"
  fi

  [[ -n "$registry" ]] || die "BOILERPLATE_IMAGE inválido: $img"
  export BOILERPLATE_REGISTRY="$registry"
  export BOILERPLATE_VERSION="$tag"
}

fetch_file() {
  local remote="$1" dest="$2"
  if curl -fsSL "$remote" -o "$dest" 2>/dev/null; then
    return 0
  fi
  local local_path
  local_path="$(dirname "${BASH_SOURCE[0]:-$0}")/$(basename "$dest")"
  if [[ -f "$local_path" ]]; then
    cp "$local_path" "$dest"
    return 0
  fi
  die "Não foi possível baixar $remote (nem usar cópia local)"
}

random_b64_32() {
  openssl rand -base64 32 | tr -d '\n'
}

env_has_key() {
  local file="$1" key="$2"
  [[ -f "$file" ]] && grep -q "^${key}=" "$file"
}

write_env_file() {
  local env_file="$INSTALL_DIR/.env"
  local tmp
  tmp="$(mktemp)"

  if [[ ! -f "$env_file" && -f "$INSTALL_DIR/.env.example" ]]; then
    cp "$INSTALL_DIR/.env.example" "$env_file"
  fi

  if [[ -f "$env_file" ]]; then
    grep -v '^BOILERPLATE_REGISTRY=' "$env_file" \
      | grep -v '^BOILERPLATE_VERSION=' \
      | grep -v '^BOILERPLATE_IMAGE=' >"$tmp" || true
  else
    : >"$tmp"
  fi

  {
    cat "$tmp"
    echo "BOILERPLATE_IMAGE=${BOILERPLATE_IMAGE}"
    echo "BOILERPLATE_REGISTRY=${BOILERPLATE_REGISTRY}"
    echo "BOILERPLATE_VERSION=${BOILERPLATE_VERSION}"
    echo "CENTRAL_API_URL=${CENTRAL_API_URL:-$DEFAULT_CENTRAL_URL}"
    if [[ -n "${INSTALLATION_KEY:-}" ]]; then
      echo "INSTALLATION_KEY=${INSTALLATION_KEY}"
    fi
    if [[ -n "${INSTALLATION_ID:-}" ]]; then
      echo "INSTALLATION_ID=${INSTALLATION_ID}"
    fi
    if [[ -n "${ALLOWED_HOSTS:-}" ]]; then
      echo "ALLOWED_HOSTS=${ALLOWED_HOSTS}"
    fi
  } >"$env_file"

  if ! env_has_key "$env_file" AUTH_SECRET; then
    echo "AUTH_SECRET=$(random_b64_32)" >>"$env_file"
    log "AUTH_SECRET gerado automaticamente"
  fi
  if ! env_has_key "$env_file" INTEGRATOR_ENCRYPTION_KEY; then
    echo "INTEGRATOR_ENCRYPTION_KEY=$(random_b64_32)" >>"$env_file"
    log "INTEGRATOR_ENCRYPTION_KEY gerado automaticamente"
  fi

  rm -f "$tmp"
}

main() {
  need_cmd docker
  need_cmd openssl
  docker compose version >/dev/null 2>&1 || die "Docker Compose v2 é obrigatório (plugin compose)"

  parse_boilerplate_image "$BOILERPLATE_IMAGE"

  if [[ -n "${DOCKER_USERNAME:-}" && -n "${DOCKER_TOKEN:-}" ]]; then
    log "Login no Docker Hub"
    echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin
  fi

  log "Preparando diretório ${INSTALL_DIR}"
  mkdir -p "$INSTALL_DIR"

  fetch_file "${REPO_RAW}/infra/self-hosted/${COMPOSE_FILE}" "${INSTALL_DIR}/${COMPOSE_FILE}"
  fetch_file "${REPO_RAW}/infra/self-hosted/.env.example" "${INSTALL_DIR}/.env.example"

  write_env_file

  log "Imagens: ${BOILERPLATE_REGISTRY}/self-hosted-{web,worker,license-agent}:${BOILERPLATE_VERSION}"
  log "Subindo stack (pull + start automático)"

  cd "$INSTALL_DIR"
  docker compose -f "$COMPOSE_FILE" up -d --pull always --remove-orphans

  log "Pronto. Acesse http://$(hostname -f 2>/dev/null || echo localhost):3000"
  log "Primeira vez: conclua o wizard em /setup (token de instalação, se ainda não informou)."
}

main "$@"
