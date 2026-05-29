#!/usr/bin/env bun
/**
 * Pipeline local → commit/push → monitora GitHub Actions até estabilizar.
 *
 * Uso:
 *   bun run release:gate                    # só CI local (loop até passar)
 *   bun run release:gate -- --push          # local OK → commit + push → aguarda GH
 *   bun run release:gate -- --push --auto-fix  # tenta agente após falha (ver env abaixo)
 *
 * Auto-correção (opcional):
 *   $env:RELEASE_GATE_AGENT_CMD = 'cursor agent -p --force'
 *   bun run release:gate -- --push --auto-fix
 *
 * Requer `gh` autenticado para fase remota (--push).
 */
import { spawn, spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const ARTIFACTS = join(ROOT, "artifacts", "release-gate");

type Args = {
  push: boolean;
  autoFix: boolean;
  maxCycles: number;
  commitMessage: string;
  workflows: string[];
  pollSeconds: number;
  startDocker: boolean;
  skipCommit: boolean;
  agentCmd: string | null;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    push: false,
    autoFix: false,
    maxCycles: 15,
    commitMessage: "chore: release gate — CI estável",
    workflows: ["ci.yml", "docker-publish.yml"],
    pollSeconds: 20,
    startDocker: true,
    skipCommit: false,
    agentCmd: process.env.RELEASE_GATE_AGENT_CMD?.trim() || null,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--push") out.push = true;
    else if (a === "--auto-fix") out.autoFix = true;
    else if (a === "--skip-commit") out.skipCommit = true;
    else if (a === "--no-docker") out.startDocker = false;
    else if (a === "--max-cycles" && argv[i + 1]) out.maxCycles = Number(argv[++i]);
    else if (a === "--message" && argv[i + 1]) out.commitMessage = argv[++i];
    else if (a === "--workflows" && argv[i + 1])
      out.workflows = argv[++i].split(",").map((w) => w.trim()).filter(Boolean);
    else if (a === "--poll" && argv[i + 1]) out.pollSeconds = Number(argv[++i]);
    else if (a === "--agent-cmd" && argv[i + 1]) out.agentCmd = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log(`release-gate — local CI, push opcional, monitora Actions

Flags:
  --push              Commit (se houver mudanças) + push + aguarda workflows
  --auto-fix          Após falha, chama RELEASE_GATE_AGENT_CMD ou pausa manual
  --skip-commit       Só push do que já está commitado
  --no-docker         Não sobe Postgres local (infra/docker)
  --max-cycles N      Limite de tentativas (default 15)
  --message "texto"   Mensagem do commit
  --workflows a,b     Workflows a monitorar (default: ci.yml,docker-publish.yml)
  --poll N            Intervalo em segundos ao aguardar GH (default 20)
  --agent-cmd "..."   Comando do agente (sobrescreve env)
`);
      process.exit(0);
    }
  }
  return out;
}

function run(
  label: string,
  cmd: string[],
  opts?: { cwd?: string; env?: NodeJS.ProcessEnv; shell?: boolean },
): { ok: boolean; code: number; log: string } {
  const logPath = join(ARTIFACTS, `${label.replace(/[^\w.-]+/g, "_")}.log`);
  mkdirSync(ARTIFACTS, { recursive: true });

  const useShell = opts?.shell ?? process.platform === "win32";
  const result = spawnSync(cmd[0], cmd.slice(1), {
    cwd: opts?.cwd ?? ROOT,
    env: { ...process.env, ...opts?.env, FORCE_COLOR: "1" },
    encoding: "utf8",
    shell: useShell,
    maxBuffer: 64 * 1024 * 1024,
  });

  const combined = [result.stdout ?? "", result.stderr ?? ""].filter(Boolean).join("\n");
  writeFileSync(logPath, combined, "utf8");
  const code = result.status ?? 1;
  return { ok: code === 0, code, log: logPath };
}

/** CI longo: espelha saída no terminal e grava em artifacts/release-gate/*.log */
async function runStreaming(
  label: string,
  cmd: string[],
  opts?: { cwd?: string; env?: NodeJS.ProcessEnv; shell?: boolean },
): Promise<{ ok: boolean; code: number; log: string }> {
  const logPath = join(ARTIFACTS, `${label.replace(/[^\w.-]+/g, "_")}.log`);
  mkdirSync(ARTIFACTS, { recursive: true });
  const logStream = createWriteStream(logPath);

  return new Promise((resolve) => {
    const useShell = opts?.shell ?? process.platform === "win32";
    const child = spawn(cmd[0], cmd.slice(1), {
      cwd: opts?.cwd ?? ROOT,
      env: { ...process.env, ...opts?.env, FORCE_COLOR: "1" },
      shell: useShell,
      stdio: ["inherit", "pipe", "pipe"],
    });

    child.stdout?.on("data", (chunk: Buffer) => {
      process.stdout.write(chunk);
      logStream.write(chunk);
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(chunk);
      logStream.write(chunk);
    });

    child.on("error", (err) => {
      const msg = `\n[release-gate] spawn error: ${err.message}\n`;
      process.stderr.write(msg);
      logStream.write(msg);
      logStream.end();
      resolve({ ok: false, code: 1, log: logPath });
    });

    child.on("close", (code) => {
      logStream.end();
      resolve({ ok: (code ?? 1) === 0, code: code ?? 1, log: logPath });
    });
  });
}

