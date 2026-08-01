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

PKG-003 is complete. Product commit `9542fa9` was validated and pushed; the following documentation-only checkpoint records the recovery state. PKG-004 (minimal GitHub Actions quality gate) is next but has not started.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local `HEAD`, `origin/main`, and remote `main` agree and the worktree is clean.
3. Run `npm run check` if the tree or environment differs from the recorded checkpoint; WebKit can be rechecked with `npm run test:e2e:webkit`.
4. Before PKG-004 changes `.github/workflows/`, explain the CI configuration change, impact, and validation plan, then satisfy the repository safety checkpoint.
5. Keep the first CI workflow limited to a clean install and `npm run check`; do not add secrets, deployment permissions, or an expensive browser matrix implicitly.

## Recovery boundary

- Last remote-verified stable product commit: `9542fa9b350a023936c497dd88dcaaee09b74362`.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key/schema, npm dependencies, `package-lock.json`, hosting configuration, and deployment state remain unchanged by PKG-003.
- The Playwright WebKit runtime lives in the user cache and may need `npx playwright install webkit` on a clean machine.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
