# Current State

Current branch: `main`

Current HEAD: Recovery-documentation checkpoint on top of validated PKG-010 product commit `448a2432d3890c7aadd6e9aa9dc46ee4ba34cc10`; run `git rev-parse HEAD` for the exact state-only commit after it is created.

Last stable commit: `448a2432d3890c7aadd6e9aa9dc46ee4ba34cc10` (`origin/main`; GitHub Actions run `30719418742` completed successfully for this exact SHA)

Current objective: Preserve the completed PKG-010 Cloudflare security checkpoint and select the next highest-value bounded dependency task.

Active task: None. PKG-010 is complete; PKG-011 is queued as the next P2 development-toolchain security audit.

Modified files: This final checkpoint contains eight recovery/status documentation files only. The validated PKG-010 product commit is already pushed. Four historical conflict-style copies remain untracked, preserved, and excluded.

Completed steps:

- Confirmed clean startup with local HEAD, `origin/main`, and GitHub at `eb637a5`; final PKG-006 CI run `30710600306` remains `completed/success` for that exact SHA.
- Reproduced the official-registry production audit: 13 advisory records across the `next`/PostCSS/Sharp chain before the patch.
- Verified Next `16.2.11` is the official July security boundary and selected current stable `16.2.12`; aligned `eslint-config-next` to keep its exact Next ESLint plugin dependency coherent.
- Confirmed Node 22.13+ and React/React DOM `19.2.6` remain within the updated packages' declared compatibility ranges.
- Built an isolated candidate with 724 lock entries unchanged in count: only the root record plus 12 Next-owned entries changed from `16.2.6` to `16.2.12`; no React, Vite, vinext, Wrangler, Cloudflare, added, or removed package appeared.
- Passed isolated cold-cache `npm ci` and `npm run check`; reproduced the exact candidate hashes in the repository after applying the same two manifest edits.
- Passed repository cold-cache `npm ci`, confirmed installed versions, and passed `npm run check` with lint, typecheck, 13 Vitest files / 112 tests, and production build.
- Confirmed all 9 Next.js advisory records disappeared; four residual advisory records remain (three PostCSS, one Sharp), with zero critical finding.
- Rejected PostCSS/Sharp overrides: stable Next pins ranges that exclude the safe versions, and upstream compatibility work changes vendored bundles, image optimization, tests, and Turbopack tracing.
- Passed 13 Chromium tests, 7 selected WebKit tests, and production server smoke at `http://localhost:43217/` with HTTP 200 and the expected RiverLab title.
- Passed final changed-file formatting, whitespace, lock-boundary, JSON, credential/private-path, stopped-listener, and complete diff review; the intended commit contains only the 11 scoped PKG-007 files.
- Detected three untracked conflict-style historical copies after final staging: `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, and `docs/NEXT_STEPS 2.md`. They are older maintenance snapshots, are excluded from the commit, and are preserved pending explicit deletion approval.
- Created and pushed product commit `2c2782d`; local HEAD, `origin/main`, and GitHub matched exact SHA `2c2782d5223b5f63448c442adaed97360cbbd46c`.
- Waited for GitHub Actions run `30713299084`; Node 22 clean install, `npm run check`, and every job/post step completed successfully for the exact product SHA.
- Confirmed startup at clean tracked HEAD/origin/GitHub SHA `72fb430`; final state-only run `30713421819` is `completed/success`, with no interrupted Git operation or stash.
- Passed the unmodified PKG-008 baseline `npm run check` with lint, typecheck, 13 Vitest files / 112 tests, and production build.
- Reproduced official-registry audits: production remains 3 package records / 4 PostCSS-Sharp advisories; complete audit has 15 package records / 26 advisory-source records and zero critical finding.
- Isolated the direct RSC finding as `GHSA-wx67-qw84-cm4g` / `CVE-2026-44907`, affecting `react-server-dom-webpack >=19.2.0 <19.2.8`.
- Confirmed `19.2.8` is the current stable trio and the minimum fix; React DOM and RSC `19.2.8` require React/React DOM `^19.2.8`, while Next `16.2.12`, vinext `0.0.50`, plugin-rsc `0.5.26`, and Webpack `5.106.2` remain compatible.
- Confirmed the server bundles include RSC decoding/rendering code even though the app defines no Server Actions, so the direct advisory cannot be dismissed as unreachable development-only metadata.
- Rejected an initial isolated `npm install --prefix` harness result because npm rewrote lock keys relative to the absolute prefix; no repository file was affected and that candidate was not used.
- Generated a clean archive candidate and retained all 724 lock entries. Only the root, React, React DOM, and RSC records changed; no package was added/removed and no mirror URL returned.
- Applied byte-identical candidate package files. Cold `npm ci`, `npm ls --all`, version/peer checks, and isolated plus repository `npm run check` pass with the trio at `19.2.8` and all excluded toolchain versions unchanged.
- Removed the direct RSC advisory: complete audit improved from 15 package records / 26 advisory sources to 14 / 25; production audit remains the expected 3 package records / 4 PostCSS-Sharp sources; zero critical finding.
- Passed 13 Chromium and 7 WebKit tests. Production smoke returned HTTP 200 for the app, a valid `text/x-component` RSC stream, bounded multipart and unknown-action responses, and HTTP 200 liveness after the malformed request; port `43218` was stopped.
- Passed changed-file Prettier, JSON, whitespace, candidate byte/hash, exact four-record lock boundary, zero mirror URL, sensitive/private-path, stopped-listener, and complete diff checks for the intended 11 tracked files.
- Created and pushed product commit `237ff2b`; local HEAD, `origin/main`, and GitHub matched exact SHA `237ff2b68fde421a56a4aabdacdecfe8be57041d`.
- Waited for GitHub Actions run `30714243780`; Node 22 clean install, `npm run check`, and every job/post step completed successfully for the exact product SHA.
- Confirmed startup at local/tracking/GitHub SHA `51821ad`; final PKG-008 state run `30714376713` is `completed/success`, with no stash or interrupted Git operation.
- Passed the unmodified PKG-009 baseline `npm run check` with lint, typecheck, 13 Vitest files / 112 tests, and production build on Vite `8.0.13`.
- Reproduced official-registry audits: production has 3 package records / 4 PostCSS-Sharp sources; complete has 14 package records / 25 sources and zero critical finding.
- Isolated two direct Vite advisories: moderate `GHSA-v6wh-96g9-6wx3` and high `GHSA-fx2h-pf6j-xcff`, both affecting Vite `8.0.0` through `8.0.15` and first patched in `8.0.16`.
- Confirmed npm latest is `8.2.0`, but it also changes Rolldown, PostCSS, Lightning CSS, picomatch, and devtools peer ranges; the patch-level `8.0.16` candidate must be preferred if it clears both findings and passes compatibility gates.
- Compared isolated candidates: `8.0.16` retains 724 lock records, changes 24, and adds/removes none; `8.2.0` changes 37 and adds three, so the broader minor candidate was rejected.
- Applied byte-identical accepted candidate package files and completed cold-cache `npm ci` with 590 packages; `npm ls --all` reports no peer problem and excluded direct package versions remain unchanged.
- Removed both direct Vite advisories. Production audit remains 3 package records / 4 PostCSS-Sharp sources; complete audit improves from 14 package records / 25 sources to 13 / 23; zero critical finding.
- Passed `npm run check` with 112 tests/build, 13 Chromium tests, 7 WebKit tests, production HTML/RSC/SVG smoke, Cloudflare workerd preview, no-upload Wrangler deploy dry-run, hosting artifact assertions, and stopped-listener checks.
- Passed final changed-file Prettier, JSON, whitespace, exact 24-record lock/package boundary, candidate byte/hash, mirror, sensitive/private-path, tracked/untracked scope, complete diff, and independent read-only review.
- Created and pushed product commit `0754a4f`; local HEAD, `origin/main`, and GitHub matched exact SHA `0754a4f1414768aff06cf91df5669c7379c32c7b`.
- Waited for GitHub Actions run `30716519172`; Node 22 clean install, `npm run check`, and every job/post step completed successfully for the exact product SHA.
- Confirmed startup at local/tracking/GitHub SHA `2533feb`; final PKG-009 state run `30716624979` is `completed/success`, with no stash or interrupted Git operation.
- Preserved four untracked historical copies, including the newly observed `.codex/LAST_VALIDATION 3.json`; none is staged or opened for modification.
- Passed the unmodified PKG-010 baseline `npm run check` with lint, typecheck, 13 Vitest files / 112 tests, and production build on Vite `8.0.16`.
- Reproduced official-registry audits: production remains 3 package records / 4 PostCSS-Sharp sources; complete has 13 package records / 23 sources and zero critical finding.
- Isolated direct affected ranges reported by npm: Cloudflare Vite plugin through `1.41.0`, Wrangler through `4.101.0`, and Miniflare through `4.20260721.0`; official release evidence and coherent version candidates remain under review.
- Diagnosed 153 conflict-style `node_modules` entries with a ` 2` suffix. Baseline functionality passes, but `npm ls --all` correctly reports them as extraneous; candidate work remains isolated and the repository dependency tree will be rebuilt recoverably before acceptance.
- Confirmed the first coherent stable boundary is `@cloudflare/vite-plugin 1.47.0` plus `wrangler 4.114.0`; it resolves Miniflare `4.20260722.0`, workerd `1.20260722.1`, esbuild `0.28.1`, ws `8.21.0`, undici `7.28.0`, and Miniflare's Sharp `0.35.2`.
- Rejected latest plugin `1.50.0` / Wrangler `4.118.0`: it removes no additional finding and introduces a Miniflare 5 alpha boundary.
- Compared caret and exact Workers types candidates. Both pass cold install, peer, typecheck, build, and audits; exact `5.20260722.1` changes only the root/type records relative to caret and is preferred to align with the accepted runtime date without unrelated daily type drift.
- Confirmed the baseline plugin and generated artifact use compatibility date `2026-05-15`, while plugin `1.47.0` defaults to `2026-07-23`. A dependency-only edit would therefore silently change Worker runtime semantics.
- Validated the isolated candidate with a temporary explicit `compatibility_date: "2026-05-15"` pin: lint, typecheck, 13 Vitest files / 112 tests, build, hosting artifacts, real workerd HTML/RSC/SVG requests, listener cleanup, and strict no-upload deploy dry-run all pass.
- Confirmed Wrangler `4.114.0` replaces the removed validation flag `--experimental-autoconfig=false` with `--autoconfig=false`; the checked-in dry-run documentation will need the same bounded command update after approval.
- Created and pushed approval-boundary commit `0e7f049`; local HEAD, `origin/main`, and GitHub matched exact SHA `0e7f0495904c89124376dfb92e642040034b1567`.
- Waited for GitHub Actions run `30718647980`; Node 22 clean install, `npm run check`, and every job/post step completed successfully for the exact approval-boundary SHA.
- Confirmed final approval checkpoint `e08c2bc` is present locally/remotely and Quality run `30718725693` completed successfully for that exact SHA.
- Received explicit approval through the user's `next` response to add the compatibility-date pin and apply the already validated dependency candidate.
- Applied package/lock files byte-identical to the exact-types isolated candidate (`package.json` SHA-256 `e50e4241…`, lock SHA-256 `96a2625c…`).
- Rejected a newly published `@speed-highlight/core 1.2.22` lock drift that appeared during regeneration; retained the fully validated candidate's `1.2.20` record.
- Moved the anomalous 1.1 GB dependency tree to a recoverable sibling backup and completed a cold `npm ci --ignore-scripts` with 593 packages; no backup or historical file was deleted.
- Confirmed `npm ls --all` has no problem. The lock changes from 724 to 754 records with 16 changed, 58 added, and 28 removed; Next, React, Vite, and vinext records remain unchanged.
- Reduced complete audit results from 13 records / 23 sources to 7 / 13 (6 high, 1 low, zero critical); every Cloudflare/plugin/Wrangler/Miniflare/workerd/esbuild/ws/undici finding is absent. Production remains the expected Next PostCSS/Sharp 3 / 4.
- Passed repository lint, strict typecheck, 13 Vitest files / 112 tests, production build, 13 Chromium tests, and 7 WebKit tests.
- Passed generated artifact assertions, vinext production and real workerd HTML/RSC/SVG/liveness probes, listener cleanup, and credential-unset strict deploy dry-run with no upload or monitored input mutation.
- Passed changed-file formatting, JSON, whitespace, candidate byte/hash, npmjs-only registry, sensitive/private-path, and two independent read-only dependency/security reviews.
- Created and pushed product commit `448a243`; local HEAD, `origin/main`, remote, and GitHub matched exact SHA `448a2432d3890c7aadd6e9aa9dc46ee4ba34cc10`.
- Waited for GitHub Actions run `30719418742`; Node 22 normal `npm ci`, `npm run check`, and every job/post step completed successfully for the exact product SHA.

Remaining steps:

- Stage and commit only the eight recovery/status documentation files without including the four preserved untracked files.
- Push the state-only checkpoint and require completed GitHub Actions success for its exact SHA; no additional self-referential state commit is needed solely to record that run.

Current tests:

- Baseline `npm run check` — PASS at 2026-08-02T02:32+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- Isolated candidate `npm ci` and `npm run check` — PASS (590 packages; same 112 tests and build).
- Repository cold-cache `npm ci` — PASS at 2026-08-02T02:37+08:00 (590 packages; scripts disabled for local supply-chain isolation).
- Repository `npm run check` — PASS at 2026-08-02T02:38+08:00.
- `npm run test:e2e` — PASS at 2026-08-02T02:39+08:00 (13 Chromium tests).
- `npm run test:e2e:webkit` — PASS at 2026-08-02T02:39+08:00 (7 selected WebKit tests).
- Production `vinext start --port 43217` plus HTTP/title smoke — PASS at 2026-08-02T02:39+08:00.
- Production audit advisory records — improved from 13 to 4; expected nonzero result remains for PostCSS/Sharp.
- Final formatting, whitespace, dependency-boundary, JSON, sensitive/private-path, and stopped-listener checks — PASS at 2026-08-02T02:44+08:00.
- GitHub Actions `Quality` run `30713299084` — PASS at 2026-08-02T02:47+08:00 (`completed/success`, exact product SHA `2c2782d`; clean install and all quality steps passed).
- PKG-008 baseline `npm run check` — PASS at 2026-08-02T02:55+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- PKG-008 baseline audits — expected nonzero results: production 3 package records / 4 advisories; complete 15 package records / 26 advisory-source records including one direct RSC finding; zero critical.
- PKG-008 isolated candidate `npm ci` and `npm run check` — PASS (590 packages, valid peer graph, 112 tests/build).
- PKG-008 repository `npm ci`, `npm ls --all`, and `npm run check` — PASS (590 packages; no peer problem; lint, typecheck, 112 tests, build).
- PKG-008 post-update audits — expected nonzero results: production unchanged at 3 package records / 4 sources; complete reduced to 14 package records / 25 sources; direct RSC finding absent; zero critical.
- `npm run test:e2e` — PASS (13 Chromium tests).
- `npm run test:e2e:webkit` — PASS (7 selected WebKit tests).
- Production/RSC request smoke on `localhost:43218` — PASS (HTML 200, RSC 200 component stream, bounded multipart and unknown Action handling, post-probe HTML 200, listener stopped).
- Final changed-file formatting, JSON, whitespace, candidate/hash, dependency boundary, mirror, sensitive/private-path, stopped-listener, status, and complete diff review — PASS at 2026-08-02T03:10+08:00.
- GitHub Actions `Quality` run `30714243780` — PASS at 2026-08-02T03:13+08:00 (`completed/success`, exact product SHA `237ff2b`; clean install and all quality steps passed).
- GitHub Actions `Quality` run `30714376713` — PASS (`completed/success`, exact recovery SHA `51821ad`).
- PKG-009 baseline `npm run check` — PASS at 2026-08-02T04:00+08:00 (lint, typecheck, 13 Vitest files / 112 tests, Vite `8.0.13` production build).
- PKG-009 baseline audits — expected nonzero results: production 3 package records / 4 sources; complete 14 package records / 25 sources including two direct Vite advisories; zero critical.
- PKG-009 isolated/repository cold installs and `npm ls --all` — PASS (590 packages, no peer problem, accepted package files byte-identical).
- PKG-009 post-update audits — expected nonzero results: production unchanged at 3 package records / 4 sources; complete reduced to 13 package records / 23 sources; direct Vite advisories absent; zero critical.
- PKG-009 repository `npm run check` — PASS (lint, typecheck, 13 Vitest files / 112 tests, Vite `8.0.16` production build).
- PKG-009 `npm run test:e2e` / `npm run test:e2e:webkit` — PASS (13 Chromium / 7 selected WebKit tests).
- PKG-009 production and Cloudflare smokes — PASS (HTML/RSC/SVG responses, workerd preview, deploy dry-run without upload, hosting artifact assertions, listeners stopped).
- PKG-009 final formatting/JSON/whitespace/lock/candidate/mirror/sensitive/private-path/scope/diff/independent review — PASS at 2026-08-02T04:13+08:00.
- GitHub Actions `Quality` run `30716519172` — PASS at 2026-08-02T04:15+08:00 (`completed/success`, exact product SHA `0754a4f`; clean install and all quality steps passed).
- GitHub Actions `Quality` run `30716624979` — PASS (`completed/success`, exact recovery SHA `2533feb`).
- PKG-010 baseline `npm run check` — PASS at 2026-08-02T05:00+08:00 (lint, typecheck, 13 Vitest files / 112 tests, Vite `8.0.16` production build).
- PKG-010 baseline audits — expected nonzero results: production 3 package records / 4 sources; complete 13 package records / 23 sources; zero critical.
- PKG-010 baseline `npm ls --all` — NONZERO because 153 conflict-style generated `node_modules` entries are extraneous; no tracked file or lockfile drift is present.
- PKG-010 isolated minimum candidate cold install / `npm ls --all` / typecheck / build — PASS (593 packages; no dependency problem).
- PKG-010 isolated candidate complete audit — expected nonzero result reduced to 7 package records / 13 sources (6 high, 1 low, zero critical); the complete Cloudflare chain is absent. Production remains 3 records / 4 PostCSS-Sharp sources.
- PKG-010 isolated compatibility-pin `npm run check` — PASS (lint, typecheck, 13 Vitest files / 112 tests, production build).
- PKG-010 isolated artifact / real workerd / strict no-upload deploy dry-run — PASS (date and asset/binding invariants preserved; HTML/RSC/SVG 200; no listener or upload; monitored inputs unchanged).
- GitHub Actions `Quality` run `30718647980` — PASS (`completed/success`, exact approval-boundary SHA `0e7f049`; clean install and all quality steps passed).
- GitHub Actions `Quality` run `30718725693` — PASS (`completed/success`, exact final approval SHA `e08c2bc`).
- PKG-010 repository cold install / `npm ls --all` — PASS (593 packages; no dependency/peer problem).
- PKG-010 repository `npm run check` — PASS at 2026-08-02T05:28+08:00 (lint, typecheck, 13 Vitest files / 112 tests, build).
- PKG-010 repository Chromium / WebKit — PASS (13 / 7 tests).
- PKG-010 repository audits — expected nonzero results: production 3 records / 4 PostCSS-Sharp sources; complete 7 records / 13 sources; 0 critical and no Cloudflare-chain finding.
- PKG-010 repository artifact / vinext / workerd / strict dry-run — PASS (HTML/RSC/SVG 200, date/assets/bindings preserved, listeners stopped, no upload/input mutation).
- PKG-010 changed-file formatting/JSON/whitespace/candidate/registry/sensitive/scope and independent reviews — PASS.
- GitHub Actions `Quality` run `30719418742` — PASS at 2026-08-02T05:35+08:00 (`completed/success`, exact product SHA `448a243`; Node 22 normal install and all quality steps passed).

Known failures: Production-only npm audit remains nonzero because stable Next `16.2.12` pins affected PostCSS/Sharp ranges. Complete audit retains independent Babel/brace-expansion/fast-uri/js-yaml development-chain records queued for PKG-011. Repository-wide `npm run format:check` has 10 pre-existing differences in untouched files. vinext returns a prompt generic HTTP 500 for an unknown Server Action ID while keeping the server live. Four untracked historical conflict copies remain intentionally untouched.

Risk: Low for the completed checkpoint. Product commit, push, remote SHA, and Node 22 exact-SHA CI are verified; residual production and development-toolchain findings remain explicitly separated.

Next command: Stage and commit only the eight state/status files, push the checkpoint, and require completed CI for its exact SHA.

Resume instructions: Read `.codex/RESUME.md`, verify product commit/run `448a243` / `30719418742`, then determine from Git history whether this final recovery checkpoint still needs commit/push/CI verification. Preserve all four untracked historical copies and the sibling dependency backup.
