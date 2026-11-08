# Development and validation

[Documentation index](../README.md) · [Agent README](../agent/README.md)

Use Node.js 22.13+; `.nvmrc` selects the 22.x line used by CI. Install the committed dependency graph with `npm ci` at the repository root. Do not regenerate dependencies as part of a documentation-only change.

| Command                   | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `npm run dev`             | Local vinext development server                                 |
| `npm run dev:lan`         | Development server on trusted LAN interfaces                    |
| `npm run build`           | Production build                                                |
| `npm run start`           | Start the production build locally                              |
| `npm run release:check`   | Version metadata, release files and local Markdown links        |
| `npm run check`           | Release check, formatting, ESLint, TypeScript, Vitest and build |
| `npm run test:e2e`        | Full Chromium E2E suite                                         |
| `npm run test:e2e:webkit` | Selected WebKit E2E suite                                       |

Install browser runtimes when needed:

```bash
npx playwright install chromium webkit
npm run check
npm run test:e2e
```

The Playwright configuration uses port 3000 and may reuse an existing server. Ensure that port belongs to the candidate under test; otherwise stop your own stale server or use an isolated environment. Do not kill unrelated servers. WebKit is a separate local check; real iOS hardware is not certified by a desktop browser run.

GitHub Actions runs clean Node 22 installs for both the core Quality job and its dependent Chromium job on PRs to `main` and pushes to `main`. Verify successful checks on the exact reviewed SHA before merge, then check the resulting main commit before release. Test counts belong to run evidence, not permanent promises in this guide.

No environment variables are required for local practice. Only behind a trusted reverse proxy should you configure `VINEXT_TRUST_PROXY=1` or `VINEXT_TRUSTED_HOSTS` for metadata origin handling. Wrangler logs and local build state stay under ignored directories. A local build is not a deployment.

## Repository hygiene

Keep runtime entry points (`app/`, `src/`, `worker/`), assets (`public/`) and build integration (`build/`) in their existing locations. Framework and package configuration remain at the root. Detailed prose lives under `docs/`; old reports live under `docs/archive/` and are not active work queues.

Generated `dist/`, `node_modules/`, `.wrangler/`, browser reports and user exports are not release assets. Never commit environment secrets, browser storage exports or private playtest data. Preserve unknown local files when organizing an existing checkout.
