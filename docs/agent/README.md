# PokGuy agent README

[English](README.md) · [简体中文](README.zh-CN.md) · [Agent instructions](../../AGENTS.md)

## Ownership and workflow

Codex owns task organization, implementation and repository housekeeping. Independent subagents own review and the authorized merge. Do not call bots, Cursor bridges or external agent services. Use ordinary CI for validation.

1. Read current user instructions, `AGENTS.md`, `package.json`, the [current release notes](../releases/0.2.0.md) and `git status`. Inspect remote `main` and existing PRs. Preserve unrelated work.
2. Create a `codex/` branch from current `main`; use an isolated worktree or clone when needed. Open a draft PR with concrete scope and validation.
3. Implement the smallest complete change. Keep corresponding English/Chinese READMEs aligned. Put design, user, release and historical material in their documented directories.
4. Run the [development gates](../development/README.md). Send the exact candidate SHA and diff to an independent review subagent. Fix material findings and obtain review of the resulting SHA.
5. A separate merge subagent verifies the reviewed SHA, base branch, required CI, unresolved findings and merge authorization. Mark the PR ready and merge without bypassing protection. A same-account technical review is not a GitHub APPROVED review.
6. For a requested release, follow the [release workflow](../releases/README.md), verify the merged commit, tag and published release, and report the results.

The current user request authorizes the repository reorganization, its reviewed merge and GitHub source release. Future tasks use their own scope; a release policy does not grant blanket deployment permission.

## File ownership

| Location                 | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| Root READMEs             | Brief user introduction and entry points           |
| `docs/user/`             | English/Chinese user READMEs                       |
| `docs/agent/`            | English/Chinese agent READMEs                      |
| `docs/architecture/`     | Engine, AI and rule contracts                      |
| `docs/development/`      | Setup and validation commands                      |
| `docs/releases/`         | Release process and notes by version               |
| `docs/archive/`          | Dated historical evidence; not active instructions |
| `app/`, `src/`, `tests/` | Runtime code and regression coverage               |
| `scripts/`               | Repository validation tools                        |

Keep framework configuration at the root where tooling expects it. Keep generated builds, test artifacts, local exports and scratch files ignored. Do not delete user files just to make the checkout appear clean.

## Contracts and release scope

Application version and persistence schema are independent: preserve `riverlab-poker-v2`, schema `2`, and existing preference keys unless a separately designed migration is in scope. AI observations must not reveal hidden opponent cards. Betting, settlement and side pots must conserve chips.

Run `npm run release:check` after documentation or version changes. It checks version consistency, required release documents and local Markdown file links. `npm run check` includes it and remains the canonical core gate. Full Chromium CI must also pass for the exact candidate.

GitHub Releases publish source, not proof of production deployment. Do not change hosting, credentials, bindings or paid services without task authorization. PR [#2](https://github.com/ThineLord/PokGuy/pull/2) is an independent dependency/Worker-image candidate excluded from 0.2.0; its historical validation is not this release's evidence.
