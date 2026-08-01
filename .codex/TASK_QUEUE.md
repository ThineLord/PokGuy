# Task Queue

## PKG-001 — IN_PROGRESS

- Description: Complete the existing Phase 8.0 Review Lab and social-preview checkpoint safely.
- Priority: P1
- File scope: Current 13 product/document/test worktree items plus `.codex/` recovery state; any repair must remain directly related to this checkpoint.
- Risk: Medium because the worktree predates this maintenance cycle and is currently on `main`; no engine or storage-schema change is intended.
- Acceptance criteria: Existing Review Lab intent is preserved; old records degrade without false action pairing; metadata works for supported local and hosted origins; no secret or machine path is introduced; recovery state is truthful; commit and remote branch agree.
- Test method: Targeted unit tests, `npm run check`, `npm run test:e2e`, `git diff --check`, sensitive-pattern scan, staged-diff review, remote SHA verification.

## PKG-002 — TODO

- Description: Prevent invalid or malformed persisted settings from blocking application startup or the next hand.
- Priority: P1
- File scope: `src/storage/storage.ts`, settings inputs/persistence in `src/features/app/PokerTrainer.tsx`, focused storage/component tests, and recovery documentation.
- Risk: Medium; normalization must preserve valid user settings and existing LocalStorage v1/v2 data.
- Acceptance criteria: Empty, non-finite, out-of-range, or incompatible blind/stack/seat/delay values recover safely; malformed AI profiles cannot crash startup; valid settings remain byte-for-byte equivalent where practical; users receive a clear message when recovery occurs.
- Test method: Migration fixtures, malformed LocalStorage startup test, settings-input browser test, `npm run check`, and `npm run test:e2e`.

## PKG-003 — TODO

- Description: Add a WebKit automation project and validate the Review Lab, LocalStorage refresh, export, responsive layout, and keyboard/input boundaries.
- Priority: P2
- File scope: `playwright.config.ts`, `tests/e2e/`, and testing documentation only.
- Risk: Medium; browser runtime availability and WebKit-specific layout/timing behavior may differ.
- Acceptance criteria: Chromium remains green; selected WebKit flows pass without weakening assertions; no product behavior is changed merely to satisfy timing.
- Test method: Install/verify Playwright WebKit, run targeted WebKit cases, then the complete project gates.

## PKG-004 — TODO

- Description: Add a minimal GitHub Actions quality gate for pull requests and pushes.
- Priority: P2
- File scope: `.github/workflows/` and concise contributor/testing documentation.
- Risk: Low to medium; CI runtime and Node version must match the supported toolchain.
- Acceptance criteria: Clean install plus `npm run check` succeeds in CI; no secrets or deployment permissions are required.
- Test method: Validate workflow syntax locally where possible, push on a branch/checkpoint, and wait for a completed GitHub Actions conclusion.

## PKG-005 — DEFERRED

- Description: Store immutable decision-time review snapshots and support retraining from a review point.
- Priority: P3
- File scope: Storage schema/migrations, review UI, tests, and documentation.
- Risk: High because it requires a versioned data migration and careful hidden-information boundaries.
- Acceptance criteria: Requires a separately approved design; v1/v2 data migrate without loss; snapshots contain only information visible at action time.
- Test method: Migration fixtures, privacy boundary tests, unit tests, Chromium/WebKit flows, clean-profile import/export smoke test.
