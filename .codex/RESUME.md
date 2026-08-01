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

Finish the PKG-001 remote checkpoint, then continue PKG-002: prevent invalid or malformed persisted settings from blocking startup or the next hand.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. If the documentation checkpoint is not committed, inspect and commit only the recovery/product-status files.
3. Run the next command: `git push origin main`.
4. Verify `git rev-parse HEAD` equals `git rev-parse origin/main` before treating the remote checkpoint as complete.
5. Start PKG-002 with a failing storage migration test for invalid blind/settings data; do not change the schema version.

## Recovery boundary

- Last locally validated product commit: `256d789c618e8ceca8983faaad689c4dc134eb98`.
- Last known remote-stable commit before this push: `24c075700abc80721e8cc877900ac1d50ad9b10e`.
- No stash or interrupted Git operation existed at startup.
- The poker engine and LocalStorage v2 schema remain unchanged by PKG-001.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
