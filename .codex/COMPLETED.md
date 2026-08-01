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