function hasCmd(name: string): boolean {
  const which = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(which, [name], { encoding: "utf8", shell: true });
  return r.status === 0;
}

function git(args: string[]): { ok: boolean; out: string } {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8", shell: true });
  const out = [r.stdout, r.stderr].filter(Boolean).join("\n").trim();
  return { ok: (r.status ?? 1) === 0, out };
}

function currentBranch(): string {
  const { ok, out } = git(["branch", "--show-current"]);
  if (!ok || !out) throw new Error("Não foi possível detectar o branch atual.");
  return out;
}

function resolveLocalDatabaseUrl(): string {
  for (const rel of [".env.development", "bkp/.env.development", ".env"]) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("DATABASE_URL=")) continue;
      let value = trimmed.slice("DATABASE_URL=".length).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (value) return value;
    }
  }

  const composePath = join(ROOT, "infra/docker/docker-compose.yml");
  if (existsSync(composePath)) {
    const compose = readFileSync(composePath, "utf8");
    const portMatch = compose.match(/"(\d+):5432"/);
    if (portMatch) {
      return `postgresql://boilerplate:boilerplate@localhost:${portMatch[1]}/boilerplate`;
    }
  }

  return "postgresql://boilerplate:boilerplate@localhost:5432/boilerplate";
}

const CI_DB_NAME = "boilerplate_ci";

function toCiDatabaseUrl(devUrl: string): string {
  if (devUrl.includes(`/${CI_DB_NAME}`)) return devUrl;
  return devUrl.replace(/\/([^/?]+)(\?.*)?$/, `/${CI_DB_NAME}$2`);
}

function ensureCiDatabaseExists(databaseUrl: string): void {
  const dbName = databaseUrl.match(/\/([^/?]+)(\?|$)/)?.[1] ?? CI_DB_NAME;
  const dockerArgs = ["exec", "boilerplate-postgres", "psql", "-U", "boilerplate", "-d", "postgres"];

  const check = spawnSync("docker", [...dockerArgs, "-tAc", `SELECT 1 FROM pg_database WHERE datname='${dbName}'`], {
    encoding: "utf8",
    shell: false,
  });
  if (check.stdout?.trim() === "1") {
    console.log(`[release-gate] DB ${dbName} pronto`);
    return;
  }

  const create = spawnSync(
    "docker",
    [...dockerArgs, "-c", `CREATE DATABASE ${dbName} OWNER boilerplate`],
    { encoding: "utf8", shell: false },
  );
  if ((create.status ?? 1) !== 0 && !/already exists/i.test(`${create.stdout}${create.stderr}`)) {
    console.warn(`[release-gate] Aviso: não foi possível criar DB ${dbName}.`);
  } else {
    console.log(`[release-gate] DB ${dbName} criado`);
  }
}

function upsertEnvVar(envPath: string, key: string, value: string): void {
  const lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];
  let found = false;
  const next = lines.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) next.push(`${key}=${value}`);
  writeFileSync(envPath, `${next.join("\n").replace(/\n+$/, "")}\n`, "utf8");
}

function ensureCiEnvFile(): string {
  const envPath = join(ROOT, ".env");
  const devUrl = resolveLocalDatabaseUrl();
  const databaseUrl = toCiDatabaseUrl(devUrl);

  const authSecret = "ci-only-secret-do-not-use-in-production";
  const integratorKey = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

  process.env.DATABASE_URL = databaseUrl;
  process.env.AUTH_SECRET = process.env.AUTH_SECRET?.trim() || authSecret;
  process.env.INTEGRATOR_ENCRYPTION_KEY =
    process.env.INTEGRATOR_ENCRYPTION_KEY?.trim() || integratorKey;

  if (!existsSync(envPath) || !readFileSync(envPath, "utf8").includes("AUTH_SECRET=")) {
    upsertEnvVar(envPath, "AUTH_SECRET", authSecret);
  }
  if (!existsSync(envPath) || !readFileSync(envPath, "utf8").includes("INTEGRATOR_ENCRYPTION_KEY=")) {
    upsertEnvVar(envPath, "INTEGRATOR_ENCRYPTION_KEY", integratorKey);
  }

  console.log(`[release-gate] DATABASE_URL → ${databaseUrl} (DB isolado para CI local)`);
  return databaseUrl;
}

