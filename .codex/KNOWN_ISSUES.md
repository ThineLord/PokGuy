# Known Issues

## Invalid persisted settings can block startup — resolved

- Status: Fixed in `4aec6ee`
- Priority: Closed P1
- Resolution: Numeric settings, profile pools, selected IDs, and AI habit records are normalized before use; startup and import recovery are covered by unit, component, and Chromium tests.

## Recovered startup data is not rewritten immediately

- Status: Accepted safety tradeoff
- Priority: P3
- Impact: If a damaged or old record is recovered and the user performs no action that saves data, a refresh can show the migration/recovery notice again.
- Next step: Only consider automatic rewrite together with version-aware backup/forward-compatibility rules; do not overwrite unknown future schemas based on the current broad migration signal.

## WebKit automation is not configured

- Status: Open
- Priority: P2
- Impact: Chromium and direct Safari checks exist in project history, but WebKit is not part of the repeatable Playwright gate.
- Next step: PKG-003 in `TASK_QUEUE.md`.

## Older training records lack action-time snapshots

- Status: Known limitation
- Priority: P3
- Impact: A legacy/imported grade can only be paired with an action when record count and chronological order make the mapping unambiguous; otherwise Review Lab intentionally shows the grade without action context.
- Next step: Keep the safe fallback in Phase 8.0; design a versioned migration separately for PKG-005.

## Repository-wide formatting baseline is not clean

- Status: Pre-existing; observed on 2026-08-01
- Priority: P3
- Impact: `npm run format:check` reports 10 untouched files, so it cannot yet serve as a repository-wide gate without a separate formatting-only change.
- Next step: Keep changed-file formatting clean; schedule any baseline normalization as an isolated, reviewable task.

## Toolchain warnings during successful checks

- Status: Observed, non-failing
- Priority: P3
- Impact: Node may report `module.register()` deprecation and jsdom LocalStorage experimental warnings; vinext may report proxy detection; Playwright may report color-variable warnings.
- Next step: Reassess during future dependency maintenance, without changing pinned dependencies solely to silence warnings.
