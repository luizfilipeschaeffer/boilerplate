import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
  {
    rules: {
      // Form/dialog reset-on-open is intentional; keyed remount would fragment large dialogs.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
