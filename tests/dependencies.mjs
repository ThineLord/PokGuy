// Exercise the resolved dependencies and supported Vite runtime, not just audit metadata.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  openSync,
  closeSync,
  existsSync,
  rmSync,
} from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const output = join(root, "output/dependency-checks");
mkdirSync(output, { recursive: true });
mkdirSync(join(root, ".vinext"), { recursive: true });
const temporary = mkdtempSync(join(root, ".vinext/dependency-check-"));
const estreeRequire = createRequire(
  require.resolve("@typescript-eslint/typescript-estree"),
);
const satoriRequire = createRequire(require.resolve("satori"));

function isolatedCheck(name, code) {
  execFileSync(process.execPath, ["--input-type=commonjs", "-e", code], {
    cwd: root,
    timeout: 5000,
    stdio: "inherit",
  });
  console.log(`PASS ${name}`);
}

try {
  // Use the exact copy resolved by typescript-eslint, including its real project-service caller.
  isolatedCheck(
    "minimatch callers and bounded glob preprocessing",
    `
    const assert = require('node:assert/strict');
    const { minimatch, Minimatch } = require(${JSON.stringify(estreeRequire.resolve("minimatch"))});
    assert.equal(minimatch('.config.ts', '*.ts', {dot:true}), true);
    assert.equal(minimatch('nested/config.ts', '*.ts', {dot:true}), false);
    assert.equal(minimatch('nested/config.ts', '**/*.ts', {dot:true}), true);
    new Minimatch('**/../'.repeat(24) + 'target.ts', {optimizationLevel:2});
    const { parseAndGenerateServices } = require(${JSON.stringify(require.resolve("@typescript-eslint/typescript-estree"))});
    const options = {tsconfigRootDir:${JSON.stringify(temporary)}, projectService:{allowDefaultProject:['*.ts']}};
    assert.ok(parseAndGenerateServices('const value: number = 1;', {...options, filePath:'.config.ts'}).services.program);
    assert.throws(() => parseAndGenerateServices('const value = 1;', {...options, filePath:'nested/config.ts'}), /not found by the project service|allowDefaultProject/);
  `,
  );
  isolatedCheck(
    "fflate malformed ZIP64 terminates with an error",
    `
    const assert = require('node:assert/strict');
    const {zipSync, unzipSync} = require(${JSON.stringify(satoriRequire.resolve("fflate"))});
    const normal = zipSync({sample: new Uint8Array([1,2,3])});
    assert.deepEqual(unzipSync(normal).sample, new Uint8Array([1,2,3]));
    const end = normal.length - 22;
    const zip = new Uint8Array(normal.length + 76);
    zip.set(normal.subarray(0,end));
    zip.set(normal.subarray(end), end+76);
    const view = new DataView(zip.buffer);
    // ZIP64 EOCD and locator: activate the parser's ZIP64 extra-field path.
    view.setUint32(end,0x06064b50,true);
    view.setUint32(end+4,44,true);
    view.setUint32(end+32,1,true);
    view.setUint32(end+56,0x07064b50,true);
    view.setUint32(end+64,end,true);
    view.setUint16(end+76+8,65535,true);
    view.setUint32(end+76+16,0xffffffff,true);
    const index = Buffer.from(zip).indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));
    assert.ok(index >= 0);
    view.setUint32(end+48,index,true);
    view.setUint32(index+20,0xffffffff,true);
    assert.throws(() => unzipSync(zip), error => error.code === 13);
  `,
  );

  for (const runtime of ["node", "worker"]) {
    const fixture = join(temporary, runtime);
    const appDirectory = runtime === "worker" ? "src/app" : "app";
    mkdirSync(join(fixture, appDirectory, "api/og"), { recursive: true });
    if (runtime === "worker") {
      // Older checkouts can retain this untracked empty starter directory.
      // It must not shadow the configured src/app routes, even with a clean git status.
      mkdirSync(join(fixture, "app/_sites-preview"), { recursive: true });
    }
    writeFileSync(
      join(fixture, "package.json"),
      '{"type":"module","private":true}\n',
    );
    writeFileSync(
      join(fixture, appDirectory, "layout.tsx"),
      "export default function Layout({children}) { return <html><body>{children}</body></html>; }",
    );
    writeFileSync(
      join(fixture, appDirectory, "page.tsx"),
      "export default function Page() { return <p>Dependency regression fixture</p>; }",
    );
    writeFileSync(
      join(fixture, appDirectory, "api/og/route.tsx"),
      `
      import {ImageResponse} from 'next/og';
      export async function GET(request: Request) {
        const unsafe = new URL(request.url).searchParams.has('unsafe');
        try {
          const image = new ImageResponse(<div style={unsafe ? {_clipPathId:'invalid'} as never : {display:'flex',background:'white'}}>PokGuy</div>, {width:240,height:120});
          return new Response(await image.arrayBuffer(), {headers:{'content-type':'image/png'}});
        } catch (error) { return new Response(String(error), {status:400}); }
      }
    `,
    );
    if (runtime === "worker") {
      const entry = ["src/worker/index.ts", "worker/index.ts"].find((path) =>
        existsSync(join(root, path)),
      );
      assert.ok(entry, "the real application Worker entry must exist");
      mkdirSync(join(fixture, dirname(entry)), { recursive: true });
      writeFileSync(
        join(fixture, entry),
        `export {default} from ${JSON.stringify(join(root, entry))};`,
      );
      // Reuse the application's binding/plugin configuration; the generated route never enters its build.
      writeFileSync(
        join(fixture, "vite.config.ts"),
        `import base from ${JSON.stringify(join(root, "vite.config.ts"))}; export default async () => ({...await base(), root:import.meta.dirname});`,
      );
    } else {
      writeFileSync(
        join(fixture, "vite.config.ts"),
        'import vinext from "vinext"; export default {root:import.meta.dirname,plugins:[vinext()]};',
      );
    }
    const buildLog = openSync(join(output, `${runtime}-build.log`), "w");
    try {
      execFileSync(
        process.execPath,
        [
          join(root, "node_modules/vite/bin/vite.js"),
          "build",
          "--config",
          join(fixture, "vite.config.ts"),
        ],
        { cwd: root, timeout: 120000, stdio: ["ignore", buildLog, buildLog] },
      );
    } finally {
      closeSync(buildLog);
    }

    const portProbe = createServer();
    portProbe.listen(0, "127.0.0.1");
    await once(portProbe, "listening");
    const port = portProbe.address().port;
    await new Promise((resolve) => portProbe.close(resolve));
    const args =
      runtime === "worker"
        ? [
            join(root, "node_modules/wrangler/bin/wrangler.js"),
            "dev",
            "--config",
            join(fixture, "dist/server/wrangler.json"),
            "--local",
            "--ip",
            "127.0.0.1",
            "--port",
            String(port),
            "--inspector-port",
            "0",
          ]
        : [
            join(
              dirname(fileURLToPath(import.meta.resolve("vinext"))),
              "cli.js",
            ),
            "start",
            "--hostname",
            "127.0.0.1",
            "--port",
            String(port),
          ];
    const serverLog = openSync(join(output, `${runtime}-server.log`), "w");
    const server = spawn(process.execPath, args, {
      cwd: fixture,
      detached: true,
      stdio: ["ignore", serverLog, serverLog],
    });
    closeSync(serverLog);
    try {
      const url = `http://127.0.0.1:${port}/api/og`;
      let image;
      for (let attempt = 0; attempt < 120; attempt++) {
        assert.equal(
          server.exitCode,
          null,
          `server exited; see ${runtime}-server.log`,
        );
        try {
          image = await fetch(url, { signal: AbortSignal.timeout(3000) });
          break;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
      assert.ok(image, "server did not become ready");
      assert.equal(image.status, 200, await image.clone().text());
      assert.equal(image.headers.get("content-type"), "image/png");
      const bytes = Buffer.from(await image.arrayBuffer());
      assert.deepEqual(
        [...bytes.subarray(0, 8)],
        [137, 80, 78, 71, 13, 10, 26, 10],
      );
      assert.equal(bytes.readUInt32BE(16), 240);
      assert.equal(bytes.readUInt32BE(20), 120);
      const sharp = createRequire(require.resolve("miniflare"))("sharp");
      const pixels = await sharp(bytes)
        .raw()
        .toBuffer({ resolveWithObject: true });
      assert.equal(pixels.info.width, 240);
      assert.equal(pixels.info.height, 120);
      assert.ok(
        pixels.data.some((value) => value !== 255),
        "rendered text must not be blank",
      );
      const unsafe = await fetch(`${url}?unsafe=1`, {
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(unsafe.status, 400);
      assert.match(await unsafe.text(), /Invalid style property/);
      console.log(
        `PASS ${runtime}: decoded 240x120 PNG and rejected unsafe SVG style`,
      );
    } finally {
      if (server.exitCode === null) {
        const stopped = once(server, "exit");
        process.kill(-server.pid, "SIGTERM");
        await stopped;
      }
    }
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
console.log("Dependency compatibility and security regressions passed.");
