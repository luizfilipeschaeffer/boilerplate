#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$Dir = if ($env:BOILERPLATE_INSTALL_DIR) { $env:BOILERPLATE_INSTALL_DIR } else { ".\boilerplate-self-hosted" }
New-Item -ItemType Directory -Force -Path $Dir | Out-Null
Copy-Item "infra/self-hosted/docker-compose.yml" "$Dir/docker-compose.yml" -ErrorAction SilentlyContinue
Copy-Item "infra/self-hosted/.env.example" "$Dir/.env.example" -ErrorAction SilentlyContinue
if (-not (Test-Path "$Dir\.env")) { Copy-Item "$Dir\.env.example" "$Dir\.env" }
$token = Read-Host "Installation token (inst_...)"
if ($token) { Add-Content "$Dir\.env" "INSTALLATION_TOKEN=$token" }
Set-Location $Dir
docker compose up -d
Write-Host "Instalação iniciada. Acesse http://localhost:3000"
