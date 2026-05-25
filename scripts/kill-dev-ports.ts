const PORTS = [3000, 3002, 3003];

async function killOnWindows(port: number): Promise<void> {
  const proc = Bun.spawn(
    [
      "powershell",
      "-NoProfile",
      "-Command",
      `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Output $_ }`,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  const out = await new Response(proc.stdout).text();
  for (const line of out.trim().split(/\r?\n/)) {
    if (line) console.log(`[dev:stop] porta ${port} — encerrado PID ${line}`);
  }
  await proc.exited;
}

async function killOnUnix(port: number): Promise<void> {
  const proc = Bun.spawn(["sh", "-c", `lsof -ti :${port} | xargs -r kill -9`], {
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
  console.log(`[dev:stop] porta ${port} liberada`);
}

for (const port of PORTS) {
  if (process.platform === "win32") await killOnWindows(port);
  else await killOnUnix(port);
}

console.log("[dev:stop] pronto — rode bun run dev");
