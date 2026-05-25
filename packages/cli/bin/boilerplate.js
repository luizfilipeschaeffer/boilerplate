#!/usr/bin/env bun
import { createSign, createHash, generateKeyPairSync, randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const cmd = process.argv[2];

if (cmd === "publish") {
  const moduleDir = process.argv[3] ?? process.cwd();
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
} else if (cmd === "init") {
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
  console.log("Generated publisher-keys.json — store private key securely");
} else {
  console.log("Usage: boilerplate publish [dir] | boilerplate init");
}
