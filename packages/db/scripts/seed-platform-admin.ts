import { loadMonorepoEnv } from "./load-monorepo-env";

const loaded = loadMonorepoEnv();
if (loaded.length > 0) {
  console.log(`[seed] env: ${loaded.join(" → ")}`);
}

assertSeedAllowed();

const email = process.env.PLATFORM_ADMIN_SEED_EMAIL?.trim().toLowerCase();
const password = process.env.PLATFORM_ADMIN_SEED_PASSWORD;
const name = process.env.PLATFORM_ADMIN_SEED_NAME?.trim() || "Super Admin";

if (!email) {
  fail(
    "Defina PLATFORM_ADMIN_SEED_EMAIL no .env.development (não use valor padrão no código).",
  );
}

if (!password) {
  fail(
    [
      "Defina PLATFORM_ADMIN_SEED_PASSWORD no .env.development (gitignored).",
      "Nunca commite senhas reais no repositório.",
    ].join("\n"),
  );
}

if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL ausente. Verifique .env / .env.development.");
}

const { upsertPlatformUser } = await import("../src/platform-user");

const user = await upsertPlatformUser({
  email,
  name,
  role: "platform_admin",
  password,
});

console.log(`[seed-platform-admin] OK — ${user.email} (${user.role})`);

function assertSeedAllowed(): void {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";

  if (!isProduction) return;

  if (process.env.ALLOW_PLATFORM_ADMIN_SEED !== "true") {
    fail(
      [
        "Seed de platform-admin bloqueado em NODE_ENV=production.",
        "",
        "Em produção, crie o primeiro operador por processo controlado (CI com secret,",
        "console do provedor ou convite manual) — não use senha fixa em .env.",
        "",
        "Se for bootstrap deliberado em ambiente isolado (ex.: staging efêmero), defina",
        "explicitamente: ALLOW_PLATFORM_ADMIN_SEED=true",
        "e injete PLATFORM_ADMIN_SEED_EMAIL / PLATFORM_ADMIN_SEED_PASSWORD via secrets do CI.",
      ].join("\n"),
    );
  }

  console.warn(
    "[seed-platform-admin] AVISO: executando seed em production com ALLOW_PLATFORM_ADMIN_SEED=true",
  );
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
