import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createConnection, createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = join(
  import.meta.dirname,
  "../scripts/stop-owned-vinext-dev.mjs",
);

function runStop(root: string, lock: string) {
  return spawnSync(process.execPath, [script, "--root", root, "--lock", lock], {
    encoding: "utf8",
  });
}

function lockInfo(pid: number, cwd: string, port: number) {
  return {
    pid,
    port,
    hostname: "127.0.0.1",
    appUrl: `http://127.0.0.1:${port}`,
    startedAt: Date.now(),
    cwd,
  };
}

function writeLock(root: string, info: ReturnType<typeof lockInfo>) {
  const directory = join(root, ".vinext", "dev");
  mkdirSync(directory, { recursive: true });
  const lock = join(directory, "lock.json");
  writeFileSync(lock, JSON.stringify(info));
  return lock;
}

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
  try {
    const state = readFileSync(`/proc/${pid}/status`, "utf8").match(
      /^State:\s+(\S+)/m,
    )?.[1];
    return state !== "Z" && state !== "X";
  } catch {
    return false;
  }
}

function killPid(pid: number | undefined) {
  if (!pid || !isAlive(pid)) return;
  try {
    process.kill(pid, "SIGKILL");
  } catch {
    // The process can exit between the liveness check and the signal.
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function childPids(pid: number) {
  const children: number[] = [];
  for (const entry of readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    let status: string;
    try {
      status = readFileSync(`/proc/${entry}/status`, "utf8");
    } catch {
      continue;
    }
    const parent = Number(status.match(/^PPid:\s+(\d+)/m)?.[1] ?? 0);
    if (parent === pid) children.push(Number(entry));
  }
  return children;
}

function processGroup(pid: number) {
  const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
  const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
  return Number(fields[2]);
}

async function portAccepts(port: number) {
  return await new Promise<boolean>((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const finish = (open: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

function listenOn(port: number) {
  return new Promise<boolean>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function waitForLock(lock: string) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (existsSync(lock)) {
      return JSON.parse(readFileSync(lock, "utf8")) as {
        pid: number;
        port: number;
      };
    }
    await sleep(50);
  }
  throw new Error(`lock was not written at ${lock}`);
}

describe("owned vinext dev server stop", () => {
  it("does nothing when this checkout has no dev lock", () => {
    const root = mkdtempSync(join(tmpdir(), "pokguy-vinext-stop-"));
    try {
      const result = runStop(root, join(root, ".vinext/dev/lock.json"));
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("No owned vinext dev server is running.");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("removes a stale lock when the recorded pid is already gone", async () => {
    const root = mkdtempSync(join(tmpdir(), "pokguy-vinext-stop-"));
    const child = spawn(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      {
        cwd: root,
        stdio: "ignore",
      },
    );
    const pid = child.pid;
    if (!pid) throw new Error("failed to start a process");
    try {
      child.kill("SIGKILL");
      await new Promise((resolve) => child.once("exit", resolve));
      const lock = writeLock(root, lockInfo(pid, root, 0));
      const result = runStop(root, lock);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        `Removed stale vinext dev lock for pid ${pid}.`,
      );
      expect(existsSync(lock)).toBe(false);
    } finally {
      killPid(pid);
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not stop a server recorded for a different directory", () => {
    const root = mkdtempSync(join(tmpdir(), "pokguy-vinext-stop-"));
    const other = mkdtempSync(join(tmpdir(), "pokguy-vinext-other-"));
    const child = spawn(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      {
        cwd: other,
        stdio: "ignore",
      },
    );
    const pid = child.pid;
    try {
      if (!pid) throw new Error("failed to start a process");
      const lock = writeLock(root, lockInfo(pid, other, 0));
      const result = runStop(root, lock);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("is not this checkout");
      expect(isAlive(pid)).toBe(true);
      expect(existsSync(lock)).toBe(true);
    } finally {
      killPid(pid);
      rmSync(root, { recursive: true, force: true });
      rmSync(other, { recursive: true, force: true });
    }
  });

  it("does not stop a live pid working outside this checkout", () => {
    const root = mkdtempSync(join(tmpdir(), "pokguy-vinext-stop-"));
    const other = mkdtempSync(join(tmpdir(), "pokguy-vinext-other-"));
    const child = spawn(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      {
        cwd: other,
        stdio: "ignore",
      },
    );
    const pid = child.pid;
    try {
      if (!pid) throw new Error("failed to start a process");
      const lock = writeLock(root, lockInfo(pid, root, 0));
      const result = runStop(root, lock);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("working directory");
      expect(isAlive(pid)).toBe(true);
    } finally {
      killPid(pid);
      rmSync(root, { recursive: true, force: true });
      rmSync(other, { recursive: true, force: true });
    }
  });

  it("stops the dev process recorded for this checkout", () => {
    const root = mkdtempSync(join(tmpdir(), "pokguy-vinext-stop-"));
    const child = spawn(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      {
        cwd: root,
        stdio: "ignore",
      },
    );
    const pid = child.pid;
    try {
      if (!pid) throw new Error("failed to start a process");
      const lock = writeLock(root, lockInfo(pid, root, 0));
      const result = runStop(root, lock);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        `Stopping owned vinext dev server pid ${pid}`,
      );
      expect(isAlive(pid)).toBe(false);
      expect(existsSync(lock)).toBe(false);
    } finally {
      killPid(pid);
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not signal an ancestor process in this checkout", () => {
    const root = mkdtempSync(join(tmpdir(), "pokguy-vinext-stop-"));
    const lock = join(root, ".vinext", "dev", "lock.json");
    mkdirSync(join(root, ".vinext", "dev"), { recursive: true });
    const wrapper = join(root, "wrapper.mjs");
    writeFileSync(
      wrapper,
      [
        'import { spawnSync } from "node:child_process";',
        'import { writeFileSync } from "node:fs";',
        "const [root, lock, script] = process.argv.slice(2);",
        "writeFileSync(lock, JSON.stringify({",
        "  pid: process.pid,",
        "  port: 0,",
        '  hostname: "127.0.0.1",',
        '  appUrl: "http://127.0.0.1:0",',
        "  startedAt: Date.now(),",
        "  cwd: root,",
        "}));",
        "const result = spawnSync(process.execPath, [script, '--root', root, '--lock', lock], { encoding: 'utf8' });",
        "process.stdout.write(JSON.stringify({ status: result.status, stderr: result.stderr }));",
      ].join("\n"),
    );
    try {
      const result = spawnSync(
        process.execPath,
        [wrapper, root, lock, script],
        {
          cwd: root,
          encoding: "utf8",
        },
      );
      expect(result.status).toBe(0);
      const reported = JSON.parse(result.stdout) as {
        status: number;
        stderr: string;
      };
      expect(reported.status).toBe(1);
      expect(reported.stderr).toContain("ancestor");
      expect(existsSync(lock)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("stops a detached listener left behind by this checkout's dev process", async () => {
    const root = mkdtempSync(join(tmpdir(), "pokguy-vinext-stop-"));
    const lock = join(root, ".vinext", "dev", "lock.json");
    mkdirSync(join(root, ".vinext", "dev"), { recursive: true });
    const listener = join(root, "listener.mjs");
    const parent = join(root, "parent.mjs");
    writeFileSync(
      listener,
      [
        'import { createServer } from "node:http";',
        "const server = createServer((_request, response) => response.end('ok'));",
        'server.listen(0, "127.0.0.1", () => {',
        "  const address = server.address();",
        '  if (!address || typeof address === "string") process.exit(1);',
        "  process.stdout.write(String(address.port));",
        "});",
      ].join("\n"),
    );
    writeFileSync(
      parent,
      [
        'import { spawn } from "node:child_process";',
        'import { writeFileSync } from "node:fs";',
        "const [lockPath, cwd, listenerPath] = process.argv.slice(2);",
        "const child = spawn(process.execPath, [listenerPath], {",
        "  cwd,",
        "  detached: true,",
        '  stdio: ["ignore", "pipe", "inherit"],',
        "});",
        "child.unref();",
        'let buffered = "";',
        "child.stdout.on('data', (chunk) => {",
        "  buffered += chunk.toString();",
        "  const port = Number(buffered.trim());",
        "  if (!Number.isInteger(port) || port <= 0) return;",
        "  writeFileSync(lockPath, JSON.stringify({",
        "    pid: process.pid,",
        "    port,",
        '    hostname: "127.0.0.1",',
        "    appUrl: `http://127.0.0.1:${port}`,",
        "    startedAt: Date.now(),",
        "    cwd,",
        "  }));",
        "});",
        "setInterval(() => {}, 1000);",
      ].join("\n"),
    );
    const child = spawn(process.execPath, [parent, lock, root, listener], {
      cwd: root,
      stdio: "ignore",
    });
    const parentPid = child.pid;
    let listenerPid: number | undefined;
    try {
      if (!parentPid) throw new Error("failed to start the dev process");
      const info = await waitForLock(lock);
      expect(info.pid).toBe(parentPid);
      expect(await portAccepts(info.port)).toBe(true);
      listenerPid = childPids(parentPid).find(
        (pid) => processGroup(pid) === pid,
      );
      expect(listenerPid).toBeDefined();
      expect(processGroup(listenerPid!)).not.toBe(processGroup(parentPid));

      const result = runStop(root, lock);
      expect(result.status, result.stderr).toBe(0);
      expect(isAlive(parentPid)).toBe(false);
      expect(isAlive(listenerPid!)).toBe(false);
      expect(await portAccepts(info.port)).toBe(false);
      expect(existsSync(lock)).toBe(false);
      await expect(listenOn(info.port)).resolves.toBe(true);
    } finally {
      killPid(listenerPid);
      killPid(parentPid);
      rmSync(root, { recursive: true, force: true });
    }
  }, 20_000);
});
