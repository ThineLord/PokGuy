# v0.3.0 acceptance record

Date: 2026-11-09. Codex implemented the changes; independent subagents reviewed and merged feature PRs. No bots or external agent bridges were used.

## Scope and regression evidence

| Audit item           | Implemented result                                                       | Regression                                                                        |
| -------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| P1 dependencies      | Bounded patches and explicit residual reachability                       | Official-registry audit; clean Node 22 install; full build and Worker suite       |
| P1 complete recovery | Versioned full backup, preview/confirm, strict validation, legacy import | Fresh-browser roundtrip, cancel, malformed/future/ambiguous files, migration      |
| P1 failed saves      | Warning, retry, rescue export and transactional restore rollback         | Quota injection; partial rollback; persisted reload                               |
| P1 statistics        | Independent cash/scenario totals and preserved legacy data               | Forced all-in, donk, legal three-bet/reopening, legacy migration and scoped UI    |
| P2 feedback          | Explicit unassessed state, consistent sizing, pre-action context         | River shove, equivalent bet, all-in call, missing equity and indexed review       |
| P2 Worker images     | Actual local transformation using emitted bindings                       | WebP MIME/bytes/decoded width; rejected SVG/remote/invalid/missing requests       |
| P2 reliability       | Fault-path coverage, owned test servers, bounded concurrency             | Same test timeouts; full Node and browser gates                                   |
| P3 mobile            | Readable seats and accessible public details                             | 320/393px, touch target, no overflow, keyboard close/focus, hidden-card exclusion |

## Acceptance boundary

Final release validation is tied to the merged source and GitHub workflow run. The release description records final test counts and links. Chromium and desktop WebKit cover browser behavior; physical iOS hardware and production deployment were not tested or changed. Local storage remains single-active-tab oriented. The npm audit retains two moderate advisory chains; see [the security assessment](SECURITY_0.3.0.md).
