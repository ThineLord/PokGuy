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

PKG-008 is in progress on stable checkpoint `72fb430`. Exact React, React DOM, and `react-server-dom-webpack` `19.2.8` package changes plus recovery/product documentation are present locally. Every local dependency, project, browser, audit, and production/RSC smoke gate passes. The scoped commit, push, and exact-SHA CI remain. Three untracked historical conflict copies remain preserved outside Git.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local HEAD, `origin/main`, and GitHub remain at `72fb430`; GitHub Actions run `30713421819` must remain `completed/success` for that exact SHA.
3. Confirm the intended PKG-008 tracked diff contains only the three aligned package versions, their exact four-record lock delta, and scoped documentation/recovery records.
4. Preserve `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, and `docs/NEXT_STEPS 2.md` as untracked files unless explicit deletion approval is given. Their contents are older maintenance snapshots and must not be committed.
5. Recheck changed-file formatting, JSON, lock boundary, package/lock candidate hashes, sensitive/private-path scan, stopped listener, and complete diff.
6. Commit the scoped checkpoint as `security: patch React RSC advisory`, push `main` without force, verify local/tracking/GitHub exact SHA, and require completed/success GitHub Actions for that SHA.
7. Only after product CI succeeds, mark PKG-008 DONE, append `.codex/COMPLETED.md`, commit the state checkpoint, push it, and require completed exact-SHA CI again. Preserve the documented PostCSS/Sharp and Vite/Cloudflare findings.

## Recovery boundary

- Last remote-verified stable checkpoint: `72fb430786f1010cd7326ff1f8327591a3cbee33`.
- GitHub Actions evidence: run `30713421819`, `completed/success`, exact head SHA `72fb430786f1010cd7326ff1f8327591a3cbee33`.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key/schema, package manifest, dependency versions, hosting configuration, and deployment state remained unchanged by PKG-006; only lockfile registry hostnames and recovery records changed.
- The workflow token has only `contents: read`; browser E2E remains a separate local gate, and branch protection is not enabled.
- The normalized candidate has 717 npmjs and zero npmmirror resolved URLs; all locked integrity hashes and tarball paths are unchanged.
- The PKG-007 candidate removes all nine Next-specific advisory records. Four PostCSS/Sharp advisory records remain because stable Next has not yet incorporated the compatible upstream updates.
- PKG-008 baseline complete audit contains one direct RSC advisory (`GHSA-wx67-qw84-cm4g`), fixed in the coherent `19.2.8` trio. Vite and Cloudflare/Wrangler remain separate scopes.
- PKG-008 candidate and repository lockfiles retain 724 entries and change exactly the root, React, React DOM, and RSC records; no package is added or removed. Complete audit drops to 14 package records / 25 advisory sources, and the RSC advisory disappears.
- Repository checks pass with 112 Vitest, 13 Chromium, 7 WebKit, production build, live RSC response, bounded multipart/unknown-action handling, and post-probe liveness. vinext currently returns a generic 500 for an unknown Action ID but remains live; this is recorded as observed adapter behavior, not evidence of a hang.
- Three untracked conflict-style historical copies appeared during final staging. They were compared read-only, excluded from the commit, and preserved because deletion is not authorized.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
