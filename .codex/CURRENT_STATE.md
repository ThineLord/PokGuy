# Current State

Current branch: `main`

Current HEAD: recovery-documentation checkpoint on top of validated product commit `9542fa9b350a023936c497dd88dcaaee09b74362`; run `git rev-parse HEAD` for the exact state-only commit.

Last stable commit: `9542fa9b350a023936c497dd88dcaaee09b74362` (`origin/main`, remote verified before this state-only checkpoint)

Current objective: Preserve the completed PKG-003 WebKit checkpoint and prepare the next bounded maintenance cycle.

Active task: None. PKG-003 is complete; PKG-004 is queued but has not started because it changes CI configuration and requires a new safety checkpoint.

Modified files: None expected after the recovery-documentation commit; verify with `git status --short`.

Completed steps:

- Installed Playwright WebKit 26.5 revision 2311 in the user browser cache without changing npm dependencies or `package-lock.json`.
- Added a `webkit` Playwright project that selects seven existing high-value tests by `@webkit` title tag.
- Kept `npm run test:e2e` explicitly scoped to the complete 13-test Chromium project and added `npm run test:e2e:webkit` for the selected matrix.
- Covered Review Lab refresh, settings persistence/export, invalid blinds recovery, iPhone/iPad viewports, showdown layout, and keyboard/input isolation.
- Reduced the test diff to title-only tags instead of accepting unrelated block reformatting.
- Passed WebKit launch, list, E2E, Chromium regression, full project, formatting, whitespace, sensitive-pattern, and machine-path checks.
- Created and pushed product commit `9542fa9`; local `HEAD`, `origin/main`, and remote `main` matched before the state-only documentation checkpoint.

Remaining steps:

- None for PKG-003 after this documentation-only recovery checkpoint is committed and synchronized.
- For the next cycle, reassess Git/GitHub state and obtain the required safety checkpoint before adding `.github/workflows/`.
- Do not begin the v3 review-snapshot migration without a separate design decision.

Current tests:

- `npm run check` — PASS at 2026-08-02T00:41+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- `npm run test:e2e -- --list` — PASS (13 Chromium tests selected).
- `npm run test:e2e:webkit -- --list` — PASS (7 WebKit tests selected).
- `npm run test:e2e:webkit` — PASS at 2026-08-02T00:43+08:00 (7 WebKit tests).
- `npm run test:e2e` — PASS at 2026-08-02T00:43+08:00 (13 Chromium tests).
- Playwright WebKit executable/launch smoke — PASS (`WebKit 26.5`).
- Toolchain warnings only: Node `module.register()` deprecation, jsdom LocalStorage experimental warning, proxy detection, and Playwright color-variable warning.

Known failures: The repository-wide `npm run format:check` reports 10 pre-existing formatting differences in untouched files. Playwright WebKit viewport tests do not replace physical iPhone/iPad Safari checks. Git HTTPS uses the existing explicit proxy in this environment.

Risk: Low for PKG-003. No application, persistence, dependency, lockfile, hosting, or deployment behavior changed.

Next command: `git status --short --branch && git log --oneline --decorate -5`

Resume instructions: Read `.codex/RESUME.md`, rerun all startup Git checks, confirm the PKG-003 state checkpoint is clean and remote-synchronized, then assess PKG-004 without editing CI configuration until its required safety checkpoint is satisfied.
