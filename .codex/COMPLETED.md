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
- Push: Pending.
