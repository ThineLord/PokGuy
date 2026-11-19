# Changelog

Application releases use `vMAJOR.MINOR.PATCH`. Browser storage schemas are versioned separately.

## Unreleased

- Optional action hints recommend only a legal action. When an opponent is already all-in and a further raise is forbidden, a strong hand suggests a call; a strong hand that can still raise or bet still suggests that action. Reference sizing is omitted when a bet or raise is not legal.
- Table amounts labeled in big blinds stay in big blinds when the big blind is not one chip. Pot, bets, calls, showdown awards, and the sizing control use the same unit as the seat stacks. The sizing control still submits the chip amount to the engine. Illegal-amount messages use that same unit, and the field keeps a one-chip step when the blind does not divide evenly.
- Folded players' different contribution levels no longer create extra pots with the same eligible set. Tied live players split the one contestable pot, so odd chips are awarded once. Hands already settled under the previous layer split keep their original payouts in schema 2 history and backups.
- Saved hands and backups stay valid when JSON object keys are reordered, including nested pot objects. Changing pot amounts, eligibility, shares, or payouts is still rejected.
- Patch React, React DOM, and `react-server-dom-webpack` from 19.2.8 to 19.2.9 for GHSA-xqc2-xf4c-x3h3. Application version, `riverlab-poker-v2`, and storage schema 2 are unchanged.
- [Bug scan record](docs/development/BUGSCAN-1119.md).

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
