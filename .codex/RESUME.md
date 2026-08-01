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

PKG-006 is complete. Commit `cb19453` was pushed, local/tracking/GitHub SHAs matched, and GitHub Actions run `30710451561` completed successfully for that exact SHA. The following documentation-only checkpoint records the recovery state.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm the recovery-documentation checkpoint is committed and local HEAD, `origin/main`, and GitHub agree.
3. Confirm the final checkpoint's GitHub Actions run is `completed/success` for its exact SHA; if not, wait or record the real failure.
4. Run `npm run check` only if the tree or environment differs from the recorded checkpoint; browser regressions remain `npm run test:e2e` and `npm run test:e2e:webkit`.
5. PKG-007 is the next P1 task. Start it with a new dependency/configuration safety assessment, verify patched Next.js metadata and production-only audit behavior, and never commit user registry/proxy configuration.

## Recovery boundary

- Last remote-verified stable CI commit: `cb19453986661ec52529587c2fc79a34eafed25a`.
- GitHub Actions evidence: run `30710451561`, `completed/success`, exact head SHA `cb19453986661ec52529587c2fc79a34eafed25a`.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key/schema, package manifest, dependency versions, hosting configuration, and deployment state remained unchanged by PKG-006; only lockfile registry hostnames and recovery records changed.
- The workflow token has only `contents: read`; browser E2E remains a separate local gate, and branch protection is not enabled.
- The normalized candidate has 717 npmjs and zero npmmirror resolved URLs; all locked integrity hashes and tarball paths are unchanged.
- Read-only advisory triage found three high-severity production-path affected packages and no critical issue; PKG-007 records the bounded remediation scope.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
