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
