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

PKG-010 is locally validated after explicit approval. Baseline checkpoint `e08c2bc` is pushed and verified by exact-SHA GitHub Actions run `30718725693`. The 12-file product checkpoint awaits commit/push/exact-SHA CI; four untracked historical conflict copies and the recoverable sibling dependency backup remain preserved.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local HEAD, `origin/main`, and GitHub contain baseline commit `e08c2bc`; GitHub Actions run `30718725693` must remain `completed/success` for that exact SHA.
3. Confirm the product scope is exactly package/lock, one Vite config line, `CHANGELOG.md`, two product status/next docs, and six recovery records. Worker/product/persistence/hosting resources are excluded.
4. Preserve `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, `.codex/LAST_VALIDATION 3.json`, and `docs/NEXT_STEPS 2.md` as untracked files unless explicit deletion approval is given. They must not be committed.
5. Approval is recorded: apply only plugin `1.47.0`, Wrangler `4.114.0`, exact Workers types `5.20260722.1`, the approved `2026-05-15` date pin, and the dry-run documentation rename to `--autoconfig=false`.
6. Package/lock candidate hashes and every local gate already pass. Preserve sibling backup `PokGuy.node_modules-backup-PKG010-20260802T0527`; do not delete it without approval.
7. Review the complete diff and semantic 724→754 lock boundary, then stage only the 12 intended files and create the bounded product commit.
8. Push `main`, require completed GitHub Actions success for the exact product SHA, then finalize recovery status and repeat commit/push/exact-SHA CI for the state checkpoint.
9. Preserve PostCSS/Sharp and residual development-chain findings. Do not run broad `npm audit fix`, upload, or change deployment resources.

## Recovery boundary

- Last remote-verified stable checkpoint: `0e7f0495904c89124376dfb92e642040034b1567`.
- GitHub Actions evidence: run `30718647980`, `completed/success`, exact head SHA `0e7f0495904c89124376dfb92e642040034b1567`.
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
- Four untracked conflict-style historical copies are excluded and preserved because deletion is not authorized.
- Current generated `node_modules` contains 153 ` 2`-suffixed conflict entries and makes baseline `npm ls --all` report extraneous packages. This is workspace residue, not lockfile drift; preserve it through a recoverable directory backup before clean reinstall.
- The minimum coherent candidate is plugin `1.47.0` / Wrangler `4.114.0` / Workers types `5.20260722.1`; latest plugin `1.50.0` adds a Miniflare 5 alpha without reducing more findings.
- The isolated candidate reduces complete audit results from 13 records / 23 sources to 7 / 13 and removes the Cloudflare chain. Production remains 3 / 4 for deferred Next PostCSS/Sharp findings.
- With an explicit baseline date pin, all 112 tests/build, generated configuration assertions, real workerd HTML/RSC/SVG probes, listener cleanup, and strict `wrangler deploy --dry-run --autoconfig=false` pass without upload or input mutation.
- Repository package/lock files are byte-identical to the exact-types isolated candidate. The package manager briefly selected newly published `@speed-highlight/core 1.2.22`; the repository intentionally retains validated `1.2.20` and its exact integrity record.
- The active repository tree was cold-installed with 593 packages and has no dependency problem. The original anomalous 1.1 GB tree is recoverably preserved as a sibling backup outside Git.
- Complete audit is now 7 records / 13 sources (6 high, 1 low, zero critical); Cloudflare/plugin/Wrangler/Miniflare/workerd/esbuild/ws/undici are absent. Production remains Next PostCSS/Sharp 3 / 4.
- Repository `npm run check`, 13 Chromium, 7 WebKit, vinext production, workerd preview, artifact invariants, strict no-upload dry-run, formatting/security/scope, and two independent reviews pass.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
