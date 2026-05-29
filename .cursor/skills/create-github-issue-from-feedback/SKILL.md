# Feedback cliente → issue GitHub

## Objetivo
Triagem de `CustomerFeedback` e criação de issue com labels padronizadas.

## Labels obrigatórias
`module:*`, `processo:*`, `phase:*`, `impacto:*`, `tipo:*`, `origem:cliente`, `status:triagem`, `bounty:*`

## Fluxo
1. Cliente envia feedback no apps/web
2. `feedback-bridge` sanitiza
3. Staff aprova no platform-admin
4. GitHub issue criada via API
