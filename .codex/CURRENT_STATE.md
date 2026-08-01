# Current State

Current branch: `main`

Current HEAD: `6377692002052361d428af7561959c5b2acfe4f1` (pre-PKG-006 stable checkpoint)

Last stable commit: `6377692002052361d428af7561959c5b2acfe4f1` (`origin/main`; GitHub Actions run `30709981525` completed successfully for this exact SHA)

Current objective: Complete PKG-006 by normalizing mixed lockfile registry provenance without changing dependency contents or project npm configuration.

Active task: PKG-006 is IN_PROGRESS. The repository candidate contains only 98 exact `resolved` hostname substitutions from `registry.npmmirror.com` to `registry.npmjs.org`.

Modified files: `package-lock.json` and `.codex/` recovery records. No package manifest, dependency version, integrity hash, dependency graph, user configuration, or product file is intended to change.

Completed steps:

- Confirmed a clean `main` startup state with local, tracking, and GitHub SHA at `6377692`; no stash or interrupted Git operation exists.
- Passed the unmodified baseline `npm run check` with lint, typecheck, 13 Vitest files / 112 tests, and production build.
- Audited lockfile v3: 724 package entries and 717 HTTPS/SHA-512 downloads, initially split between 619 npmjs and 98 npmmirror URLs.
- Confirmed all 98 mirror `name@version` records match npmjs metadata for integrity and tarball pathname; no credentials, query strings, fragments, git/file/link downloads, or non-`resolved` mirror strings exist.
- Verified in an isolated archive that changing only the 98 hostnames leaves every other lockfile field identical.
- Passed an isolated cold-cache `npm ci` against npmjs; npm did not rewrite the candidate lockfile, and isolated `npm run check` passed.
- Applied the same exact 98-line hostname-only transformation to the repository and re-ran the structural comparison successfully.
- Passed changed-file Prettier, JSON parse, whitespace, provenance-count, credential-pattern, and private-path checks; manually reviewed the complete recovery-documentation diff.

Remaining steps:

- Stage the seven scoped PKG-006 files, review the staged diff, commit, and push `main`.
- Wait for completed GitHub Actions success for the exact pushed SHA.
- Record the final commit/run evidence in a separate recovery-state checkpoint if needed.

Current tests:

- Baseline `npm run check` — PASS at 2026-08-02T01:21+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- Isolated structural lockfile comparison — PASS (98 expected hostname changes; all remaining fields identical; 717 npmjs and 0 npmmirror URLs).
- Isolated cold-cache `npm ci` with empty npm config files and explicit npmjs registry — PASS (590 packages installed; SHA-512 integrity accepted; lockfile unchanged).
- Isolated `npm run check` — PASS at 2026-08-02T01:25+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- Repository `npm run check` — PASS at 2026-08-02T01:26+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- `npm run test:e2e` — PASS at 2026-08-02T01:27+08:00 (13 Chromium tests).
- `npm run test:e2e:webkit` — PASS at 2026-08-02T01:28+08:00 (7 selected WebKit tests).
- Changed-file Prettier, JSON parse, `git diff --check`, structural/provenance assertion, and sensitive/private-path scans — PASS.

Known failures: Repository-wide `npm run format:check` has 10 pre-existing differences in untouched files. npm audit reports 15 existing advisory findings during the isolated install; dependency remediation is outside this hostname-only task and must not be conflated with it. The first isolated install invocation reused `/dev/null` for both npm config layers and npm rejected that test harness before dependency resolution; distinct empty files fixed the harness and the clean install passed.

Risk: Low pending remote CI. All local and isolated gates pass; the candidate changes only authenticated tarball origins while preserving the locked bytes through unchanged SHA-512 integrity values.

Next command: `git status --short --branch && git diff --stat && git diff --check`

Resume instructions: Read `.codex/RESUME.md`, verify HEAD is still `6377692` and only the seven PKG-006 files are modified, then stage and review exactly those files. Do not regenerate the lockfile with `npm install` and do not add or modify npm user/global configuration.
