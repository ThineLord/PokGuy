# Changelog

Application releases use `vMAJOR.MINOR.PATCH`. Browser storage schemas are versioned separately.

## Unreleased

- Starting stacks, blinds, and the AI delay in Settings keep unfinished text while they are typed. Leaving the field or pressing Enter saves a valid amount, and that amount remains after reload. An empty field, a value outside the allowed range, a blind that is not a 0.01 chip increment, or a small blind that is not below the big blind keeps the previous amounts and shows those amounts.
- Call controls, table call labels, and newly recorded review context show the payable call, capped by the player's stack. Immediate pot odds divide the part of that call an opposing contribution already covers by the pots the player can win. The caller's own still-unmatched chips are subtracted from the risk, and the ratio is not clamped. Folded chips in those pots count. Unreachable side pots do not. Hints, call grading, and the AI pot-odds decision use that price. Total-pot display, betting, and settlement are unchanged.
- Only the latest backup-file selection controls the restore preview, its status, and the payload offered for confirmation. A slower earlier read cannot replace that preview, reopen it after cancel or a completed restore, or change saved data before confirmation.
- Saved-hand replay opens on the starting position, shows each recorded action once, and can reach the public runout board, including a forced runout with no actions. Earlier frames keep later board cards hidden, and a postflop hand keeps its starting board. Choosing another hand, including with the review filter, stops autoplay and restarts that hand at its first step.

## [0.3.2] — 2026-11-19

- Optional action hints recommend only a legal action. When an opponent is already all-in and a further raise is forbidden, a strong hand suggests a call; a strong hand that can still raise or bet still suggests that action. Reference sizing is omitted when a bet or raise is not legal.
- Table amounts labeled in big blinds stay in big blinds when the big blind is not one chip. Pot, bets, calls, showdown awards, and the sizing control use the same unit as the seat stacks. The sizing control still submits the chip amount to the engine. Illegal-amount messages use that same unit, and the field keeps a 0.01 chip step when the blind does not divide evenly.
- Seat stacks, review context, and single-hand profit keep a 0.01 chip remainder visible when the big blind is 3. Those labels use that hand's chips and its own big blind. Saved profit summaries stay in storage.
- Folded players' different contribution levels no longer create extra pots with the same eligible set. Tied live players split the one contestable pot, so odd chips are awarded once. Hands already settled under the previous layer split keep their original payouts in schema 2 history and backups.
- Saved hands and backups stay valid when JSON object keys are reordered, including nested pot objects. Changing pot amounts, eligibility, shares, or payouts is still rejected.
- Patch React, React DOM, and `react-server-dom-webpack` from 19.2.8 to 19.2.9 for GHSA-xqc2-xf4c-x3h3.
- The quality job name is `Node 22 quality gate`. Pull request [#17](https://github.com/ThineLord/PokGuy/pull/17) renamed the browser job from `Node 22 Chromium E2E gate` to `Browser E2E gate` (job id `chromium-e2e`). The quality job stays on Node 22. The browser job runs directly on the pinned official Playwright image. `actions/setup-node` 22.x runs in that container, so the suites do not use the image Node 24. Suite commands are direct npm commands with no `| tee`. The container uses `options: --init`. Playwright shuts the development server down with `webServer.gracefulShutdown`. Failure uploads keep the original `test-results/` path, with `if-no-files-found: ignore` and 7-day retention.
- [English release notes](docs/releases/0.3.2.md) · [中文更新说明](docs/releases/0.3.2.zh-CN.md).

## [0.3.1] — 2026-11-09

- Resolve the remaining minimatch/Satori advisory chains and the newly exposed fflate dependency; official-registry audit reports zero vulnerabilities.
- Use the supported Node/Worker OG runtime and add actual rendering, malicious-input and audit CI gates.
- Reduce tracked root entries from 28 to 19, remove unused template files and link obsolete reports to fixed-tag history.
- Show one real overview screenshot in each concise bilingual home README.
- Preserve port 3000, standard npm commands, poker behavior and browser storage schema 2.
- [English release notes](docs/releases/0.3.1.md) · [中文更新说明](docs/releases/0.3.1.zh-CN.md).

## [0.3.0] — 2026-11-09

- Add complete backup preview/restore, rescue exports and visible save failures.
- Separate cash/scenario statistics and preserve legacy mixed totals.
- Replace unsupported positive grades with explicit unassessed feedback and pre-action context.
- Improve mobile seat readability and accessible public details.
- Patch dependencies, validate real Worker image transforms and strengthen fault-path tests.
- [English release notes](docs/releases/0.3.0.md) · [中文更新说明](docs/releases/0.3.0.zh-CN.md).

## [0.2.0] — 2026-11-09

### Added

- Separate English and Chinese project, user and agent READMEs.
- A documentation index, versioned release notes and a repeatable source-release workflow.
- A release consistency and local Markdown link check in the core quality gate.
- A PR template and Node 22 version hint.

### Changed

- Reduced the repository home page to an introduction, quick start and navigation.
- Grouped design documents under `docs/architecture/`; archived dated audits, old changelog entries and former agent state under `docs/archive/`.
- Established 0.2.0 as the versioned baseline for the existing trainer, including 2–9 seat tables and light/dark/system appearance already present on main.

### Scope

No gameplay, dependency, storage-schema or hosting configuration changes. The separate dependency/Worker-image PR #2 is not included. See the [English](docs/releases/0.2.0.md) or [中文](docs/releases/0.2.0.zh-CN.md) release notes for limitations.

## Earlier development

The [historical changelog](https://github.com/ThineLord/PokGuy/blob/v0.3.0/docs/archive/changelog-before-0.2.0.md) retains the original 0.1.0 entry and dated unversioned changes. These dates are not retroactively assigned Git tags or GitHub Releases.

[0.2.0]: https://github.com/ThineLord/PokGuy/releases/tag/v0.2.0
[0.3.0]: https://github.com/ThineLord/PokGuy/releases/tag/v0.3.0
[0.3.1]: https://github.com/ThineLord/PokGuy/releases/tag/v0.3.1
[0.3.2]: https://github.com/ThineLord/PokGuy/releases/tag/v0.3.2
