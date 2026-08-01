# Completed Checkpoints

Append stable maintenance checkpoints here after their commit and remote status are verified. Product history remains in `CHANGELOG.md`.

## 2026-08-01 — Baseline recovery audit

- Confirmed `main` and `origin/main` at `24c0757` before changes.
- Confirmed no interrupted Git operation or stash.
- Preserved the existing Phase 8.0 worktree and identified its 13 product/document/test items.
- Passed the initial `npm run check` with 85 Vitest tests and passed 12 Chromium E2E tests.
- Created the required `.codex/` recovery layer.
- Repaired malformed-record recovery, conservative action pairing, and local/proxied metadata-origin handling.
- Passed the final `npm run check` with 103 Vitest tests, 12 Chromium E2E tests, and local metadata HTTP smoke checks.
- Commit: `256d789` (`feat: add review lab and social previews`).
- Documentation checkpoint: `59bae14` (`docs: record phase 8 checkpoint`).
- Push: Verified; local HEAD, `origin/main`, and remote `main` all resolved to `59bae143a2209b1b0ee4c313d80dd5431794988c`.

## 2026-08-02 — Persisted-data recovery hardening

- Reproduced invalid blind inputs and malformed AI profiles blocking startup or settings access.
- Added field-level validation for settings, AI profiles, selected IDs, and AI habit observations without changing the LocalStorage key or v2 schema.
- Preserved valid custom-only opponent pools and valid customized profiles exactly where practical.
- Added startup and import recovery notices plus safe numeric-input behavior.
- Passed `npm run check` with 112 Vitest tests and passed 13 Chromium E2E tests.
- Inspected the recovery notice in a real Chromium session; the table remained usable and the console had no errors or warnings.
- Commit: `4aec6ee` (`fix: recover malformed local settings`).
- Push: Verified by successful fast-forward push and matching local `HEAD` / `origin/main` at `4aec6ee0e5ce89ea25a409402676556ff41412df`.

## 2026-08-02 — Selected WebKit browser gate

- Installed and launch-checked Playwright WebKit 26.5 revision 2311 without changing project dependencies or the lockfile.
- Added a selected seven-test WebKit project while retaining all 13 Chromium tests as the default E2E command.
- Covered Review Lab refresh, settings persistence/export, invalid blinds recovery, responsive layouts, showdown visibility, and keyboard/input isolation.
- Passed `npm run check` with 112 Vitest tests, 7 WebKit E2E tests, and 13 Chromium E2E tests.
- Passed changed-file formatting, whitespace, sensitive-pattern, and machine-path scans.
- Commit: `9542fa9` (`test: add selected WebKit gate`).
- Push: Verified by matching local `HEAD`, `origin/main`, and remote `main` at `9542fa9b350a023936c497dd88dcaaee09b74362` before the state-only checkpoint.

## 2026-08-02 — Minimal read-only GitHub Actions gate

- Added the first workflow for `main` pushes and pull requests: clean `npm ci` followed by `npm run check` on Node `22.x`.
- Pinned official checkout/setup actions to immutable SHAs, granted only `contents: read`, disabled persisted checkout credentials, and added concurrency cancellation plus a 15-minute timeout.
- Kept browser downloads, E2E, secrets, write permissions, deployment, dependencies, and the lockfile outside the CI change.
- Passed local `npm run check`, 13 Chromium tests, 7 WebKit tests, changed-file formatting, whitespace, workflow-boundary, sensitive-pattern, and private-path checks.
- Commit: `5273674` (`ci: add read-only quality gate`).
- Push: Verified by matching local `HEAD`, `origin/main`, and GitHub at `527367430d663bdbd89c62f1b10a472281209ec3`.
- CI: GitHub Actions run `30709790461` completed successfully for the exact commit SHA; clean install and every quality-gate step passed.

## 2026-08-02 — Lockfile registry provenance normalization

- Audited all 717 downloaded lockfile entries and confirmed HTTPS plus SHA-512 integrity coverage; 98 entries used npmmirror and 619 used npmjs.
- Matched all 98 mirror `name@version` records against npmjs metadata for integrity and tarball pathname with zero mismatch.
- Changed only the 98 exact registry hostnames, leaving every package version, integrity hash, dependency edge, flag, package key, root field, and lockfile version unchanged.
- Passed isolated cold-cache `npm ci`, isolated and repository `npm run check`, 13 Chromium tests, 7 WebKit tests, formatting, whitespace, structural, credential-pattern, and private-path checks.
- Commit: `cb19453` (`security: normalize npm lockfile provenance`).
- Push: Verified by matching local HEAD, `origin/main`, and GitHub at `cb19453986661ec52529587c2fc79a34eafed25a`.
- CI: GitHub Actions run `30710451561` completed successfully for the exact commit SHA; Node 22 clean install and every quality-gate step passed.

## 2026-08-02 — Supported Next.js security patch

