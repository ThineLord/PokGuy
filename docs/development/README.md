# Development and validation

[Documentation index](../README.md) · [Agent README](../agent/README.md)

Use Node.js 22.13+; `.nvmrc` selects the 22.x line used by CI. Install the committed dependency graph with `npm ci` at the repository root. Do not regenerate dependencies as part of a documentation-only change.

| Command                      | Purpose                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                | Local Vite/vinext development server                             |
| `npm run dev:lan`            | Development server on trusted LAN interfaces                     |
| `npm run build`              | Production build                                                 |
| `npm run start`              | Start the production build locally                               |
| `npm run release:check`      | Version metadata, release files and local Markdown links         |
| `npm run check`              | Release check, formatting, ESLint, TypeScript, Vitest and build  |
| `npm run test:e2e`           | Full Chromium E2E suite                                          |
| `npm run test:e2e:worker`    | Full Chromium suite against the built local Worker (build first) |
| `npm run test:e2e:webkit`    | Selected WebKit E2E suite                                        |
| `npm run test:dependencies`  | Dependency caller checks and built Node/Worker OG regressions    |
| `npm run audit:dependencies` | Official-registry audit, failing at moderate or higher           |

Install browser runtimes when needed:

```bash
npx playwright install chromium webkit
npm run check
npm run test:e2e
```

Playwright owns its test server and fails if port 3000 is occupied. Stop only your own stale server or use an isolated environment; never kill unrelated servers. The Worker configuration starts only Wrangler on 4173 using the emitted `dist/server/wrangler.json`. Run development and Worker suites sequentially. The WebKit suite also runs in CI; desktop WebKit does not certify physical iOS hardware.

Vitest uses at most two workers to bound CPU/memory pressure, and the pure AI suite runs in Node instead of jsdom. Individual test timeouts are unchanged. This reduces resource contention without hiding failures; a heavily loaded host can still exceed an individual test limit.

```bash
npm run check
npm run test:e2e
npm run test:e2e:webkit
npm run test:e2e:worker
npm audit --registry=https://registry.npmjs.org
```

The locked graph passes the official-registry audit with zero findings; see [the dependency assessment](SECURITY_0.3.1.md). CI fails on moderate or higher findings and on registry errors. The dependency regression gate also checks actual callers and built rendering; package metadata alone is insufficient.

GitHub Actions runs on pull requests to `main` and on pushes to `main`. The Quality job is a clean Node 22 install on `ubuntu-24.04` and runs the audit plus `npm run check`. The dependent browser job uses those same triggers and runs development Chromium, WebKit, the production build, and Worker Chromium. It uses the official Playwright Ubuntu 24.04 image for lockfile Playwright 1.61.1, pinned to the linux/amd64 digest `sha256:cf0daee9b994042e011bc29f20cdff1a9f682a039b43fcd738f7d8a9d3bcd9d6` because GitHub-hosted `ubuntu-24.04` runners are linux/amd64. Chromium 1228 and WebKit 2311 are already installed at `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`; CI does not run `npx playwright install --with-deps`. That image's Node is 24.17.0, which satisfies `engines.node` (`>=22.13.0`) and the Worker toolchain (`wrangler` 4.114.0 requires `>=22.0.0`). The Quality job stays on Node 22. Verify successful checks on the exact reviewed SHA before merge, then check the resulting main commit before release. Test counts belong to run evidence, not permanent promises in this guide.

No environment variables are required for local practice. Only behind a trusted reverse proxy should you configure `VINEXT_TRUST_PROXY=1` or `VINEXT_TRUSTED_HOSTS` for metadata origin handling. Wrangler logs and local build state stay under ignored directories. A local build is not a deployment.

## Repository hygiene

Keep runtime entry points (`src/app/`, `src/worker/` and the other `src/` modules), assets (`public/`) and build integration (`scripts/`) in their existing locations. Vite, TypeScript and ESLint keep their root discovery files; test configurations live in `tests/`, and Prettier/PostCSS options live in `package.json`. Detailed prose lives under `docs/`; old reports are linked at a fixed tag from `docs/archive/` and are not active work queues.

Generated `dist/`, `node_modules/`, `.wrangler/`, browser reports and user exports are not release assets. Never commit environment secrets, browser storage exports or private playtest data. Preserve unknown local files when organizing an existing checkout.
