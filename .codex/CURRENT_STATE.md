# Current State

Current branch: `main`

Current HEAD: validated product commit `4aec6ee0e5ce89ea25a409402676556ff41412df` plus the recovery-state checkpoint containing this file; resolve the checkpoint SHA with `git rev-parse HEAD`.

Last stable commit: `4aec6ee0e5ce89ea25a409402676556ff41412df` (`origin/main`, fast-forward push verified)

Current objective: Preserve the verified PKG-002 recovery checkpoint and prepare the next bounded WebKit automation task.

Active task: PKG-002 is complete. PKG-003 is queued but has not started because it adds a browser runtime and changes Playwright configuration.

Modified files: None expected after the recovery-state checkpoint; always confirm with `git status --short`.

Completed steps:

- Preserved and completed the pre-existing Phase 8 Review Lab checkpoint (`256d789` + `59bae14`).
- Reproduced invalid persisted blinds, malformed profile pools, and incomplete AI habit records.
- Added field-level recovery while preserving valid v1/v2 settings, customized profiles, and custom-only opponent pools.
- Prevented empty or incompatible numeric settings from being persisted and added startup/import recovery notices.
- Added migration, component, import, and Chromium input/reload regressions.
- Passed changed-file formatting, whitespace, sensitive-pattern, and machine-path checks.
- Passed final core, build, browser, and visible recovery-UI validation.
- Created and pushed product commit `4aec6ee`; local HEAD and `origin/main` matched after the push.

Remaining steps:

- Commit and push the recovery-state checkpoint containing this file.
- Before PKG-003, explain the WebKit browser installation and Playwright configuration impact under the repository safety protocol.
- Do not begin the v3 review-snapshot migration without a separate design decision.

Current tests:

- Targeted Vitest — PASS at 2026-08-02T00:11+08:00 (2 files / 17 storage and application-shell tests).
- `npm run check` — PASS at 2026-08-02T00:14+08:00 (lint, typecheck, 13 Vitest files / 112 tests, production build).
- `npm run test:e2e` — PASS at 2026-08-02T00:15+08:00 (13 Chromium tests).
- Playwright CLI recovery smoke — PASS; notice and usable table were visible, with 0 browser console errors and 0 warnings.
- Toolchain warnings only: Node `module.register()` deprecation, jsdom LocalStorage experimental warning, proxy detection, and Playwright color-variable warning.

Known failures: The repository-wide `npm run format:check` reports 10 pre-existing formatting differences in untouched files. WebKit automation is not yet installed or configured. A post-push GitHub API SHA probe hit a TLS handshake timeout; the actual fast-forward push and matching `origin/main` SHA succeeded.

Risk: Low for completed PKG-002. PKG-003 is medium risk because browser runtime availability and WebKit timing/layout behavior can differ.

Next command: `git status --short --branch && git log --oneline --decorate -5`

Resume instructions: Read `.codex/RESUME.md`, rerun the startup Git checks, verify the checkpoint is on `origin/main`, and select PKG-003 only after applying the configuration/dependency safety gate.
