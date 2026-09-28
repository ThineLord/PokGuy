# RiverLab interactive playtest — 2026-09-28

## Session

- Started: 03:39 HKT, 2026-09-28.
- Ended: 04:59 HKT, 2026-09-28 (about 80 minutes total; interactive browser work finished around 04:05 HKT).
- Pre-playtest release baseline: `bc2acf4ee2c179a661bb5f3833cb3df3f53dbde6`. The post-playtest candidate adds the P2 fix, regression, and closure documentation.
- Main browser: Codex in-app Chromium browser. Secondary browser: isolated Playwright WebKit context.
- Main-browser viewports: 1440×900, 1920×900, 1194×834, 834×1194, and 393×852. WebKit: 1194×834, 834×1194, and 393×852.
- Baseline: 76 hands in Stats and 39 prior recent-hand records; the first new completed hand made the list 40/100. The rolling history reached its intended 100-record cap as play continued. Aggregate statistics retained the older hands.
- Main-browser completed play: 108 distinct cash hands and 21 scenarios. WebKit completed play: 6 cash hands and 1 scenario. Main-browser Stats finished at 205 hands, equal to 76 baseline + 108 cash + 21 scenarios. Two duplicate _observations_ from the play driver were excluded from this count.
- Navigation: repeated table/Settings/History/Stats/Scenario transitions; at least four explicit reloads in Chromium and one in WebKit. One Chromium tab stayed open throughout the main play pass.

## Chronological observations

1. Launched `npm run dev` at `http://localhost:3000/`; actionable 6-max table rendered. Started 6-max hand on BTN with Q♥ 3♣. CO called, Hero called, blinds checked. On Q♠ 6♥ 2♠ 7♠ Q♣, Hero checked flop/turn, bet 2 BB into 4 BB on river, Kai and Nora called. Hero's trip queens won 10 BB across a 4 BB main pot and 6 BB side pot; net +7 BB. The side pot was expected because a folded small blind had contributed preflop. History stored +7 BB and showdown categories matched the table; Stats increased from 76 to 77 hands.
2. Switched language during the live hand, visited Settings during the turn, changed AI delay from 420 to 50 ms and animation speed to Fast, then returned. The hand was still at the same street and stack state.
3. Played 6-, 5-, 4-, 3-, and 2-seat cash sessions, with 20, 50, 100, and 200 BB configured buy-ins. A requested 5 BB cash buy-in normalized back to the UI's 20 BB minimum; scenarios accepted 5 BB. Play included limps, folds, preflop opens and reraises, repeated calls/checks, full all-ins, rebuys, river showdowns, uncontested wins, and multiple main/side-pot ledgers. AI speed was changed during play; animations were later turned off for faster continuous hands. No AI stall was observed.
4. At 83 total Stats hands, seven new cash results in History summed to the Stats profit change exactly: +5, −95.5, +0.25, −1, −1, and −6.1 BB after the first +7 BB hand. The seven hands raised Stats from 76 to 83. Later, History reached 100/100 with newest hands first while Stats continued past 100. A note on the latest hand survived reload and was then cleared; the To review filter worked.
5. Reloading a completed or live cash hand reinitialized a fresh cash table from configured stacks and button 0, while completed history, Stats, settings, and language persisted. Reproduced twice at completion and once at a live human turn; live hole cards changed. Source confirmed the current storage model saves settings/history/stats but always calls `startCashHand` on mount. This is a session-continuity limitation of the current design, not a malformed-state recovery failure. No live-session persistence was added in this release-scoped fix.
6. Responsive resizing during a live three-seat hand kept the same pot, cards, and legal actions. At 393×852, the action panel was below the first screen but reachable by normal scroll. The phone header was tightly packed; its controls remained actionable. Tablet portrait/landscape and wide desktop views had reachable controls.
7. Rapid repeated `K` during a human turn produced one check; the second press during the transition did not cause a second action. A double-click on Call added one call contribution. Rapid repeated Next Hand produced one deal. Navigating to History during an AI turn and returning did not produce a duplicate AI action.
8. Twenty controlled scenario hands covered a six-player royal-flush board, board-playing tie, wheel straight, straight/flush/full-house/quads/trips/two-pair/pair kickers, five-card flush board, preflop all-ins, five-opponent turn runout, and 5 BB starting stacks. The six-player royal board ended in a four-way tie: 6 BB main pot split 1.5 each, 16 BB side pot split 4 each; Hero's net was +0.5 BB after committing 5. Rank labels and displayed ledgers checked in sampled showdowns agreed with the visible cards. A later completed scenario was used to reproduce the cash-state issue; a subsequent edit-and-restart probe abandoned its first scenario without creating a completed record.
9. **Reproduced P2:** A completed heads-up cash hand ended with Hero 99 BB and Lin 101 BB. Starting a scenario and selecting Return to cash game replaced that table with a new preflop buy-in, losing the prior stacks and button progression. The same happened for a live cash hand. The cause was scenario start overwriting the only `game` state and Return calling `startCashHand(data)`. The new regression test failed on the original code at the missing Next Hand button. A narrow cash snapshot/restore fix passed the test and a manual live-hand check: Hero/Lin stacks, Q♣ 6♦, the 1.5 BB pot, and preflop street were identical before and after a scenario detour.
10. After the fix, continued cash play past 100 new hands. One heads-up all-in left the AI at 0 and correctly ended the table session. In a separate three-seat all-in, Lin busted; on the next deal Lin remained marked Busted with no cards, Kai (previous BB) was button/SB, and Hero was BB. No eliminated seat acted.
11. WebKit ran six real UI cash hands (including double-click Fold, call/check, raise, and all-in), one royal-board scenario, phone and tablet resizing, a settings reload, and a Stats check. Stats showed seven completed hands, table size 2 persisted, and no page errors were captured. The phone Next Hand control had a layout box and was reachable.

