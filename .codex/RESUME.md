# Resume

## Startup checks

Run these first and compare the output with `.codex/CURRENT_STATE.md`:

```bash
git status --short --branch
git remote -v
git log --oneline --decorate -15
git stash list
```

Also confirm there is no `MERGE_HEAD`, `REBASE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, or bisect state before editing.

## Current task

PKG-007 is in progress on top of stable commit `eb637a5`. Next and `eslint-config-next` are updated to `16.2.12`; isolated/repository clean install, checks, both browser suites, advisory-level comparison, production smoke, and final diff/security review pass. Commit, push, and exact-SHA CI remain. Three untracked historical conflict copies are preserved outside the staged set.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local HEAD, `origin/main`, and GitHub remain at `eb637a5`; GitHub Actions run `30710600306` must remain `completed/success` for that exact SHA.
3. Confirm the staged set contains only the 11 scoped PKG-007 package/docs/recovery files; structural comparison must show root plus 12 Next-owned lock entries and no added/removed dependency.
4. Preserve `.codex/CURRENT_STATE 2.md`, `.codex/LAST_VALIDATION 2.json`, and `docs/NEXT_STEPS 2.md` as untracked files unless explicit deletion approval is given. Their contents are older maintenance snapshots and must not be committed.
5. Repeat the dependency-boundary and sensitive-data checks against the staged diff, then commit/push and wait for exact-SHA GitHub Actions.
6. Preserve the documented residual PostCSS/Sharp findings. Do not run broad `npm audit fix`; do not fold React, Vite, Cloudflare, or overrides into this checkpoint.

## Recovery boundary

- Last remote-verified stable CI commit: `eb637a5f332ffa1681945d448853e87d52cdba38`.
- GitHub Actions evidence: run `30710600306`, `completed/success`, exact head SHA `eb637a5f332ffa1681945d448853e87d52cdba38`.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key/schema, package manifest, dependency versions, hosting configuration, and deployment state remained unchanged by PKG-006; only lockfile registry hostnames and recovery records changed.
- The workflow token has only `contents: read`; browser E2E remains a separate local gate, and branch protection is not enabled.
- The normalized candidate has 717 npmjs and zero npmmirror resolved URLs; all locked integrity hashes and tarball paths are unchanged.
- The PKG-007 candidate removes all nine Next-specific advisory records. Four PostCSS/Sharp advisory records remain because stable Next has not yet incorporated the compatible upstream updates.
- PKG-008 is queued for the direct React Server Components patch; Vite and Cloudflare/Wrangler remain separate scopes.
- Three untracked conflict-style historical copies appeared during final staging. They were compared read-only, excluded from the commit, and preserved because deletion is not authorized.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
