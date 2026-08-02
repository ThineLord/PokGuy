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

PKG-014 product work is complete at pushed SHA `58280a98c05ba46d5eee229a437b9d37ad504b1e`. Exact-SHA run `30743841409` completed successfully for the unchanged core quality job and its dependent Chromium E2E job; the latter passed 13/13 tests. The final eight-file documentation/recovery checkpoint may be uncommitted, pushed, or awaiting its own two jobs. Four untracked historical conflict copies and the recoverable sibling dependency backup remain preserved.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md`, verify Git status/history, and confirm product SHA `58280a98c05ba46d5eee229a437b9d37ad504b1e` plus exact-SHA run `30743841409`.
2. Inspect whether a newer documentation-only immediate descendant exists. If uncommitted, require exactly these eight modified state files: `.codex/COMPLETED.md`, `.codex/CURRENT_STATE.md`, `.codex/DECISIONS.md`, `.codex/LAST_VALIDATION.json`, `.codex/RESUME.md`, `.codex/TASK_QUEUE.md`, `docs/IMPLEMENTATION_STATUS.md`, and `docs/NEXT_STEPS.md`. If committed or pushed, verify that exact scope and SHA instead of recreating it.
3. Before committing an uncommitted checkpoint, run formatter-first `npm run check`; parse JSON/YAML; confirm workflow hash `d02f3b3322fab948c729edad3742414eda1915f7927ff83b5966f38070209b29`; confirm package/lock, product, tests, Playwright config, storage, Vite, hosting, and deployment are unchanged from the product SHA; run whitespace/sensitive/scope/listener checks.
4. Preserve `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, `.codex/LAST_VALIDATION 3.json`, and `docs/NEXT_STEPS 2.md` as untracked files unless explicit deletion approval is given. They must not be committed.
5. Preserve sibling backup `PokGuy.node_modules-backup-PKG010-20260802T0527`; do not delete it without approval.
6. If the checkpoint is uncommitted, require independent recovery-state review, stage only the eight state files, and commit `docs: record Chromium CI checkpoint`.
7. If the immediate descendant is not remote/two-job verified, push without force, verify local/tracking/remote/GitHub SHA equality, and require both the core and Chromium jobs to complete successfully for that exact state SHA. Do not create another commit solely to record the final run.
8. After verified success, no task is active. PKG-015 remains unapproved: do not add artifact upload, actions, retention, or privacy/storage changes until its separately documented boundary is approved. Preserve Next PostCSS/Sharp as the stable-upstream waiting item.

## Recovery boundary

