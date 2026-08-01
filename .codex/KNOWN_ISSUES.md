# Known Issues

## Invalid persisted settings can block startup

- Status: Reproduced; queued
- Priority: P1
- Impact: An empty or incompatible blind value can be saved as an invalid number and later make `startHand` reject the table; malformed imported AI profiles can also fail during rendering or startup.
- Next step: PKG-002 in `TASK_QUEUE.md`; normalize settings/import structures while preserving valid v1/v2 data.

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
