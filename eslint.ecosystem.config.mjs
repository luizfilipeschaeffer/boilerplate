import js from "@eslint/js";
import boilerplate from "eslint-plugin-boilerplate";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["community/**/*.ts"],
    plugins: { boilerplate },
    rules: {
      "boilerplate/no-direct-db-import": "error",
      "boilerplate/no-process-env": "error",
      "boilerplate/no-next-public-in-modules": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