function ensurePostgresForCi(startDocker: boolean): void {
  if (!startDocker) return;
  const url = process.env.DATABASE_URL ?? resolveLocalDatabaseUrl();
  const isLocal = /localhost|127\.0\.0\.1/.test(url);
  if (!isLocal) {
    console.log("[release-gate] DATABASE_URL não é local — pulando docker compose.");
    return;
  }
  console.log("[release-gate] ▶ Postgres local (docker compose)");
  const up = run("db-up", ["bun", "run", "db:up"]);
  if (!up.ok) {
    console.warn("[release-gate] Aviso: db:up falhou — testes de DB podem ser skipped.");
    return;
  }

  const ready = run("db-wait", ["docker", "exec", "boilerplate-postgres", "pg_isready", "-U", "boilerplate", "-d", "boilerplate"], {
    shell: false,
  });
  if (!ready.ok) {
    console.warn("[release-gate] Postgres ainda não respondeu ao pg_isready.");
  }

  const ciUrl = process.env.DATABASE_URL;
  if (ciUrl) ensureCiDatabaseExists(ciUrl);
}

async function runLocalCi(databaseUrl: string): Promise<{ ok: boolean; log: string }> {
  console.log("\n[release-gate] ▶ CI local (bun run ci:local)");
  console.log(
    "[release-gate]   Pode levar vários minutos — pare `bun run dev` antes (evita EPERM no Prisma no Windows).",
  );
  console.log("[release-gate]   Saída em tempo real:\n");
  return runStreaming("local-ci", ["bun", "run", "ci:local"], {
    env: { DATABASE_URL: databaseUrl },
  });
}

async function waitForEnter(message: string): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await new Promise<void>((resolve) => {
    rl.question(`${message}\n> Pressione Enter para tentar de novo... `, () => {
      rl.close();
      resolve();
    });
  });
}

