#!/usr/bin/env bun
import { createSign, createHash, generateKeyPairSync, randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const [,, cmd, ...args] = process.argv;

async function cmdPublish() {
  const moduleDir = args[0] ?? process.cwd();
  const contractPath = join(moduleDir, "src", "contract.ts");
  const raw = await readFile(contractPath, "utf8");
  const idMatch = /id:\s*"([^"]+)"/.exec(raw);
  const versionMatch = /version:\s*"([^"]+)"/.exec(raw);
  const id = idMatch?.[1] ?? "unknown";
  const version = versionMatch?.[1] ?? "0.1.0";

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const manifest = {
    id,
    version,
    publisherDID: `did:boilerplate:${randomBytes(8).toString("hex")}`,
    capabilities: { database: true },
    permissions: [`${id}.read`],
    supportedCoreVersions: ["^1.2.0"],
    supportsContract: { module: "^1.2.0", events: "^2.0.0", sdk: "^3.0.0" },
    trustLevel: "community",
    npmPackage: `@boilerplate-community/${id}`,
    checksum: createHash("sha256").update(raw).digest("hex"),
    publishedAt: new Date().toISOString(),
  };

  const sign = createSign("SHA256");
  sign.update(JSON.stringify(manifest));
  sign.end();
  const signature = sign.sign(privateKey).toString("base64");

  const out = { ...manifest, signature, publicKey: publicKey.export({ type: "spki", format: "pem" }) };
  await mkdir(join(moduleDir, "dist"), { recursive: true });
  await writeFile(join(moduleDir, "dist", "manifest.json"), JSON.stringify(out, null, 2));
  console.log(`Published manifest for ${id}@${version}`);
}

async function cmdInit() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  await writeFile(
    "publisher-keys.json",
    JSON.stringify(
      {
        privateKey: privateKey.export({ type: "pkcs8", format: "pem" }),
        publicKey: publicKey.export({ type: "spki", format: "pem" }),
        did: `did:boilerplate:${randomBytes(8).toString("hex")}`,
      },
      null,
      2,
    ),
  );
  console.log("Generated publisher-keys.json");
}

async function cmdLicenseStatus() {
  const central = process.env.CENTRAL_API_URL ?? "http://localhost:3002";
  const id = process.env.INSTALLATION_ID;
  const key = process.env.INSTALLATION_KEY;
  if (!id || !key) {
    console.error("Configure INSTALLATION_ID e INSTALLATION_KEY");
    process.exit(1);
  }
  const res = await fetch(`${central}/api/v1/license/${id}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.json();
  console.log(JSON.stringify(body, null, 2));
}

async function cmdInstallationRegister() {
  const token = args[0] ?? process.env.INSTALLATION_TOKEN;
  const central = process.env.CENTRAL_API_URL ?? "http://localhost:3002";
  if (!token) {
    console.error("Usage: boilerplate installation register <token>");
    process.exit(1);
  }
  const res = await fetch(`${central}/api/v1/installations/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      installationToken: token,
      platformVersion: process.env.PLATFORM_VERSION ?? "0.1.0",
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(body);
    process.exit(1);
  }
  console.log("Registrado com sucesso:");
  console.log(`INSTALLATION_ID=${body.installationId}`);
  console.log(`INSTALLATION_KEY=${body.installationKey}`);
}

async function cmdDoctor() {
  const checks: { name: string; ok: boolean; detail?: string }[] = [];
  const central = process.env.CENTRAL_API_URL ?? "http://localhost:3002";
  try {
    const res = await fetch(`${central}/.well-known/openid-configuration`);
    checks.push({ name: "central_reachable", ok: res.ok });
  } catch (e) {
    checks.push({ name: "central_reachable", ok: false, detail: String(e) });
  }
  checks.push({
    name: "installation_configured",
    ok: Boolean(process.env.INSTALLATION_ID && process.env.INSTALLATION_KEY),
  });
  checks.push({
    name: "database_url",
    ok: Boolean(process.env.DATABASE_URL),
  });
  for (const c of checks) {
    console.log(`${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
  }
  if (checks.some((c) => !c.ok)) process.exit(1);
}

async function cmdUpdate() {
  console.log("Consultando updates…");
  const central = process.env.CENTRAL_API_URL ?? "http://localhost:3002";
  const key = process.env.INSTALLATION_KEY;
  if (!key) {
    console.error("INSTALLATION_KEY required");
    process.exit(1);
  }
  const res = await fetch(`${central}/api/v1/updates/platform`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}

async function cmdModules(installCmd, moduleId) {
  if (installCmd === "install" && moduleId) {
    console.log(`Instale o módulo ${moduleId} pelo painel Configurações → Módulos extras ou via server action.`);
    return;
  }
  console.log("Usage: boilerplate modules install <moduleId>");
}

if (cmd === "publish") await cmdPublish();
else if (cmd === "init") await cmdInit();
else if (cmd === "license" && args[0] === "status") await cmdLicenseStatus();
else if (cmd === "installation" && args[0] === "register") await cmdInstallationRegister();
else if (cmd === "doctor") await cmdDoctor();
else if (cmd === "update") await cmdUpdate();
else if (cmd === "modules") await cmdModules(args[0], args[1]);
else if (cmd === "login") {
  console.log("Abra o browser para login OAuth na plataforma central.");
} else {
  console.log(`Usage:
  boilerplate init
  boilerplate publish [dir]
  boilerplate installation register <token>
  boilerplate license status
  boilerplate modules install <id>
  boilerplate update
  boilerplate doctor
  boilerplate login`);
}
