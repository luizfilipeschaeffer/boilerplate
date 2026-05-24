/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  meta: {
    name: "eslint-plugin-boilerplate",
    version: "1.0.0",
  },
  rules: {
    "no-direct-db-import": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow direct @boilerplate/db imports in community modules",
        },
        messages: {
          noDirectDb:
            "Modules must not import '@boilerplate/db' directly. Use @boilerplate/sdk-server repositories.",
        },
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const src = node.source.value;
            if (
              typeof src === "string" &&
              (src === "@boilerplate/db" || src.startsWith("@boilerplate/core/db"))
            ) {
              context.report({ node, messageId: "noDirectDb" });
            }
          },
        };
      },
    },
    "no-process-env": {
      meta: {
        type: "problem",
        docs: { description: "Disallow process.env in module/integrator code" },
        messages: {
          noEnv: "Modules must not read process.env. Configuration is injected by the core.",
        },
      },
      create(context) {
        return {
          MemberExpression(node) {
            if (
              node.object.type === "Identifier" &&
              node.object.name === "process" &&
              node.property.type === "Identifier" &&
              node.property.name === "env"
            ) {
              context.report({ node, messageId: "noEnv" });
            }
          },
        };
      },
    },
    "no-next-public-in-modules": {
      meta: {
        type: "problem",
        docs: { description: "Disallow NEXT_PUBLIC_ env vars in modules" },
        messages: {
          noNextPublic: "Modules must not use NEXT_PUBLIC_ environment variables.",
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === "string" && node.value.includes("NEXT_PUBLIC_")) {
              context.report({ node, messageId: "noNextPublic" });
            }
          },
        };
      },
    },
  },
};

module.exports = plugin;
