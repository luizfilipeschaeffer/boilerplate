# Contract Reference v1

Source of truth: `@boilerplate/sdk-core`

## Versioning

| Contract | Current | Package |
|----------|---------|---------|
| Module | ^1.2.0 | sdk-core/contracts/module.ts |
| Events | ^2.0.0 | event-bus/catalog.ts |
| SDK | ^3.0.0 | sdk-server, sdk-react, sdk-events |

## Example module contract

```typescript
import type { BoilerplateModule } from "@boilerplate/sdk-core";

export const moduleContract: BoilerplateModule = {
  id: "my-module",
  version: "1.0.0",
  coreContract: "^1.2.0",
  capabilities: { database: true, filesystem: false, processEnv: false, crossTenant: false },
  requiredPermissions: ["my-module.read"],
  routes: [{ path: "/my-module", label: "My Module" }],
};
```

## Breaking vs non-breaking

- **Breaking:** remove capability, change permission semantics, rename event payload field
- **Non-breaking:** add optional event field, add route, add handler for new event version

## LTS

- 18 months active support per core major
- 6 months security-only after active period

See [CONTRIBUTING.md](../../community/CONTRIBUTING.md) for contribution flow.
