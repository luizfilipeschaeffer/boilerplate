# Security Policy — Open Boilerplate Enterprise

## Supported versions

| Core contract | Support |
|---------------|---------|
| 1.2.x | Active LTS (18 months) |
| 1.1.x | Security-only (6 months) |

## Inegociável rules

1. Community modules **must not** import `@boilerplate/db` directly
2. No `process.env` in module/integrator packages — config injected by core
3. All queries scoped by `organizationId` fixed by core
4. No `NEXT_PUBLIC_*` in module packages
5. Secrets never in logs, audit diffs, or client responses
6. Undeclared capabilities → runtime block + platform alert

## Responsible disclosure

Email: security@boilerplate.dev (configure for your org)

- Acknowledgment SLA: 48 hours
- Critical fix SLA: 7 days
- Certified module CVE process: coordinated disclosure with publisher

## Reporting

Include: module id/version, steps to reproduce, impact assessment, suggested fix.

Do not open public issues for exploitable vulnerabilities.
