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

PKG-004 is complete. Commit `5273674` was pushed and GitHub Actions run `30709790461` completed successfully for that exact SHA; the following documentation-only checkpoint records the recovery state. PKG-006 (mixed npm registry provenance) is next but has not started.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local `HEAD`, `origin/main`, and remote `main` agree, the worktree is clean, and the final checkpoint's GitHub Actions run completed successfully.
3. Run `npm run check` if the tree or environment differs from the recorded checkpoint; browser regressions remain `npm run test:e2e` and `npm run test:e2e:webkit`.
4. Before PKG-006 reads local npm configuration or rewrites `package-lock.json`, explain the configuration/dependency impact and satisfy the repository safety checkpoint.
5. Compare lockfile versions, integrity hashes, and dependency topology structurally; do not assume replacing registry strings is safe, and never commit local registry/proxy configuration.

## Recovery boundary

- Last remote-verified stable CI commit: `527367430d663bdbd89c62f1b10a472281209ec3`.
- GitHub Actions evidence: run `30709790461`, `completed/success`, exact head SHA `527367430d663bdbd89c62f1b10a472281209ec3`.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key/schema, npm dependencies, `package-lock.json`, hosting configuration, and deployment state remain unchanged by PKG-004.
- The workflow token has only `contents: read`; browser E2E remains a separate local gate, and branch protection is not enabled.
- The lockfile's mixed npmjs.org / npmmirror.com provenance is recorded for PKG-006; the first clean Linux CI install succeeded without rewriting it.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
