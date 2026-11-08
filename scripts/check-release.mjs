import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const fail = (message) => {
  console.error(`Release check failed: ${message}`);
  process.exitCode = 1;
};
const manifest = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const version = manifest.version;
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  fail("package.json must use a stable MAJOR.MINOR.PATCH version");
}
if (lock.version !== version || lock.packages?.[""]?.version !== version) {
  fail("package.json and both package-lock.json root versions must match");
}
for (const arg of process.argv.slice(2)) {
  if (arg !== `--tag=v${version}`) {
    fail(`expected --tag=v${version}, received ${arg}`);
  }
}
for (const path of ["README.md", "README.zh-CN.md"]) {
  if (!read(path).includes(`**${version}**`)) {
    fail(`${path} must display the current version in bold`);
  }
}
if (!read("CHANGELOG.md").includes(`## [${version}] — `)) {
  fail("CHANGELOG.md must contain a dated section for the current version");
}
for (const suffix of [".md", ".zh-CN.md"]) {
  const path = `docs/releases/${version}${suffix}`;
  if (!existsSync(resolve(root, path))) {
    fail(`missing ${path}`);
  } else if (!read(path).startsWith(`# PokGuy ${version}\n`)) {
    fail(`${path} must start with the matching version heading`);
  }
}

// Check repository documentation, never generated artifacts or installed packages.
const documents = readdirSync(root)
  .filter((name) => extname(name) === ".md")
  .map((name) => resolve(root, name));
function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (entry.isFile() && extname(path) === ".md") documents.push(path);
  }
}
collect(resolve(root, "docs"));
collect(resolve(root, ".github"));
let links = 0;
for (const document of documents) {
  const content = readFileSync(document, "utf8").replace(/```[\s\S]*?```/g, "");
  const inline = [...content.matchAll(/\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/g)];
  const references = [...content.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)];
  for (const match of [...inline, ...references]) {
    const target = match[1];
    if (/^[a-z][a-z\d+.-]*:|^#|^\/\//i.test(target)) continue;
    let path;
    try {
      path = resolve(
        dirname(document),
        decodeURIComponent(target.split(/[?#]/)[0]),
      );
    } catch {
      fail(`${relative(root, document)}: invalid link ${target}`);
      continue;
    }
    links += 1;
    if (
      !existsSync(path) ||
      (!statSync(path).isFile() && !statSync(path).isDirectory())
    ) {
      fail(`${relative(root, document)}: missing local link ${target}`);
    }
  }
}
if (!process.exitCode) {
  console.log(
    `Release ${version}: metadata and ${links} local links in ${documents.length} Markdown files passed.`,
  );
}
