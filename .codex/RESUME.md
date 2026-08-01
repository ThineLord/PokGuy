# Resume

## Startup checks

Run these first and compare the output with `.codex/CURRENT_STATE.md`:

```bash
git status --short --branch
git remote -v
git log --oneline --decorate -15
git stash list
```

Also confirm there is no `MERGE_HEAD`, `REBASE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, or bisect state before editing.

## Current task

PKG-002 is complete and its product commit `4aec6ee` was pushed. PKG-003 (WebKit automation) is the next queued task and has not started.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Run `npm run check` if the tree or environment differs from the recorded checkpoint.
3. For PKG-003, first explain that Playwright WebKit installation adds a browser runtime and that `playwright.config.ts` will change; follow the repository approval gate before those operations.
4. Keep Chromium green, add only selected WebKit coverage, and do not weaken assertions to accommodate timing.
5. Run targeted WebKit checks, `npm run check`, the complete Chromium suite, changed-file formatting, diff/security review, then commit and push a bounded checkpoint.

## Recovery boundary

- Last remote-verified stable product commit: `4aec6ee0e5ce89ea25a409402676556ff41412df`.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key, and LocalStorage v2 schema remain unchanged by PKG-002.
- Recovered startup data intentionally remains in memory until a normal save, avoiding destructive overwrite of an unknown future schema.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
