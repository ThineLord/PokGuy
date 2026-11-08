# Versioning and releases

[Project home](../../README.md) · [Agent README](../agent/README.md) · [Changelog](../../CHANGELOG.md)

## Version contract

Use `MAJOR.MINOR.PATCH` for the application and `vMAJOR.MINOR.PATCH` for Git tags. Increment PATCH for compatible fixes or documentation maintenance, MINOR for compatible features or a substantial organizational baseline, and MAJOR for breaking user or integration contracts. Before 1.0, explicitly document breaking changes in minor releases. This project starts its regular GitHub release history at **0.2.0**; do not invent tags for earlier unversioned snapshots.

`package.json` is the application version source of truth. Keep both root version records in `package-lock.json`, the two root READMEs, the changelog and bilingual release notes aligned. Each version gets `docs/releases/X.Y.Z.md` and `docs/releases/X.Y.Z.zh-CN.md`. Update the documentation index and current-version links in the user/agent READMEs when advancing to a new release.

Storage schema `2`, the `riverlab-poker-v2` key and preference keys are independent contracts. A package version bump is not a data migration.

## Prepare and review

1. Start a `codex/` branch from current `main`. Inspect existing PRs and preserve unrelated work.
2. Choose the version and update package metadata without creating a tag yet, for example `npm version 0.2.1 --no-git-tag-version`. Write release notes in both languages, update current-version links/READMEs, and move completed entries from Unreleased into a dated changelog section.
3. Describe user-visible changes, compatibility, exclusions and known limits. Do not reuse old audit counts as a current security assessment or claim tests that have not run.
4. Run `npm run check` and `npm run test:e2e`. Open a draft PR. Obtain independent subagent review of the exact candidate SHA and successful exact-head Quality + Chromium CI. Re-review fixes.
5. A separate merge subagent checks authorization, review evidence, current head/base and required checks, then marks the PR ready and merges. Do not bypass protections or impersonate another GitHub reviewer.

## Publish the merged source

After merge, verify a clean checkout of the resulting main commit and both main CI jobs. Publish exactly that commit, even if main subsequently advances. The following example is for 0.2.0; use the chosen version and the actual reviewed merge SHA on future releases.

```bash
npm run release:check -- --tag=v0.2.0
git tag -a v0.2.0 <verified-merge-sha> -m "PokGuy 0.2.0"
git push origin refs/tags/v0.2.0
gh release create v0.2.0 --repo ThineLord/PokGuy --verify-tag \
  --title "PokGuy 0.2.0" --notes-file /path/to/reviewed-release-notes.md
```

Prepare the release body from both version-note files. Include the reviewed PR, merge SHA and links to the successful CI evidence. Verify the remote tag resolves to that commit and the release is published (not a draft). GitHub provides source archives automatically; do not attach `node_modules`, private data or generated local logs. This is a source release, not an npm package publication (`private: true` remains set).

Never move or overwrite a published version tag. Correct mistakes with a follow-up release. Revert code through a reviewed PR when needed and publish a new patch version; do not rewrite history. Export browser data before changing application versions, and assess storage compatibility before rolling back code.

## Deployment boundary

A GitHub Release is distinct from deploying a website. The current repository workflow performs validation only. External hosting triggers are not established by that fact. Do not alter production settings, Worker bindings, secrets or paid resources as part of source-release bookkeeping; explicit deployment work needs its own authorized scope and verification.
