# Current State

Current branch: `main`

Current HEAD: `51821add9f7648d3f4fd92528559894a709a8356` (remote-verified PKG-008 recovery checkpoint; pre-PKG-009 baseline)

Last stable commit: `51821add9f7648d3f4fd92528559894a709a8356` (`origin/main`; GitHub Actions run `30714376713` completed successfully for this exact SHA)

Current objective: Complete PKG-009 with the smallest supported Vite security patch while keeping Cloudflare/Wrangler and product behavior unchanged.

Active task: PKG-009 is IN_PROGRESS. Exact Vite `8.0.16` is applied and all local compatibility/security gates pass; product commit, push, and exact-SHA GitHub Actions verification remain.

Modified files: Eleven intended PKG-009 files: `package.json`, `package-lock.json`, three public status/changelog documents, and six `.codex/` recovery/decision files. Three documented historical conflict copies remain untracked, preserved, and excluded.

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

Remaining steps:

- Commit and push only the 11 scoped product-checkpoint files, then require completed GitHub Actions success for the exact product SHA.
- Record the verified product SHA/run in a state-only checkpoint, push it, and require completed success for that exact state SHA.

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

Known failures: Production-only npm audit remains nonzero because stable Next `16.2.12` pins affected PostCSS/Sharp ranges. Complete audit remains nonzero for the independently scoped Cloudflare/Wrangler and PostCSS/Sharp chains, but no longer reports direct RSC or Vite advisories. Repository-wide `npm run format:check` has 10 pre-existing differences in untouched files. vinext returns a prompt generic HTTP 500 for an unknown Server Action ID while keeping the server live. Three untracked historical conflict copies remain intentionally untouched.

Risk: Low-medium. The bounded patch and all local paths are validated; remote exact-SHA CI remains the completion gate. Cloudflare/Wrangler findings remain explicitly separate.

Next command: Stage the 11 intended tracked files explicitly, verify the staged boundary, and create `security: patch Vite advisories`.

Resume instructions: Read `.codex/RESUME.md`, verify baseline HEAD/run `51821ad` / `30714376713`, preserve the three documented untracked files and all task-owned temp directories, then resume at final review/commit. Do not regenerate the accepted lockfile or include Cloudflare/Wrangler.
