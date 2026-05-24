import js from "@eslint/js";
import boilerplate from "eslint-plugin-boilerplate";

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    plugins: { boilerplate },
    rules: {
      "boilerplate/no-direct-db-import": "error",
      "boilerplate/no-process-env": "error",
      "boilerplate/no-next-public-in-modules": "error",
    },
  },
];
