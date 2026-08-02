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

PKG-013 product work is complete. Product commit `0cb96bc06ee3a0fd3efd35e7ac7b0b3300895385` is pushed and remote-verified by exact-SHA GitHub Actions run `30742915491`. Only the documentation-only completion checkpoint may still be uncommitted, unpushed, or awaiting CI. Four untracked historical conflict copies and the recoverable sibling dependency backup remain preserved.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local history, `origin/main`, and GitHub contain product commit `0cb96bc06ee3a0fd3efd35e7ac7b0b3300895385`; GitHub Actions run `30742915491` must remain `completed/success` for that exact SHA.
3. Inspect whether a newer documentation-only completion checkpoint exists. If uncommitted, validate and stage only the intended recovery/status files; if committed or pushed, verify its exact scope, SHA, remote state, and CI instead of recreating it.
4. Preserve `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, `.codex/LAST_VALIDATION 3.json`, and `docs/NEXT_STEPS 2.md` as untracked files unless explicit deletion approval is given. They must not be committed.
5. Preserve sibling backup `PokGuy.node_modules-backup-PKG010-20260802T0527`; do not delete it without approval.
6. Commit only the final recovery/status files with `docs: record formatting quality gate checkpoint`, push without force, and require completed exact-SHA Quality success. Do not create another commit solely to record that final run.
7. After the final state checkpoint is remote-verified, keep PKG-013 closed and select the next separately approved task.
8. Preserve Next PostCSS/Sharp as the separate stable-upstream waiting item. Do not change dependencies, storage, generated output, hosting/deployment configuration, upload, or run broad `npm audit fix`.

PKG-013 reproduction contract, only if product commit `0cb96bc` is absent:

```text
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build
```

## Recovery boundary

- Last remote-verified stable commit: `0cb96bc06ee3a0fd3efd35e7ac7b0b3300895385`.
- GitHub Actions evidence: run `30742915491`, `completed/success`, exact head SHA `0cb96bc06ee3a0fd3efd35e7ac7b0b3300895385`.
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
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
