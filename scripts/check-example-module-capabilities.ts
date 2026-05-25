import { moduleContract } from "../community/example-module/src/contract.ts";

if (moduleContract.capabilities.filesystem !== false) {
  console.error("example-module: filesystem capability must be false");
  process.exit(1);
}

console.log("ok");
