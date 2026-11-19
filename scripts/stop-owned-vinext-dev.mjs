import {
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

// vinext 1.0.1 writes <root>/.vinext/dev/lock.json and refuses a second
// `vite dev` while that pid is alive. Playwright's webServer teardown can
// return while this pid is still running, which blocks the next suite.
const LOCK_RELATIVE = ".vinext/dev/lock.json";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  let root = repoRoot;
  let lockPath;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      root = argv[index + 1];
      index += 1;
    } else if (arg === "--lock") {
      lockPath = argv[index + 1];
      index += 1;
    } else {
      fail(`Unknown argument ${arg}`);
    }
    if (root === undefined || (arg === "--lock" && lockPath === undefined)) {
      fail(`Missing value for ${arg}`);
    }
  }
  let resolvedRoot;
  try {
    resolvedRoot = realpathSync(root);
  } catch (error) {
    fail(`Cannot resolve --root ${root}: ${errorMessage(error)}`);
  }
  return {
    root: resolvedRoot,
    lockPath: resolve(lockPath ?? resolve(resolvedRoot, LOCK_RELATIVE)),
  };
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function readLock(lockPath) {
  let content;
  try {
    content = readFileSync(lockPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") return { state: "missing" };
    fail(`Cannot read ${lockPath}: ${errorMessage(error)}`);
  }
  try {
    const parsed = JSON.parse(content);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Number.isInteger(parsed.pid) ||
      !Number.isInteger(parsed.port) ||
      typeof parsed.cwd !== "string" ||
      typeof parsed.appUrl !== "string"
    ) {
      return { state: "invalid" };
    }
    return { state: "ok", info: parsed };
  } catch {
    return { state: "invalid" };
  }
}

function sameDirectory(left, right) {
  try {
    return realpathSync(left) === realpathSync(right);
  } catch {
    return false;
  }
}

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
  } catch (error) {
    // EPERM means the process exists but this user cannot signal it.
    return Boolean(error && error.code === "EPERM");
  }
  // A zombie still accepts signal 0 until its parent reaps it. Playwright's
  // parent can be blocked in spawnSync, so the exited dev server stays in
  // State Z. It no longer holds the port or the vinext lock.
  const state = readStatus(pid)?.match(/^State:\s+(\S+)/m)?.[1];
  return state !== "Z" && state !== "X";
}

function readStatus(pid) {
  try {
    return readFileSync(`/proc/${pid}/status`, "utf8");
  } catch {
    return undefined;
  }
}

function parentPid(pid) {
  const status = readStatus(pid);
  const match = status?.match(/^PPid:\s+(\d+)/m);
  return match ? Number(match[1]) : 0;
}

function protectedPids() {
  const protectedIds = new Set([0, 1, process.pid]);
  let current = process.pid;
  const seen = new Set();
  while (current > 1 && !seen.has(current)) {
    seen.add(current);
    protectedIds.add(current);
    current = parentPid(current);
  }
  return protectedIds;
}

function childPids(pid) {
  let entries;
  try {
    entries = readdirSync("/proc");
  } catch {
    return [];
  }
  const children = [];
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    if (parentPid(Number(entry)) === pid) children.push(Number(entry));
  }
  return children;
}

function processTree(pid) {
  const ordered = [];
  const visit = (current) => {
    for (const child of childPids(current)) visit(child);
    ordered.push(current);
  };
  visit(pid);
  return ordered;
}

function processCwd(pid) {
  try {
    return realpathSync(`/proc/${pid}/cwd`);
  } catch {
    return undefined;
  }
}

function cwdIsCheckout(cwd, root) {
  return cwd === root || cwd?.startsWith(`${root}${sep}`) === true;
}

function listeningPids(port) {
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return [];
  const hexPort = port.toString(16).toUpperCase().padStart(4, "0");
  const inodes = new Set();
  for (const file of ["/proc/net/tcp", "/proc/net/tcp6"]) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of text.trim().split("\n").slice(1)) {
      const parts = line.trim().split(/\s+/);
      const localPort = parts[1]?.split(":").at(-1)?.toUpperCase();
      // 0A is TCP_LISTEN.
      if (localPort === hexPort && parts[3] === "0A" && parts[9]) {
        inodes.add(parts[9]);
      }
    }
  }
  if (inodes.size === 0) return [];
  let entries;
  try {
    entries = readdirSync("/proc");
  } catch {
    return [];
  }
  const pids = [];
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    let fds;
    try {
      fds = readdirSync(`/proc/${entry}/fd`);
    } catch {
      continue;
    }
    for (const fd of fds) {
      try {
        const target = readlinkSync(`/proc/${entry}/fd/${fd}`);
        if (target.startsWith("socket:[") && inodes.has(target.slice(8, -1))) {
          pids.push(Number(entry));
          break;
        }
      } catch {
        // The fd can disappear while we scan.
      }
    }
  }
  return pids;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function signalPid(pid, signal) {
  try {
    process.kill(pid, signal);
  } catch (error) {
    if (error && error.code === "ESRCH") return;
    fail(`Failed to signal pid ${pid} with ${signal}: ${errorMessage(error)}`);
  }
}

