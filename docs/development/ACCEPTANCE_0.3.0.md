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

## Observed validation results

| Check                                                                    | Result                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Clean Node 22 install                                                    | 594 packages installed from the lockfile                                 |
| Unit tests                                                               | 203/203 passed in the clean quality run                                  |
| Release metadata, local links, formatting, lint, types, production build | Passed                                                                   |
| Development Chromium                                                     | 25/25 passed on the final feature tree                                   |
| Desktop WebKit selection                                                 | 17/17 passed after the focus-return fix                                  |
| Built local Worker Chromium                                              | 25/25 passed on the final feature tree                                   |
| UI backup roundtrip                                                      | 2 hands, 1 note, 2 reviews retained; cash/scenario counts each 1         |
| Save fault recovery                                                      | Warning and rescue export verified; retry persisted the changed name     |
| Dependency audit                                                         | 0 critical, 0 high, 11 moderate package records across 2 advisory chains |

The browser runs above had no failed or retried tests. The final feature tree includes PR #10's deterministic call/raise fixture. Release-only changes are documentation, screenshots and package version metadata; their exact-head and merged-main CI links are recorded in the GitHub release. Earlier failed or interrupted local attempts remain separate evidence, as described below.

## Acceptance boundary

Final release validation is tied to the merged source and GitHub workflow run. The release description records final test counts and links. Chromium and desktop WebKit cover browser behavior; physical iOS hardware was not tested. No production deployment was performed; hosted behavior remains unverified. Local storage remains single-active-tab oriented. The npm audit retains two moderate advisory chains; see [the security assessment](SECURITY_0.3.0.md).

## Issues caught during acceptance

The first complete WebKit run passed 16 tests and failed the seat-dialog focus-return assertion. A separate reviewed follow-up captures the trigger and restores focus explicitly; both Escape and the close button are covered, and WebKit is now a CI gate. The corrected full WebKit run passed 17/17.

Earlier local runs under concurrent machine load hit existing 5-second test limits. We did not increase timeouts or reduce sample counts. A clean independent Node 22 install passed all 203 tests and the complete quality/build gate. Test artifacts retain the earlier failure separately from the final successful run.

The Worker run also exposed a race in the call/raise visual test: an AI response could replace the last-action marker before its assertion. The reviewed fix uses a deterministic heads-up table with AI paused, preserves the call assertions, and makes the previously conditional raise step mandatory. Product behavior and test timeouts are unchanged.
