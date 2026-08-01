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

PKG-010 is blocked only on explicit configuration-change approval. The minimum Cloudflare dependency candidate and a compatibility-preserving date pin passed the complete isolated validation matrix; no repository package/config/product file has changed. Four untracked historical conflict copies remain preserved outside Git.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local HEAD, `origin/main`, and GitHub match the latest PKG-010 recovery checkpoint and its completed exact-SHA Quality run.
3. Confirm only PKG-010 recovery records are modified; package/config/product files must remain unchanged until approval.
4. Preserve `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, `.codex/LAST_VALIDATION 3.json`, and `docs/NEXT_STEPS 2.md` as untracked files unless explicit deletion approval is given. They must not be committed.
5. Require explicit approval before adding `compatibility_date: "2026-05-15"` to `localBindingConfig`; this preserves the baseline date because plugin `1.47.0` otherwise defaults to `2026-07-23`.
6. After approval, apply only plugin `1.47.0`, Wrangler `4.114.0`, exact Workers types `5.20260722.1`, the approved date pin, and the dry-run documentation rename to `--autoconfig=false`.
7. Move the current generated `node_modules` to a task-owned backup outside the repository and perform a clean install from the accepted lockfile; do not delete the backup without approval.
8. Run `npm ls --all`, `npm run check`, Chromium/WebKit, production smoke, real workerd preview, no-upload Wrangler deploy dry-run, artifact, formatting, structural, and sensitive-data gates.
9. Preserve PostCSS/Sharp findings. Do not run broad `npm audit fix`, upload, or change deployment resources.

## Recovery boundary

- Last remote-verified stable checkpoint: `2533feb4da3375cf2c509c8a136aa6b519245734`.
- GitHub Actions evidence: run `30716624979`, `completed/success`, exact head SHA `2533feb4da3375cf2c509c8a136aa6b519245734`.
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
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
