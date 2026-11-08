# Changelog

Application releases use `vMAJOR.MINOR.PATCH`. Browser storage schemas are versioned separately.

## Unreleased

No changes recorded yet.

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

The [historical changelog](docs/archive/changelog-before-0.2.0.md) retains the original 0.1.0 entry and dated unversioned changes. These dates are not retroactively assigned Git tags or GitHub Releases.

[0.2.0]: https://github.com/ThineLord/PokGuy/releases/tag/v0.2.0
