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

PKG-011 has a fully mapped and isolated six-record lock-only candidate, but the repository dependency files remain unchanged pending explicit approval. Final PKG-010 state commit `d3866d5` is remote-verified by exact-SHA GitHub Actions run `30719518356`. Four untracked historical conflict copies and the recoverable sibling dependency backup remain preserved.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local HEAD, `origin/main`, and GitHub contain state commit `d3866d5`; GitHub Actions run `30719518356` must remain `completed/success` for that exact SHA, then inspect whether a newer PKG-011 approval checkpoint exists.
3. Confirm whether explicit approval to change dependency resolution is present. Without it, do not modify `package-lock.json`; retain PKG-011 as blocked at the safety gate.
4. Preserve `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, `.codex/LAST_VALIDATION 3.json`, and `docs/NEXT_STEPS 2.md` as untracked files unless explicit deletion approval is given. They must not be committed.
5. Preserve sibling backup `PokGuy.node_modules-backup-PKG010-20260802T0527`; do not delete it without approval.
6. If approval is present, reproduce the minimum candidate with the two commands below. The first historical cutoff must apply only to Babel; verify `package.json` remains unchanged and lock SHA-256 is exactly `b1ee4dec8caa44b2e8d2bbfac6e5e9c4d27a9cde75aacc56699cfd42eb25856c` before continuing.
7. Require exactly six changed records and zero added/removed records: Babel core/generator `7.29.6`, brace-expansion `1.1.18` / `5.0.9`, fast-uri `3.1.5`, and js-yaml `4.3.1`. Any other drift requires stopping and re-auditing.
8. After application, run cold `npm ci --ignore-scripts`, `npm ls --all`, official-registry complete and production audits, `npm run check`, Chromium/WebKit, production/workerd smoke, formatting/security/diff gates, then commit/push and require completed exact-SHA CI.
9. Preserve Next PostCSS/Sharp as the separate stable-upstream waiting item. Do not run broad `npm audit fix`, upload, change deployment resources, or adopt preview dependencies.

Reproduction commands after approval:

```bash
npm update --registry=https://registry.npmjs.org --before=2026-05-25T11:00:00Z --package-lock-only --ignore-scripts --no-audit --no-fund @babel/core
npm update --registry=https://registry.npmjs.org --package-lock-only --ignore-scripts --no-audit --no-fund brace-expansion fast-uri js-yaml
```

## Recovery boundary

- Last remote-verified stable commit: `d3866d5e5013dfca1266598b3335b6ae28be1269`.
- GitHub Actions evidence: run `30719518356`, `completed/success`, exact head SHA `d3866d5e5013dfca1266598b3335b6ae28be1269`.
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
- PKG-011 current complete audit has 7 package records / 13 sources. All four development-toolchain records are transitive and have stable compatible fixes within their current parent ranges; no direct manifest change or override is required.
- The accepted PKG-011 isolated candidate keeps 754 records, changes exactly six, adds/removes none, contains zero mirror URL, and leaves all excluded records identical. Its package manifest remains byte-identical and its lock SHA-256 is `b1ee4dec8caa44b2e8d2bbfac6e5e9c4d27a9cde75aacc56699cfd42eb25856c`.
- Isolated cold install, clean dependency graph, complete audit, lint, strict typecheck, 13 Vitest files / 112 tests, and production build pass. Candidate complete audit retains only Next/PostCSS/Sharp 3 records / 4 sources.
- The repository package manifest and lockfile are still unchanged at this approval boundary. Do not infer that PKG-011 is applied or complete.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
