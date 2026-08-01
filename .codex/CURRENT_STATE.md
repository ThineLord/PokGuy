# Current State

Current branch: `main`

Current HEAD: recovery-documentation checkpoint on top of validated CI commit `527367430d663bdbd89c62f1b10a472281209ec3`; run `git rev-parse HEAD` for the exact state-only commit.

Last stable commit: `527367430d663bdbd89c62f1b10a472281209ec3` (`origin/main`, remote verified with completed GitHub Actions success)

Current objective: Preserve the completed PKG-004 CI checkpoint and prepare a separately approved dependency-provenance audit.

Active task: None. PKG-004 is complete; PKG-006 is queued but has not started because it may rewrite `package-lock.json` and requires a new configuration/dependency safety checkpoint.

Modified files: None expected after the recovery-documentation commit; verify with `git status --short`.

Completed steps:

- Confirmed clean Git/GitHub recovery state and passed the unmodified 112-test/build baseline.
- Added `.github/workflows/ci.yml` for `main` pushes and pull requests using Node `22.x`, `npm ci`, and `npm run check`.
- Pinned `actions/checkout` v7.0.1 and `actions/setup-node` v7.0.0 to immutable full SHAs; restricted token permissions to `contents: read` and disabled credential persistence.
- Kept browsers, secrets, write permissions, deployment, dependencies, and `package-lock.json` outside the workflow change.
- Passed final local lint, typecheck, 112 Vitest tests, production build, 13 Chromium tests, and 7 WebKit tests.
- Passed YAML/Markdown formatting, whitespace, staged-path, workflow-boundary, credential-pattern, and private-path checks.
- Created and pushed commit `5273674` without changing global Git configuration; local `HEAD`, `origin/main`, and GitHub matched after the push.
- Waited for GitHub Actions run `30709790461`; it completed successfully for exact head SHA `527367430d663bdbd89c62f1b10a472281209ec3`, including clean install and quality checks.

Remaining steps:

- None for PKG-004 after this documentation-only recovery checkpoint is committed, pushed, and independently CI-verified.
- Before PKG-006, explain the lockfile/configuration impact and obtain the required safety checkpoint; do not normalize registries inside CI as an implicit workaround.
- Do not begin the v3 review-snapshot migration without a separate design decision.

Current tests:

- PKG-004 baseline `npm run check` — PASS at 2026-08-02T00:59+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- Final local `npm run check` — PASS at 2026-08-02T01:03+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- `npm run test:e2e` — PASS at 2026-08-02T01:03+08:00 (13 Chromium tests).
- `npm run test:e2e:webkit` — PASS at 2026-08-02T01:04+08:00 (7 WebKit tests).
- Changed-file Prettier/YAML parse and staged security/boundary checks — PASS.
- GitHub Actions `Quality` run `30709790461` — PASS at 2026-08-02T01:12+08:00 (`completed/success`, exact `5273674` head, all job steps successful).
- Toolchain warnings only: Node `module.register()` deprecation, jsdom LocalStorage experimental warning, proxy detection, and Playwright color-variable warning.

Known failures: The repository-wide `npm run format:check` reports 10 pre-existing formatting differences in untouched files. `main` has no branch protection, so CI is reported but not required. The lockfile contains 98 npmmirror.com and 619 npmjs.org resolved URLs; the first clean CI install succeeded, but provenance remains mixed.

Risk: Low for PKG-004. The gate is operational and read-only, but enforcing it through branch protection is a separate repository-governance decision.

Next command: `git status --short --branch && git log --oneline --decorate -5`

Resume instructions: Read `.codex/RESUME.md`, rerun all startup Git checks, confirm the PKG-004 state checkpoint and its exact-SHA GitHub run are synchronized, then assess PKG-006 without changing the lockfile or npm configuration until its safety checkpoint is satisfied.
