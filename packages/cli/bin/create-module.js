#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as readline from "node:readline/promises";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function ask(q, def) {
  const a = await rl.question(def ? `${q} [${def}]: ` : `${q}: `);
  return a.trim() || def || "";
}

const name = process.argv[2] ?? (await ask("Module id (kebab-case)", "my-module"));
const segment = await ask("Segment (optional)", "");
const capabilities = await ask("Capabilities (database,events,ai)", "database,events");

rl.close();

const dir = join(process.cwd(), name);
await mkdir(join(dir, "src"), { recursive: true });

const caps = capabilities.split(",").map((c) => c.trim());
const capObj = {};
for (const c of caps) capObj[c] = true;

await writeFile(
  join(dir, "package.json"),
  JSON.stringify(
    {
      name: `@boilerplate-community/${name}`,
      version: "0.1.0",
      type: "module",
      main: "./src/index.ts",
      dependencies: {
        "@boilerplate/sdk-core": "^3.0.0",
        "@boilerplate/sdk-server": "^3.0.0",
        "@boilerplate/sdk-events": "^3.0.0",
      },
    },
    null,
    2,
  ),
);

await writeFile(
  join(dir, "src", "contract.ts"),
  `import type { BoilerplateModule } from "@boilerplate/sdk-core";

export const moduleContract: BoilerplateModule = {
  id: "${name}",
  version: "0.1.0",
  coreContract: "^1.2.0",
  ${segment ? `segment: ["${segment}"],` : ""}
  capabilities: ${JSON.stringify({ ...capObj, filesystem: false, processEnv: false, crossTenant: false }, null, 2)},
  requiredPermissions: ["${name}.read"],
  routes: [{ path: "/${name}", label: "${name}" }],
  eventHandlers: [
    { eventType: "${name}.item.created", eventVersion: "^1.0.0", handlerId: "on-item-created", async: true },
  ],
};
`,
);

await writeFile(
  join(dir, "src", "index.ts"),
  `export { moduleContract } from "./contract";
`,
);

await writeFile(
  join(dir, "README.md"),
  `# @boilerplate-community/${name}

Scaffolded module. Run \`bun dev:community\` from monorepo root.
`,
);

console.log(`Created module at ${dir}`);
