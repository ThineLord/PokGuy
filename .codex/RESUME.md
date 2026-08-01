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

Continue PKG-001: finish the audit of the pre-existing Phase 8.0 Review Lab and social-preview worktree, make only a verified related repair if necessary, and checkpoint it safely.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md`, the full current diff, and any new Git status entries.
2. Do not discard or overwrite the 13 product/document/test items that existed at startup.
3. Run the next command: `git diff --check`.
4. Confirm changed-file Prettier, the staged file list, and the final sensitive-pattern scan.
5. The final `npm run check` and `npm run test:e2e` already passed; rerun them only if code changes again.
6. Update all `.codex` state with the actual final SHA/test results.
7. Review `git status`, `git diff --stat`, staged diff, and sensitive patterns.
8. Commit with a scoped conventional message and push `main` without force.
9. Verify `origin/main` resolves to the pushed commit before marking PKG-001 done.

## Recovery boundary

- Last known remote-stable commit: `24c075700abc80721e8cc877900ac1d50ad9b10e`.
- No stash or interrupted Git operation existed at startup.
- The poker engine and LocalStorage v2 schema are outside PKG-001.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
