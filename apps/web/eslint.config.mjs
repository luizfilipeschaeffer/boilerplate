import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
  {
    rules: {
      // TanStack Table + React Compiler: API intencionalmente não memoizável
      "react-hooks/incompatible-library": "off",
    },
  },
]);
