#!/usr/bin/env bash
# Atalho: instalação em produção (imagens Docker Hub).
# Defina BOILERPLATE_IMAGE e execute — sem outros comandos manuais.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec env BOILERPLATE_INSTALL_DIR="${BOILERPLATE_INSTALL_DIR:-/opt/boilerplate}" \
  bash "${SCRIPT_DIR}/install-vps.sh" "$@"