- Last remote-verified stable commit: `58280a98c05ba46d5eee229a437b9d37ad504b1e`.
- GitHub Actions evidence: run `30743841409`, `completed/success`, exact head SHA `58280a98c05ba46d5eee229a437b9d37ad504b1e`; core quality completed in 54s and dependent Chromium E2E completed in 1m29s with 13/13 tests.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key/schema, package manifest, dependency versions, hosting configuration, and deployment state remained unchanged by PKG-006; only lockfile registry hostnames and recovery records changed.
- The workflow token has only `contents: read`; Chromium E2E is a separate dependent CI gate, selected WebKit remains local, and branch protection is not enabled.
- The normalized candidate has 717 npmjs and zero npmmirror resolved URLs; all locked integrity hashes and tarball paths are unchanged.
- The PKG-007 candidate removes all nine Next-specific advisory records. Four PostCSS/Sharp advisory records remain because stable Next has not yet incorporated the compatible upstream updates.
- PKG-008 baseline complete audit contains one direct RSC advisory (`GHSA-wx67-qw84-cm4g`), fixed in the coherent `19.2.8` trio. Vite and Cloudflare/Wrangler remain separate scopes.
- PKG-008 candidate and repository lockfiles retain 724 entries and change exactly the root, React, React DOM, and RSC records; no package is added or removed. Complete audit drops to 14 package records / 25 advisory sources, and the RSC advisory disappears.
- Repository checks pass with 112 Vitest, 13 Chromium, 7 WebKit, production build, live RSC response, bounded multipart/unknown-action handling, and post-probe liveness. vinext currently returns a generic 500 for an unknown Action ID but remains live; this is recorded as observed adapter behavior, not evidence of a hang.
- PKG-009 baseline complete audit has two direct Vite advisories affecting `8.0.13`; both official patched ranges begin at `8.0.16`. Production audit is unchanged because Vite is a development/build dependency.
- PKG-009 selects `8.0.16` over `8.2.0`: the accepted candidate retains 724 lock records, changes 24, adds/removes none, and moves no excluded direct package. Both Vite findings disappear; complete audit becomes 13 package records / 23 advisory sources.
- Repository gates pass with 590-package cold install, clean peer graph, 112 Vitest, 13 Chromium, 7 WebKit, production build/smoke, Cloudflare workerd preview, no-upload deploy dry-run, artifact assertions, and stopped listeners.
- Four untracked conflict-style historical copies are excluded and preserved because deletion is not authorized.
- Before the PKG-010 cold reinstall, generated `node_modules` contained 153 ` 2`-suffixed conflict entries and made `npm ls --all` report extraneous packages. That historical workspace residue is preserved in the recoverable sibling backup; the active tree is now clean.
- The minimum coherent candidate is plugin `1.47.0` / Wrangler `4.114.0` / Workers types `5.20260722.1`; latest plugin `1.50.0` adds a Miniflare 5 alpha without reducing more findings.
- The isolated candidate reduces complete audit results from 13 records / 23 sources to 7 / 13 and removes the Cloudflare chain. Production remains 3 / 4 for deferred Next PostCSS/Sharp findings.
- With an explicit baseline date pin, all 112 tests/build, generated configuration assertions, real workerd HTML/RSC/SVG probes, listener cleanup, and strict `wrangler deploy --dry-run --autoconfig=false` pass without upload or input mutation.
- Repository package/lock files are byte-identical to the exact-types isolated candidate. The package manager briefly selected newly published `@speed-highlight/core 1.2.22`; the repository intentionally retains validated `1.2.20` and its exact integrity record.
- The active repository tree was cold-installed with 593 packages and has no dependency problem. The original anomalous 1.1 GB tree is recoverably preserved as a sibling backup outside Git.
- After PKG-010 and before PKG-011, the complete audit was 7 records / 13 sources (6 high, 1 low, zero critical); Cloudflare/plugin/Wrangler/Miniflare/workerd/esbuild/ws/undici were absent. Production remained Next/PostCSS/Sharp 3 / 4.
- Repository `npm run check`, 13 Chromium, 7 WebKit, vinext production, workerd preview, artifact invariants, strict no-upload dry-run, formatting/security/scope, and two independent reviews pass.
- At the PKG-011 baseline, the complete audit had 7 package records / 13 sources. All four development-toolchain records were transitive and had stable compatible fixes within their current parent ranges; no direct manifest change or override was required.
- The accepted PKG-011 isolated candidate keeps 754 records, changes exactly six, adds/removes none, contains zero mirror URL, and leaves all excluded records identical. Its package manifest remains byte-identical and its lock SHA-256 is `b1ee4dec8caa44b2e8d2bbfac6e5e9c4d27a9cde75aacc56699cfd42eb25856c`.
- Isolated cold install, clean dependency graph, complete audit, lint, strict typecheck, 13 Vitest files / 112 tests, and production build pass. Candidate complete audit retains only Next/PostCSS/Sharp 3 records / 4 sources.
- Explicit approval was received and the repository lock is byte-identical to the accepted candidate. Package manifest remains unchanged; lock SHA-256 is `b1ee4dec8caa44b2e8d2bbfac6e5e9c4d27a9cde75aacc56699cfd42eb25856c` with exactly six changed and zero added/removed records.
- Repository cold install and clean dependency graph pass. Current complete and production audits both contain only Next/PostCSS/Sharp 3 high records / 4 independent sources; 112 tests/build, 13 Chromium, 7 WebKit, artifact invariants, vinext production, real-workerd, stopped listeners, and final local scope/security checks pass.
- PKG-011 product commit `8fafbe9` and state commit `1e29b8e` are pushed and exact-SHA CI-verified by Quality runs `30723138038` and `30723436548`.
- PKG-012 product commit `50af427` and state commit `e471837` are pushed and exact-SHA CI-verified. Repository-wide Prettier is green before PKG-013 begins.
- PKG-013 product commit changes no runtime input, dependency, lockfile, workflow, storage, hosting, or deployment configuration. Local formatter-first canonical check, 13 Chromium, 7 WebKit, push, four-way SHA match, and exact-SHA Quality run `30742915491` pass.
- Final PKG-013 state commit `246d7e1`, remote SHA match, and exact-SHA Quality run `30743120836` are verified.
- PKG-014 is approved to append one dependent Chromium-only job while preserving the core job, events, permissions, concurrency, package/lock, product, tests, Playwright config, WebKit, artifacts, secrets, hosting, deployment, and branch protection boundaries.
- PKG-014 product commit `58280a9`, four-way remote SHA match, and exact-SHA two-job run `30743841409` are verified. The product checkpoint did not upload Playwright traces; failure-only artifact retention is deferred to separately approval-gated PKG-015.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
