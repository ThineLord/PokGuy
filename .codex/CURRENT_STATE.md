# Current State

Current branch: `main`

Current HEAD: `256d789c618e8ceca8983faaad689c4dc134eb98` (validated product checkpoint; this state refresh is the following documentation-only commit)

Last stable commit: `256d789c618e8ceca8983faaad689c4dc134eb98` (validated locally; remote push pending)

Current objective: Push and remotely verify the Phase 8.0 checkpoint, then harden invalid persisted settings without changing the LocalStorage v2 format.

Active task: Finish the documentation-only checkpoint and push `main`; next queued work is PKG-002.

Modified files: Recovery/product-status Markdown and `.codex/LAST_VALIDATION.json` only during this documentation checkpoint. Use `git status --short` for the exact live list.

Completed steps:

- Confirmed `main` and `origin/main` are both at `24c0757` with no interrupted merge, rebase, cherry-pick, revert, bisect, or stash.
- Read the project, architecture, rules, testing, implementation-status, and next-step documentation.
- Reviewed the dirty-worktree scope without overwriting it.
- Ran the core and browser baselines successfully.
- Scanned the current diff and tracked tree for common secret and local-path patterns; no matches were found.
- Filtered malformed training records and made legacy action pairing conservative when newest-first order cannot be verified.
- Made social-preview origins safe for localhost, private IPv4, bracketed IPv6, invalid host/port input, and explicitly trusted proxy protocol headers.
- Re-ran the final core and Chromium gates successfully.
- Created validated product commit `256d789` with no unstaged product changes remaining.

Remaining steps:

- Commit this documentation-only state refresh.
- Push `main` without force.
- Verify `origin/main` resolves to the pushed documentation checkpoint.

Current tests:

- Targeted Vitest — PASS at 2026-08-01T23:44+08:00 (28 review, storage, and metadata-origin tests).
- `npm run check` — PASS at 2026-08-01T23:45+08:00 (lint, typecheck, 13 Vitest files / 103 tests, production build).
- `npm run test:e2e` — PASS at 2026-08-01T23:46+08:00 (12 Chromium tests).
- Local metadata HTTP smoke — PASS for localhost, private IPv4, bracketed IPv6, and `/og.png`; the development server rejected untrusted public Host headers with HTTP 403.
- Toolchain warnings only: Node `module.register()` deprecation, jsdom LocalStorage experimental warning, proxy detection, and Playwright color-variable warning.

Known failures: The repository-wide `npm run format:check` reports 10 pre-existing formatting differences in untouched files. A separate P1 audit also reproduced that invalid persisted blind settings can prevent startup or the next hand; this remains outside PKG-001 and is queued next. WebKit automation is not yet installed or configured.

Risk: Low for PKG-001; the product checkpoint is committed and fully validated, but remote verification is still pending. The poker engine and LocalStorage v2 format remain unchanged.

Next command: `git push origin main`

Resume instructions: Read `.codex/RESUME.md`, rerun the startup Git checks, inspect `git diff` before editing, and continue the `IN_PROGRESS` item in `.codex/TASK_QUEUE.md`.
