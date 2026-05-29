# Atalho Windows para o release-gate (mesmos argumentos do script Bun).
# Ex.: .\scripts\release-gate.ps1 -Push -AutoFix
param(
  [switch]$Push,
  [switch]$AutoFix,
  [switch]$SkipCommit,
  [switch]$NoDocker,
  [int]$MaxCycles = 15,
  [string]$Message = "",
  [string]$Workflows = "",
  [string]$AgentCmd = ""
)

$argsList = @("run", "scripts/release-gate.ts")
if ($Push) { $argsList += "--push" }
if ($AutoFix) { $argsList += "--auto-fix" }
if ($SkipCommit) { $argsList += "--skip-commit" }
if ($NoDocker) { $argsList += "--no-docker" }
if ($MaxCycles -ne 15) { $argsList += @("--max-cycles", "$MaxCycles") }
if ($Message) { $argsList += @("--message", $Message) }
if ($Workflows) { $argsList += @("--workflows", $Workflows) }
if ($AgentCmd) { $argsList += @("--agent-cmd", $AgentCmd) }

Set-Location (Split-Path $PSScriptRoot -Parent)
& bun @argsList
exit $LASTEXITCODE