function invokeAgentFix(logPath: string, agentCmd: string): boolean {
  const promptPath = join(ARTIFACTS, "agent-prompt.md");
  const prompt = [
    "Corrija o repositório boilerplate para o release-gate passar.",
    "",
    `Log da falha: ${logPath}`,
    "",
    "Regras:",
    "- Mudança mínima e focada na causa do erro.",
    "- Não commitar secrets.",
    "- Manter convenções do monorepo.",
    "- Após corrigir, o script rerodará o CI local automaticamente.",
  ].join("\n");
  writeFileSync(promptPath, prompt, "utf8");

  console.log(`\n[release-gate] ▶ Agente: ${agentCmd}`);
  const parts = agentCmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [agentCmd];
  const bin = parts[0]?.replace(/^["']|["']$/g, "") ?? agentCmd;
  const args = parts.slice(1).map((p) => p.replace(/^["']|["']$/g, ""));

  if (bin.includes("agent") || bin === "cursor") {
    args.push(prompt);
  } else {
    args.push(promptPath);
  }

  const r = spawnSync(bin, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  return (r.status ?? 1) === 0;
}

async function handleFailure(
  kind: "local" | "remote",
  logPath: string,
  args: Args,
): Promise<void> {
  console.error(`\n[release-gate] ✗ Falha ${kind === "local" ? "CI local" : "GitHub Actions"}`);
  console.error(`[release-gate] Log: ${logPath}`);

  if (!args.autoFix) {
    throw new Error("Corrija o erro e rode novamente com os mesmos flags.");
  }

  if (args.agentCmd) {
    invokeAgentFix(logPath, args.agentCmd);
    return;
  }

  console.log(
    "[release-gate] Defina RELEASE_GATE_AGENT_CMD ou --agent-cmd para correção automática.",
  );
  await waitForEnter("[release-gate] Modo manual");
}

function commitAndPush(message: string, skipCommit: boolean): void {
  if (!skipCommit) {
    const status = git(["status", "--porcelain"]);
    if (!status.ok) throw new Error(status.out);
    if (!status.out.trim()) {
      console.log("[release-gate] Nenhuma mudança para commit.");
    } else {
      console.log("[release-gate] ▶ git add + commit");
      const add = git(["add", "-A"]);
      if (!add.ok) throw new Error(add.out);
      const commit = spawnSync("git", ["commit", "-m", message], {
        cwd: ROOT,
        stdio: "inherit",
        shell: true,
      });
      if ((commit.status ?? 1) !== 0) {
        throw new Error("git commit falhou.");
      }
    }
  }

  const branch = currentBranch();
  console.log(`[release-gate] ▶ git push origin ${branch}`);
  const push = git(["push", "-u", "origin", branch]);
  if (!push.ok) throw new Error(push.out || "git push falhou");
}

type GhRun = { databaseId: number; status: string; conclusion: string | null; workflowName: string };

function listRecentRuns(branch: string, workflowFile: string): GhRun[] {
  const r = spawnSync(
    "gh",
    [
      "run",
      "list",
      "--branch",
      branch,
      "--workflow",
      workflowFile,
      "--limit",
      "5",
      "--json",
      "databaseId,status,conclusion,workflowName,createdAt",
    ],
    { cwd: ROOT, encoding: "utf8", shell: true },
  );
  if (r.status !== 0) return [];
  try {
    return JSON.parse(r.stdout ?? "[]") as GhRun[];
  } catch {
    return [];
  }
}

async function waitForWorkflows(
  branch: string,
  workflows: string[],
  pollSeconds: number,
  afterMs: number,
): Promise<{ ok: boolean; failedLog: string }> {
  const pending = new Set(workflows);
  const conclusions = new Map<string, string>();

  console.log(`\n[release-gate] Aguardando workflows em origin/${branch}...`);

  while (pending.size > 0) {
    for (const wf of [...pending]) {
      const runs = listRecentRuns(branch, wf);
      const run = runs.find((r) => {
        const created = (r as GhRun & { createdAt?: string }).createdAt;
        if (!created) return true;
        return new Date(created).getTime() >= afterMs - 60_000;
      });
      if (!run) {
        console.log(`[release-gate]   ${wf}: ainda sem run visível...`);
        continue;
      }
      if (run.status !== "completed") {
        console.log(`[release-gate]   ${wf}: ${run.status}...`);
        continue;
      }
      conclusions.set(wf, run.conclusion ?? "failure");
      pending.delete(wf);
      const icon = run.conclusion === "success" ? "✓" : "✗";
      console.log(`[release-gate]   ${icon} ${wf}: ${run.conclusion}`);
    }

    if (pending.size > 0) {
      await Bun.sleep(pollSeconds * 1000);
    }
  }

  const failed = workflows.filter((w) => conclusions.get(w) !== "success");
  if (failed.length === 0) return { ok: true, failedLog: "" };

  const logParts: string[] = [];
  for (const wf of failed) {
    const runs = listRecentRuns(branch, wf);
    const run = runs[0];
    if (!run) continue;
    const logPath = join(ARTIFACTS, `gh-${wf.replace(/\W/g, "_")}.log`);
    const view = spawnSync(
      "gh",
      ["run", "view", String(run.databaseId), "--log-failed"],
      { cwd: ROOT, encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 },
    );
    const text = [view.stdout, view.stderr].filter(Boolean).join("\n");
    writeFileSync(logPath, text, "utf8");
    logParts.push(logPath);
    console.error(`[release-gate] Log remoto (${wf}): ${logPath}`);
  }

  return { ok: false, failedLog: logParts[0] ?? join(ARTIFACTS, "remote-failure.log") };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  mkdirSync(ARTIFACTS, { recursive: true });

  console.log("[release-gate] Boilerplate — local CI → push → GitHub → Docker");
  console.log(`[release-gate] Artefatos: ${ARTIFACTS}`);

  if (args.push && !hasCmd("gh")) {
    console.error(
      "[release-gate] `gh` não encontrado. Instale: https://cli.github.com/ e rode `gh auth login`",
    );
    process.exit(1);
  }

  for (let cycle = 1; cycle <= args.maxCycles; cycle++) {
    console.log(`\n[release-gate] ═══ Ciclo ${cycle}/${args.maxCycles} ═══`);

    const databaseUrl = ensureCiEnvFile();
    ensurePostgresForCi(args.startDocker);

    const local = await runLocalCi(databaseUrl);
    if (!local.ok) {
      await handleFailure("local", local.log, args);
      continue;
    }
    console.log("[release-gate] ✓ CI local OK");

    if (!args.push) {
      console.log("\n[release-gate] Concluído (modo local). Use --push para enviar ao GitHub.");
      process.exit(0);
    }

    const pushStartedAt = Date.now();
    commitAndPush(args.commitMessage, args.skipCommit);

    const remote = await waitForWorkflows(
      currentBranch(),
      args.workflows,
      args.pollSeconds,
      pushStartedAt,
    );

    if (!remote.ok) {
      await handleFailure("remote", remote.failedLog, args);
      continue;
    }

    console.log("\n[release-gate] ✓ CI local + GitHub Actions OK");
    if (args.workflows.includes("docker-publish.yml")) {
      console.log(
        "[release-gate] Imagens Docker: publicadas no push em main (secrets DOCKER_*).",
      );
      console.log("[release-gate] Veja .github/DOCKER_PUBLISH.md");
    }
    process.exit(0);
  }

  console.error(`\n[release-gate] Limite de ${args.maxCycles} ciclos atingido.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(`[release-gate] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