## Issue triage and repair

- **P2 fixed:** Starting a scenario erased the prior cash table; Return to cash game silently restarted at a fresh buy-in. `PokerTrainer.tsx` now snapshots cash game, AI tags, wager input, and feedback before the first scenario and restores them on Return. Repeated scenarios leave the cash snapshot intact. `core-flow.spec.ts` adds a Chromium/WebKit regression covering a completed cash table. The test failed before and passed after the fix.
- **P3 observation:** A browser reload starts a new cash session; live game state and the post-hand Next Hand screen are not saved. The persistence contract currently covers settings, history, notes, and statistics. The UI gives no explicit warning that the current session will restart on refresh.
- **False alarms:** A 4 BB main pot plus 6 BB side pot in the first hand was valid because a folded blind had contributed. A 5 BB cash setting reverted to the documented 20 BB normalization minimum. Two identical completed-screen reads were play-driver counting errors; History/Stats recorded the underlying hands once. The initial in-app pointer click appeared ineffective, but keyboard activation and later mouse clicks worked; this was not reproduced as an app defect.
- **No confirmed P0/P1 issue.** No cosmetic or dependency changes were made. No commit or push occurred during the interactive pass.

## Remaining uncertainty

- UI play did not force a contrived odd-chip split across multiple tied side pots with four unequal funded stacks. Opponent hole cards cannot be selected in the normal scenario builder.
- WebKit was exercised in an isolated local browser; physical touch devices and hosted production were outside this playtest.
- A malformed LocalStorage recovery probe was not performed against the populated real profile, to avoid risking that profile during the interactive pass.

## Validation

- Focused Chromium regression: failed before the fix, passed after.
- Chromium E2E: 15/15 passed. WebKit E2E: 9/9 passed, including the new regression. The separate manual WebKit pass had 6 cash hands, 1 scenario, and no page errors.
- Production build completed. Production HTTP smoke returned 200 and the RiverLab title; a separate production-browser Fold reached a completed hand.
- `npm audit --omit=dev --registry=https://registry.npmjs.org/`: zero findings. `git diff --check`: passed. Prettier checks passed, including this log.
- During the original interactive pass, `npm run check` was inconclusive in the cloud-backed checkout under local Node 26 and bundled Node 24: ESLint and typecheck stalled in dependency reads, and Vitest hit worker-start timeouts. This was an environment issue; the clean Node 22 closure validation below supersedes that incomplete result. The pre-edit exact-SHA CI result did not validate the new diff.
- An incomplete local validation copy was created at `/private/tmp/riverlab-playtest-validation`. Automatic command safety review rejected recursive deletion, so it remains outside the repository. The four pre-existing untracked historical files in the repository were left untouched. No commit or push was made during the original interactive pass.

## Release closure validation — 2026-09-28

- Reviewed the exact source diff: the cash snapshot is taken only when starting a scenario from a cash hand, remains unchanged through scenario edits/restarts, and is cleared on Return. Restoring a completed cash hand also restores its saved-hand marker, preventing a duplicate history entry. The regression failed on the original code and passed with the fix, asserting that a completed cash table and its asymmetric stacks survive a scenario detour.
- A managed worktree attempt hit a Git `mmap` timeout in the cloud-backed checkout. A fresh remote clone at the pre-playtest SHA received the exact local source/test patch and playtest log. Official Node `22.23.3` archive checksum matched the published SHA-256; npm was `10.9.9`. Lockfile `npm ci` installed 599 packages successfully.
- In that clean checkout, `npm run check` passed with explicit successful verdicts for Prettier, ESLint, strict TypeScript, 15 Vitest files / 154 tests, and production build. Chromium E2E passed 15/15 and WebKit E2E passed 9/9. Production HTTP smoke returned 200 with the RiverLab title. `git diff --check` passed.
- Official-registry production audit found 0 vulnerabilities. Complete audit still reported 7 high package findings, 0 critical: `@cloudflare/vite-plugin`, Miniflare, Wrangler, Sharp, Undici, vinext, and image-size. The dependency graph was unchanged.
- Remaining release limitations: refresh starts a new cash session and does not persist a live hand; physical iPhone/iPad and hosted deployment were not revalidated; multi-tab LocalStorage is last-writer-wins; storage write failures have no UI; historical statistics are not retroactively repaired; the unequal-stack, multiple tied-side-pot odd-chip case was not forced interactively; the seven complete-audit findings remain open.
