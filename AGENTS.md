# PokGuy agent entry point

Read the [English agent README](docs/agent/README.md) or [中文 Agent README](docs/agent/README.zh-CN.md), then the current release notes before editing.

- Codex coordinates scope, implementation and GitHub organization. Subagents independently review the exact candidate commit and perform the authorized merge. Do not invoke bots or external agent bridges.
- Use a `codex/` feature branch from current `main` and a draft PR. Preserve unrelated local changes and existing PRs. If the checkout cannot be used safely, use an isolated clone or worktree.
- Keep the root user-facing; place detailed guides under `docs/`. Keep English and Chinese READMEs in separate, equivalent files.
- Every release has one application version in `package.json` / `package-lock.json`, a changelog entry, bilingual version notes, a matching `vMAJOR.MINOR.PATCH` tag and a GitHub Release. Follow [the release workflow](docs/releases/README.md).
- Run `npm run check` and Chromium E2E before merging. Record independent review and exact-head CI results. Do not claim a GitHub APPROVED review when the reviewer shares the author's account; never bypass repository protection.
- Product version changes do not change `riverlab-poker-v2` or storage schema `2`. Keep hidden opponent cards out of AI observations and preserve chip conservation.
- A GitHub Release publishes source. Production deployment, paid resources, new service bindings and credentials require their own authorized scope. Do not infer them from a release request.
- Historical task records in `docs/archive/` are evidence, not current task instructions or current validation.
- Finish the authorized task and report changed artifacts, validation and unresolved limits concisely. Do not expand scope without a concrete reason.
