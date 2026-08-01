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

PKG-006 is in progress on top of stable commit `6377692`. The candidate mechanically changes 98 lockfile `resolved` origins from npmmirror to npmjs after metadata parity, structural equality, cold-cache integrity installation, isolated and repository checks, 13 Chromium tests, 7 WebKit tests, and final diff/security review passed. Commit, push, and exact-SHA CI verification remain.

## Exact resume sequence

1. Read `.codex/TASK_QUEUE.md` and verify Git status/history against this file.
2. Confirm local `HEAD` is still `6377692`, `origin/main` and GitHub still match it, and only the PKG-006 files recorded in `CURRENT_STATE.md` are modified.
3. Re-run the structural comparison against `git show HEAD:package-lock.json`; it must report exactly 98 hostname changes, 717 npmjs URLs, no npmmirror URL, and no other field change.
4. Stage exactly the seven files recorded in `CURRENT_STATE.md`; inspect the staged paths and diff before committing.
5. Commit and push `main`, then wait for completed GitHub Actions success for the exact pushed SHA. Never commit user registry/proxy configuration.

## Recovery boundary

- Last remote-verified stable CI commit: `6377692002052361d428af7561959c5b2acfe4f1`.
- GitHub Actions evidence: run `30709981525`, `completed/success`, exact head SHA `6377692002052361d428af7561959c5b2acfe4f1`.
- No stash or interrupted Git operation existed at startup.
- The poker engine, LocalStorage key/schema, package manifest, dependency versions, hosting configuration, and deployment state remain unchanged by PKG-006; only lockfile registry hostnames and recovery records are in scope.
- The workflow token has only `contents: read`; browser E2E remains a separate local gate, and branch protection is not enabled.
- The normalized candidate has 717 npmjs and zero npmmirror resolved URLs; all locked integrity hashes and tarball paths are unchanged.
- If any final gate fails, record the exact command and failure in `CURRENT_STATE.md` and `LAST_VALIDATION.json`; do not mark the task done or push an unverified checkpoint.
