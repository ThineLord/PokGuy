# Current State

Current branch: `main`

Current HEAD: `1c4834453a54c117025df9795229f4fce89d476d` (`origin/main` at PKG-004 startup)

Last stable commit: `1c4834453a54c117025df9795229f4fce89d476d` (`origin/main`, remote verified)

Current objective: Add the first minimal, read-only GitHub Actions quality gate without expanding into browser CI or deployment.

Active task: PKG-004 — add a SHA-pinned Node 22 workflow for `npm ci` and `npm run check`, then wait for a completed GitHub Actions conclusion.

Modified files: `.github/workflows/ci.yml`, contributor/testing documentation, changelog, and `.codex/` recovery state; use `git status --short` for the exact list.

Completed steps:

- Confirmed local `main`, `origin/main`, and GitHub at `1c48344` with a clean tree, no stash, and no interrupted Git operation.
- Confirmed GitHub Actions is enabled, no workflow or run exists yet, and the repository token defaults to read-only.
- Confirmed the supported runtime begins at Node.js 22.13.0 and the lockfile is committed at version 3.
- Verified current official action releases and immutable SHAs for `actions/checkout` v7.0.1 and `actions/setup-node` v7.0.0.
- Passed the unmodified `npm run check` baseline with 112 Vitest tests and a production build.
- Added `.github/workflows/ci.yml` with read-only contents permission, immutable action SHAs, non-persistent checkout credentials, Node `22.x`, npm caching, and a 15-minute timeout.
- Kept browser downloads, E2E, secrets, write permissions, deployment, dependency changes, and lockfile changes out of the first CI gate.
- Updated contributor testing guidance and corrected the stale README statement that still listed WebKit automation as future work.
- Passed changed-file YAML/Markdown formatting and all local project/browser gates after the workflow change.

Remaining steps:

- Audit the complete diff, staged paths, whitespace, credentials, private paths, workflow permissions, and lockfile status; then commit the bounded checkpoint.
- Push `main`, locate the run for the exact commit SHA, and wait for `completed/success` before recording PKG-004 as done.
- Do not begin the v3 review-snapshot migration without a separate design decision.

Current tests:

- PKG-004 baseline `npm run check` — PASS at 2026-08-02T00:59+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- Final local `npm run check` — PASS at 2026-08-02T01:03+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- `npm run test:e2e` — PASS at 2026-08-02T01:03+08:00 (13 Chromium tests).
- `npm run test:e2e:webkit` — PASS at 2026-08-02T01:04+08:00 (7 WebKit tests).
- Changed-file Prettier/YAML parse check — PASS; `actionlint` is not installed, so GitHub's first run remains the authoritative workflow validation.
- Toolchain warnings only: Node `module.register()` deprecation, jsdom LocalStorage experimental warning, proxy detection, and Playwright color-variable warning.

Known failures: The repository-wide `npm run format:check` reports 10 pre-existing formatting differences in untouched files. No GitHub Actions result exists until the first workflow commit is pushed.

Risk: Low to medium until GitHub accepts the workflow and its clean install/build completes. The workflow has read-only contents permission and no secrets or deployment step.

Next command: `git diff --check && git status --short --branch`

Resume instructions: Read `.codex/RESUME.md`, rerun the startup Git checks, inspect the exact diff, and continue PKG-004 without adding secrets, write permissions, browser downloads, dependency changes, or deployment steps.