function waitUntil(predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    sleep(50);
  }
  return predicate();
}

function releaseLock(lockPath, pid) {
  const current = readLock(lockPath);
  if (current.state === "ok" && current.info.pid === pid) {
    try {
      rmSync(lockPath);
    } catch (error) {
      if (error && error.code !== "ENOENT") {
        fail(
          `Stopped pid ${pid} but could not remove ${lockPath}: ${errorMessage(error)}`,
        );
      }
    }
  }
}

function unique(values) {
  return [...new Set(values)];
}

function stopOwnedServer(root, lockPath) {
  const lock = readLock(lockPath);
  if (lock.state === "missing") {
    console.log("No owned vinext dev server is running.");
    return;
  }
  if (lock.state === "invalid") {
    console.log(`Ignoring unreadable vinext dev lock ${lockPath}.`);
    return;
  }

  const { info } = lock;
  if (!sameDirectory(info.cwd, root)) {
    fail(
      `Refusing to stop vinext dev server pid ${info.pid}: lock directory ${info.cwd} is not this checkout (${root}).`,
    );
  }

  const protectedIds = protectedPids();
  const ownedListeners = () =>
    listeningPids(info.port).filter((pid) =>
      cwdIsCheckout(processCwd(pid), root),
    );

  if (!isPidAlive(info.pid)) {
    const listeners = ownedListeners();
    if (listeners.some((pid) => protectedIds.has(pid))) {
      fail(
        `Refusing to stop pid ${listeners.join(", ")} on port ${info.port} because it includes this process or an ancestor.`,
      );
    }
    if (listeners.length > 0) {
      console.log(
        `Stopping leftover owned process ${listeners.join(", ")} on port ${info.port}.`,
      );
      stopPids(listeners);
    }
    if (!waitUntil(() => ownedListeners().length === 0, 2_000)) {
      fail(
        `Stale vinext lock pid ${info.pid} is gone, but port ${info.port} is still in use by this checkout.`,
      );
    }
    const outside = listeningPids(info.port);
    if (outside.length > 0) {
      fail(
        `Refusing to stop pid ${outside.join(", ")} on port ${info.port}: it is not this checkout's vinext dev server.`,
      );
    }
    releaseLock(lockPath, info.pid);
    console.log(`Removed stale vinext dev lock for pid ${info.pid}.`);
    return;
  }

  const actualCwd = processCwd(info.pid);
  if (actualCwd !== root) {
    fail(
      `Refusing to stop pid ${info.pid}: its working directory is ${actualCwd ?? "unreadable"}, not this checkout (${root}).`,
    );
  }

  const targets = unique([
    ...ownedListeners(),
    ...processTree(info.pid),
  ]).filter((pid) => pid !== info.pid);
  targets.push(info.pid);
  if (targets.some((pid) => protectedIds.has(pid))) {
    fail(
      `Refusing to stop pid ${info.pid} because its process tree includes this process or an ancestor.`,
    );
  }

  console.log(
    `Stopping owned vinext dev server pid ${info.pid} at ${info.appUrl} (${root}).`,
  );
  stopPids(targets);
  if (!waitUntil(() => targets.every((pid) => !isPidAlive(pid)), 2_000)) {
    const survivors = targets.filter((pid) => isPidAlive(pid));
    fail(`Owned vinext dev server is still running: ${survivors.join(", ")}.`);
  }
  if (!waitUntil(() => ownedListeners().length === 0, 2_000)) {
    fail(
      `Port ${info.port} is still in use by this checkout after stopping pid ${info.pid}.`,
    );
  }
  const outside = listeningPids(info.port);
  if (outside.length > 0) {
    fail(
      `Refusing to stop pid ${outside.join(", ")} on port ${info.port}: it is not this checkout's vinext dev server.`,
    );
  }
  releaseLock(lockPath, info.pid);
  console.log(`Stopped owned vinext dev server pid ${info.pid}.`);
}

function stopPids(pids) {
  if (pids.length === 0) return;
  for (const pid of pids) signalPid(pid, "SIGTERM");
  waitUntil(() => pids.every((pid) => !isPidAlive(pid)), 5_000);
  for (const pid of pids) {
    if (isPidAlive(pid)) signalPid(pid, "SIGKILL");
  }
}

const { root, lockPath } = parseArgs(process.argv.slice(2));
stopOwnedServer(root, lockPath);
