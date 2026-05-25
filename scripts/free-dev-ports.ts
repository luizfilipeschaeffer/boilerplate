/**
 * Libera portas dos apps Next.js antes do `bun run dev` (Windows).
 */
const PORTS = [3000, 3002, 3003];

if (process.platform === "win32") {
  for (const port of PORTS) {
    try {
      const out = Bun.spawnSync({
        cmd: [
          "powershell",
          "-NoProfile",
          "-Command",
          `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
        ],
        stdout: "pipe",
        stderr: "ignore",
      });
      const pids = new TextDecoder()
        .decode(out.stdout)
        .trim()
        .split(/\s+/)
        .filter((pid) => /^\d+$/.test(pid));
      for (const pid of pids) {
        Bun.spawnSync({ cmd: ["taskkill", "/PID", pid, "/F"], stderr: "ignore" });
        console.log(`[dev] Porta ${port} liberada (PID ${pid})`);
      }
    } catch {
      // porta livre
    }
  }
}
