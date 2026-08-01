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

PKG-009 product commit `0754a4f` is complete, pushed, and verified by exact-SHA GitHub Actions run `30716519172`. This file belongs to the recovery-documentation checkpoint on top of that product commit; on resume, determine from Git history whether the state checkpoint still needs commit/push/CI verification. Three untracked historical conflict copies remain preserved outside Git.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local HEAD, `origin/main`, and GitHub contain product commit `0754a4f`; GitHub Actions run `30716519172` must remain `completed/success` for that exact SHA.
3. If recovery/status documentation is modified, confirm it is the eight-file state checkpoint. If it is already committed, inspect the current state-only HEAD instead.
4. Preserve `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, and `docs/NEXT_STEPS 2.md` as untracked files unless explicit deletion approval is given. Their contents are older maintenance snapshots and must not be committed.
5. If the state checkpoint is uncommitted, run changed-file formatting, JSON, whitespace, sensitive-data, and staged-file boundary checks before commit/push. In either case, require completed GitHub Actions success for the exact state-only SHA.
6. Preserve PostCSS/Sharp and Cloudflare/Wrangler findings. Do not run broad `npm audit fix`; PKG-010 owns the Cloudflare chain.

## Recovery boundary

- Last remote-verified stable product commit: `0754a4f1414768aff06cf91df5669c7379c32c7b`.
- GitHub Actions evidence: run `30716519172`, `completed/success`, exact head SHA `0754a4f1414768aff06cf91df5669c7379c32c7b`.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key/schema, package manifest, dependency versions, hosting configuration, and deployment state remained unchanged by PKG-006; only lockfile registry hostnames and recovery records changed.
- The workflow token has only `contents: read`; browser E2E remains a separate local gate, and branch protection is not enabled.
- The normalized candidate has 717 npmjs and zero npmmirror resolved URLs; all locked integrity hashes and tarball paths are unchanged.
- The PKG-007 candidate removes all nine Next-specific advisory records. Four PostCSS/Sharp advisory records remain because stable Next has not yet incorporated the compatible upstream updates.
- PKG-008 baseline complete audit contains one direct RSC advisory (`GHSA-wx67-qw84-cm4g`), fixed in the coherent `19.2.8` trio. Vite and Cloudflare/Wrangler remain separate scopes.
- PKG-008 candidate and repository lockfiles retain 724 entries and change exactly the root, React, React DOM, and RSC records; no package is added or removed. Complete audit drops to 14 package records / 25 advisory sources, and the RSC advisory disappears.
- Repository checks pass with 112 Vitest, 13 Chromium, 7 WebKit, production build, live RSC response, bounded multipart/unknown-action handling, and post-probe liveness. vinext currently returns a generic 500 for an unknown Action ID but remains live; this is recorded as observed adapter behavior, not evidence of a hang.
- PKG-009 baseline complete audit has two direct Vite advisories affecting `8.0.13`; both official patched ranges begin at `8.0.16`. Production audit is unchanged because Vite is a development/build dependency.
- PKG-009 selects `8.0.16` over `8.2.0`: the accepted candidate retains 724 lock records, changes 24, adds/removes none, and moves no excluded direct package. Both Vite findings disappear; complete audit becomes 13 package records / 23 advisory sources.
- Repository gates pass with 590-package cold install, clean peer graph, 112 Vitest, 13 Chromium, 7 WebKit, production build/smoke, Cloudflare workerd preview, no-upload deploy dry-run, artifact assertions, and stopped listeners.
- Three untracked conflict-style historical copies appeared during final staging. They were compared read-only, excluded from the commit, and preserved because deletion is not authorized.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