- Updated `next` and `eslint-config-next` together from `16.2.6` to stable `16.2.12` without changing React, Vite, vinext, Wrangler, Cloudflare, product logic, persistence, or deployment configuration.
- Retained all 724 lock entries; only the root plus 12 Next-owned entries changed, with zero added or removed dependency.
- Reduced distinct production advisory records from 13 to 4 and removed all nine Next-specific records. Three PostCSS and one Sharp record remain explicitly deferred because stable Next has not incorporated the required compatibility upgrades.
- Passed isolated and repository cold-cache installs, `npm run check` with 112 tests/build, 13 Chromium tests, 7 WebKit tests, production HTTP/title smoke, formatting, structural, sensitive-data, and complete diff checks.
- Commit: `2c2782d` (`security: patch Next.js advisories`).
- Push: Verified by matching local HEAD, `origin/main`, and GitHub at `2c2782d5223b5f63448c442adaed97360cbbd46c`.
- CI: GitHub Actions run `30713299084` completed successfully for the exact commit SHA; Node 22 clean install and every quality-gate step passed.

## 2026-08-02 — React Server Components security patch

- Updated React, React DOM, and `react-server-dom-webpack` together from `19.2.6` to stable `19.2.8`, removing `GHSA-wx67-qw84-cm4g` without moving Next, Vite, vinext, Webpack, Wrangler, or Cloudflare.
- Retained all 724 lock entries; only the root plus the three aligned runtime records changed, with zero added/removed package and zero mirror URL.
- Reduced the complete audit from 15 package records / 26 advisory sources to 14 / 25; the direct RSC advisory disappeared, production audit remained at the documented four PostCSS/Sharp sources, and critical count remained zero.
- Passed isolated and repository cold installs, peer checks, `npm run check` with 112 tests/build, 13 Chromium, 7 WebKit, production HTML/RSC/malformed-request liveness smoke, formatting, structural, sensitive-data, and complete diff checks.
- Commit: `237ff2b` (`security: patch React RSC advisory`).
- Push: Verified by matching local HEAD, `origin/main`, and GitHub at `237ff2b68fde421a56a4aabdacdecfe8be57041d`.
- CI: GitHub Actions run `30714243780` completed successfully for the exact product SHA; Node 22 clean install and every quality-gate step passed.

## 2026-08-02 — Vite security patch

- Updated only the direct Vite declaration from `8.0.13` to first-fixed `8.0.16`; rejected broader `8.2.0` after isolated dependency comparison.
- Retained all 724 lock entries; 24 records changed with zero added/removed package, and Cloudflare/Wrangler/Miniflare/Next/React/vinext/Vitest direct records remained byte-identical.
- Removed both direct Vite advisories and reduced the complete audit from 14 package records / 25 advisory sources to 13 / 23; production PostCSS/Sharp audit remained 3 / 4 and critical count remained zero.
- Passed isolated/repository cold installs, peer graph, 112 tests/build, 13 Chromium, 7 WebKit, production HTML/RSC/SVG smoke, Cloudflare workerd preview, no-upload deploy dry-run, artifact, formatting, structural, sensitive-data, and independent reviews.
- Commit: `0754a4f` (`security: patch Vite advisories`).
- Push: Verified by matching local HEAD, `origin/main`, and GitHub at `0754a4f1414768aff06cf91df5669c7379c32c7b`.
- CI: GitHub Actions run `30716519172` completed successfully for the exact product SHA; Node 22 clean install and every quality-gate step passed.

## 2026-08-02 — Cloudflare toolchain security patch

- Updated Cloudflare Vite plugin `1.37.1→1.47.0`, Wrangler `4.92.0→4.114.0`, and Workers types to exact `5.20260722.1`; explicitly pinned compatibility date `2026-05-15` to preserve baseline Worker semantics.
- Accepted the exact isolated package/lock candidate: 724→754 records, 16 changed, 58 added, 28 removed; Next, React, Vite, vinext, product logic, persistence, hosting resources, and deployment state remained unchanged.
- Reduced complete audit results from 13 records / 23 sources to 7 / 13; the Cloudflare/plugin/Wrangler/Miniflare/workerd/esbuild/ws/undici chain disappeared and critical count remained zero.
- Passed cold install, clean dependency graph, 112 tests/build, 13 Chromium, 7 WebKit, production/workerd HTML/RSC/SVG, artifact invariants, listener cleanup, strict no-upload deploy dry-run, formatting, structural, sensitive-data, and independent reviews.
- Commit: `448a243` (`security: patch Cloudflare toolchain advisories`).
- Push: Verified by matching local HEAD, `origin/main`, and GitHub at `448a2432d3890c7aadd6e9aa9dc46ee4ba34cc10`.
- CI: GitHub Actions run `30719418742` completed successfully for the exact product SHA; Node 22 normal `npm ci`, `npm run check`, and every job/post step passed.
