# Current State

Current branch: `main`

Current HEAD: recovery-documentation checkpoint on top of validated PKG-006 commit `cb19453986661ec52529587c2fc79a34eafed25a`; run `git rev-parse HEAD` for the exact state-only commit.

Last stable commit: `cb19453986661ec52529587c2fc79a34eafed25a` (`origin/main`; GitHub Actions run `30710451561` completed successfully for this exact SHA)

Current objective: Preserve the completed PKG-006 lockfile-provenance checkpoint and select the next highest-value maintenance task.

Active task: None. PKG-006 is complete; PKG-007 is queued as the next P1 security-maintenance checkpoint.

Modified files: Recovery records only until this state checkpoint is committed. The validated PKG-006 product commit is already pushed.

Completed steps:

- Confirmed a clean `main` startup state with local, tracking, and GitHub SHA at `6377692`; no stash or interrupted Git operation exists.
- Passed the unmodified baseline `npm run check` with lint, typecheck, 13 Vitest files / 112 tests, and production build.
- Audited lockfile v3: 724 package entries and 717 HTTPS/SHA-512 downloads, initially split between 619 npmjs and 98 npmmirror URLs.
- Confirmed all 98 mirror `name@version` records match npmjs metadata for integrity and tarball pathname; no credentials, query strings, fragments, git/file/link downloads, or non-`resolved` mirror strings exist.
- Verified in an isolated archive that changing only the 98 hostnames leaves every other lockfile field identical.
- Passed an isolated cold-cache `npm ci` against npmjs; npm did not rewrite the candidate lockfile, and isolated `npm run check` passed.
- Applied the same exact 98-line hostname-only transformation to the repository and re-ran the structural comparison successfully.
- Passed changed-file Prettier, JSON parse, whitespace, provenance-count, credential-pattern, and private-path checks; manually reviewed the complete recovery-documentation diff.
- Created and pushed commit `cb19453` without changing global Git or npm configuration; local HEAD, `origin/main`, and GitHub matched after the push.
- Waited for GitHub Actions run `30710451561`; the Node 22 clean install and quality gate completed successfully for exact SHA `cb19453986661ec52529587c2fc79a34eafed25a`.

Remaining steps:

- Commit and push this recovery-documentation checkpoint.
- Wait for completed GitHub Actions success for the exact state-only commit before stopping.

Current tests:

- Baseline `npm run check` — PASS at 2026-08-02T01:21+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- Isolated structural lockfile comparison — PASS (98 expected hostname changes; all remaining fields identical; 717 npmjs and 0 npmmirror URLs).
- Isolated cold-cache `npm ci` with empty npm config files and explicit npmjs registry — PASS (590 packages installed; SHA-512 integrity accepted; lockfile unchanged).
- Isolated `npm run check` — PASS at 2026-08-02T01:25+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- Repository `npm run check` — PASS at 2026-08-02T01:26+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- `npm run test:e2e` — PASS at 2026-08-02T01:27+08:00 (13 Chromium tests).
- `npm run test:e2e:webkit` — PASS at 2026-08-02T01:28+08:00 (7 selected WebKit tests).
- Changed-file Prettier, JSON parse, `git diff --check`, structural/provenance assertion, and sensitive/private-path scans — PASS.
- GitHub Actions `Quality` run `30710451561` — PASS at 2026-08-02T01:30+08:00 (`completed/success`, exact `cb19453` head; install and all quality steps successful).

Known failures: Repository-wide `npm run format:check` has 10 pre-existing differences in untouched files. Read-only npm audit triage reports 15 affected package entries (13 high, 2 low, 0 critical), including three production-path entries: direct `next@16.2.6` plus transitive `postcss@8.4.31` and optional `sharp@0.34.5`; remediation is queued separately as PKG-007. The first isolated install invocation reused `/dev/null` for both npm config layers and npm rejected that test harness before dependency resolution; distinct empty files fixed the harness and the clean install passed.

Risk: Low. All local, isolated, and exact-SHA CI gates pass; committed dependency bytes and integrity values are unchanged.

Next command: `git status --short --branch && git diff --check`

Resume instructions: Read `.codex/RESUME.md`, verify the PKG-006 product commit and run `30710451561`, then finish the recovery-documentation commit/push/CI verification if it is not already synchronized. Do not regenerate the lockfile or add user/global npm configuration.
