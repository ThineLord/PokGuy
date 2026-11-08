# v0.3.1 acceptance record

Date: 2026-11-09. Codex implemented the changes; independent native subagents reviewed and merged the feature PRs. No bots or external agent bridges were invoked.

## Acceptance scope

- The official-registry lockfile audit reports zero vulnerabilities, including development dependencies. The result was independently checked during security review.
- Real typescript-eslint project-service matching and adversarial glob preprocessing are exercised in a bounded process.
- The newly exposed fflate dependency is patched; valid ZIP data roundtrips and malformed ZIP64 data is rejected without hanging.
- Separate production Vite builds exercise Node and the application's actual Worker entry/configuration. Both return a PNG decoded into 240×120 pixels and reject unsafe internal SVG styles. Synthetic test routes never enter the application build.
- Repository root entries decrease from 28 to 19. The standalone cleanup reduces tracked files from 137 to 117; new security and release evidence adds necessary files separately. Historical documents remain accessible at fixed v0.3.0 links.
- Both home READMEs use the same original browser capture of the training table, with the full navigation/table/action area visible. Detailed workflow screenshots remain in the user guides.

## Regression record

The final release candidate was installed freshly with Node 22 and tested sequentially:

| Check                                                          | Observed result                                                                 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Official-registry audit                                        | 0 vulnerabilities at every severity                                             |
| Unit suite                                                     | 203/203 passed                                                                  |
| Dependency security/compatibility groups                       | 4/4 passed: parser/glob, ZIP64, Node OG, Worker OG                              |
| Development Chromium                                           | 25/25 passed                                                                    |
| Selected desktop WebKit                                        | 17/17 passed                                                                    |
| Built Worker Chromium                                          | 25/25 passed                                                                    |
| Release consistency, formatting, lint, types, production build | Passed                                                                          |
| Local Markdown file links                                      | 131 links across 29 documents passed; changed quick-start anchors also reviewed |

The release description distinguishes initial failures or retries from the final browser regression results. The release description records the exact reviewed commit, merged-main SHA and successful CI links. No existing test timeout or poker simulation sample count was changed.

Fresh Node 22 installs are required in CI. The version, lockfile root versions, bilingual READMEs, changelog, bilingual release notes and published tag must agree before publication. Test-configuration moves retain explicit project roots, output locations and owned server working directories.

## Findings resolved during verification

A simple standalone Satori override would not replace OG's embedded copy. Upgrading OG alone also exposed runtime compatibility problems. The supported vinext 1.0.1 integration supplies the upstream HarfBuzz/WASM/font transformations while retaining React 19.2.8.

The upgraded adapter delegates development startup to Vite, whose default port differs. The application now uses the supported Vite commands with explicit strict port 3000, maintaining the documented URL and failing clearly on a collision.

A final check in the original user checkout found an untracked empty `app/_sites-preview` starter directory. Automatic root-first route discovery selected it and returned 404, although fresh-checkout tests passed. The configuration now explicitly selects `src/`; the Worker dependency fixture intentionally retains an empty root `app/` directory to prevent this regression.

A merged-main Linux WebKit run caught an iPhone action-area assertion after a fixed 450 ms delay; macOS repeated runs did not reproduce it. The test now observes the application's asynchronous scrolling with the normal 5-second assertion budget, preserving the viewport and 44 px touch-target limits without scrolling on the test's behalf. Failure diagnostics include scroll position and document geometry; CI preserves browser traces and screenshots. A local negative control with application scrolling disabled still failed the viewport assertion. The initial failed run remains part of the release evidence, separately from final passing checks.

A Worker test also exposed an invalid fixture assumption: fixed Hero/board cards with a random opponent can legitimately split the pot. The captured hand had equal pairs and kickers. The unique-winner test now gives Hero an unbeatable king-high straight flush and asserts Hero and the hand type, preserving the one-winner requirement without changing game rules.

Generated dependency-test builds are ignored by lint and removed by the test runner. Investigation logs are separate from successful final regression evidence.

## Boundary

Poker behavior and browser storage schema/key contracts are unchanged. A source release is not a production deployment; hosted behavior and physical iOS hardware remain unverified. Single-active-tab storage remains the supported model. A zero audit result describes the current advisory database, not a universal security guarantee. See [the dependency assessment](SECURITY_0.3.1.md) for the bundled-code distinction and primary references.
