# Task Queue

## PKG-001 — DONE

- Description: Complete the existing Phase 8.0 Review Lab and social-preview checkpoint safely.
- Priority: P1
- File scope: Current 13 product/document/test worktree items plus `.codex/` recovery state; any repair must remain directly related to this checkpoint.
- Risk: Medium because the worktree predates this maintenance cycle and is currently on `main`; no engine or storage-schema change is intended.
- Acceptance criteria: Existing Review Lab intent is preserved; old records degrade without false action pairing; metadata works for supported local and hosted origins; no secret or machine path is introduced; recovery state is truthful; commit and remote branch agree.
- Test method: Targeted unit tests, `npm run check`, `npm run test:e2e`, `git diff --check`, sensitive-pattern scan, staged-diff review, remote SHA verification.
- Completion: Product commit `256d789` and documentation checkpoint `59bae14`; all local gates passed, push succeeded, and `origin/main` was verified at `59bae143a2209b1b0ee4c313d80dd5431794988c`.

## PKG-002 — DONE

- Description: Prevent invalid or malformed persisted settings from blocking application startup or the next hand.
- Priority: P1
- File scope: `src/storage/storage.ts`, settings inputs/persistence in `src/features/app/PokerTrainer.tsx`, focused storage/component tests, and recovery documentation.
- Risk: Medium; normalization must preserve valid user settings and existing LocalStorage v1/v2 data.
- Acceptance criteria: Empty, non-finite, out-of-range, or incompatible blind/stack/seat/delay values recover safely; malformed AI profiles cannot crash startup; valid settings remain byte-for-byte equivalent where practical; users receive a clear message when recovery occurs.
- Test method: Migration fixtures, malformed LocalStorage startup test, settings-input browser test, `npm run check`, and `npm run test:e2e`.
- Completion: Product commit `4aec6ee`; 112 Vitest and 13 Chromium tests passed, recovery UI was inspected in a real browser with zero console errors/warnings, and the product commit was pushed to `origin/main`.

## PKG-003 — DONE

- Description: Add a WebKit automation project and validate the Review Lab, LocalStorage refresh, export, responsive layout, and keyboard/input boundaries.
- Priority: P2
- File scope: `playwright.config.ts`, `package.json`, selected existing tests in `tests/e2e/`, testing documentation, and `.codex/` recovery state only. No dependency or lockfile change is intended.
- Risk: Medium; browser runtime availability and WebKit-specific layout/timing behavior may differ.
- Acceptance criteria: Chromium remains green; selected WebKit flows pass without weakening assertions; no product behavior is changed merely to satisfy timing.
- Test method: Install/verify Playwright WebKit, run targeted WebKit cases, then the complete project gates.
- Completion: Product commit `9542fa9`; 7 selected WebKit and 13 complete Chromium tests passed, 112 Vitest tests and the production build remained green, no dependency or lockfile changed, and remote `main` was verified at `9542fa9b350a023936c497dd88dcaaee09b74362` before the state-only checkpoint.

## PKG-004 — DONE

- Description: Add a minimal GitHub Actions quality gate for pull requests and pushes.
- Priority: P2
- File scope: `.github/workflows/ci.yml`, `README.md`, `TESTING.md`, release/status documentation, and `.codex/` recovery state. No dependency or lockfile change is intended.
- Risk: Low to medium; CI runtime and Node version must match the supported toolchain.
- Acceptance criteria: Clean install plus `npm run check` succeeds in CI; no secrets or deployment permissions are required.
- Test method: Validate workflow syntax locally where possible, push on a branch/checkpoint, and wait for a completed GitHub Actions conclusion.
- Completion: Commit `5273674`; local gates passed with 112 Vitest, 13 Chromium, and 7 WebKit tests. GitHub Actions run `30709790461` completed successfully for the exact commit SHA after clean `npm ci`; no dependency, lockfile, product, persistence, hosting, or deployment change was made.

## PKG-005 — DEFERRED

- Description: Store immutable decision-time review snapshots and support retraining from a review point.
- Priority: P3
- File scope: Storage schema/migrations, review UI, tests, and documentation.
- Risk: High because it requires a versioned data migration and careful hidden-information boundaries.
- Acceptance criteria: Requires a separately approved design; v1/v2 data migrate without loss; snapshots contain only information visible at action time.
- Test method: Migration fixtures, privacy boundary tests, unit tests, Chromium/WebKit flows, clean-profile import/export smoke test.

## PKG-006 — DONE

- Description: Audit mixed npm registry provenance in `package-lock.json` and, only if mechanically safe, normalize ordinary package downloads without changing dependency versions or integrity.
- Priority: P2
- File scope: `package-lock.json`, concise dependency/testing documentation, and `.codex/` recovery state. User-level npm/proxy configuration is read-only and must never be committed.
- Risk: Medium because a lockfile rewrite changes dependency configuration and may affect clean installs despite unchanged versions.
- Acceptance criteria: Registry origin is documented; package versions, integrity hashes, dependency graph, and lockfile version remain unchanged; no credentials or machine configuration enter the repository; local and clean Linux gates pass.
- Test method: Before/after structural lockfile comparison, isolated `npm ci`, `npm run check`, Chromium/WebKit regressions, diff/security review, and completed GitHub Actions conclusion.
- Completion: Commit `cb19453`; 98 mirror records matched npmjs metadata and were changed by exact hostname substitution only. Structural comparison, isolated cold-cache `npm ci`, repository checks, 13 Chromium tests, 7 WebKit tests, final diff/security checks, push verification, and exact-SHA GitHub Actions run `30710451561` all passed.

## PKG-007 — DONE

- Description: Remediate production-path npm advisories in a minimal dependency checkpoint, starting with the direct Next.js update and explicitly evaluating residual PostCSS/Sharp findings.
- Priority: P1
- File scope: `package.json`, `package-lock.json`, directly affected tests/documentation, and `.codex/` recovery state. Cloudflare/Vite/React development-toolchain upgrades must remain a separate checkpoint unless required by the production fix.
- Risk: Medium because framework and transitive dependency updates can affect build, runtime routing, image handling, and deployment compatibility.
- Acceptance criteria: Upgrade Next.js to a verified patched release without API or UX regression; rerun production-only audit; document and safely resolve or explicitly defer residual PostCSS/Sharp findings; do not use an unreviewed `npm audit fix` or broad toolchain upgrade.
- Test method: Before/after dependency and audit comparison, isolated clean `npm ci`, `npm run check`, Chromium/WebKit regressions, production build/smoke test, diff/security review, and completed exact-SHA GitHub Actions conclusion.
- Completion: Commit `2c2782d` updates Next and `eslint-config-next` to `16.2.12`. Isolated/repository clean install, 112 tests/build, 13 Chromium, 7 WebKit, production smoke, advisory-level reduction from 13 to 4, final diff/security checks, push verification, and exact-SHA GitHub Actions run `30713299084` all passed. PostCSS/Sharp overrides are explicitly deferred with reachability mitigation and stable-upstream resume conditions.

## PKG-008 — DONE

- Description: Audit and apply the smallest coherent React Server Components security patch across React, React DOM, and `react-server-dom-webpack`.
- Priority: P1
- File scope: `package.json`, `package-lock.json`, directly affected app/tests/docs, and `.codex/` recovery state. Vite and Cloudflare/Wrangler upgrades remain separate.
- Risk: Medium because the three packages have exact compatibility and peer boundaries across client rendering, RSC serialization, and the vinext adapter.
- Acceptance criteria: Use an official patched version trio; remove the direct RSC advisory without introducing peer warnings or unrelated dependency drift; preserve UI, LocalStorage, poker rules, and deployment configuration.
- Test method: Advisory-level before/after audit, isolated cold-cache `npm ci`, `npm run check`, Chromium/WebKit regressions, production smoke, diff/security review, and completed exact-SHA GitHub Actions conclusion.
- Completion: Commit `237ff2b` applies exact `19.2.8` across the trio. Isolated/repository cold installs, exact four-record lock boundary, peer checks, 112 tests/build, 13 Chromium, 7 WebKit, complete/production audit delta, production RSC/abnormal-request smoke, push verification, and exact-SHA GitHub Actions run `30714243780` all passed.

## PKG-009 — DONE

- Description: Audit and, if mechanically compatible, patch the two direct Vite advisories without bundling the Cloudflare/Wrangler upgrade.
- Priority: P1
- File scope: `package.json`, `package-lock.json`, Vite/Vitest configuration, directly affected tests/docs, and `.codex/` recovery state. Cloudflare plugin, Wrangler, Miniflare, Next, React, and persistence are excluded unless a peer constraint proves the task blocked.
- Risk: Medium because Vite is shared by development, tests, the vinext production build, and the Cloudflare adapter.
- Acceptance criteria: Confirm the official affected/fixed ranges and every direct peer; produce an isolated bounded lock delta; remove the direct Vite advisories without unrelated toolchain drift; preserve application, LocalStorage, and deployment behavior.
- Test method: Advisory-level audit comparison, isolated cold-cache `npm ci`, peer graph, `npm run check`, Chromium/WebKit regressions, production smoke, Cloudflare build/config validation where available, diff/security review, and completed exact-SHA GitHub Actions conclusion.
- Completion: Commit `0754a4f` applies exact Vite `8.0.16`. Isolated comparison, repository cold install/peer checks, exact 24-record lock boundary, audit reduction from 14 records / 25 sources to 13 / 23, 112 tests/build, 13 Chromium, 7 WebKit, production/workerd smokes, no-upload deploy dry-run, artifact/security/diff review, push verification, and exact-SHA GitHub Actions run `30716519172` all passed.

## PKG-010 — DONE

- Description: Audit and, if safely compatible, patch the remaining Cloudflare plugin/Wrangler/Miniflare/workerd toolchain advisories without bundling production dependency changes.
- Priority: P1
- File scope: `package.json`, `package-lock.json`, `vite.config.ts`, `worker/`, `.openai/hosting.json`, directly affected tests/docs, and `.codex/` recovery state. Next, React, product logic, persistence, and deployment resources are excluded unless compatibility proves the task blocked.
- Risk: Medium-high because the chain controls local workerd execution, asset routing, deployment packaging, and remote publishing commands.
- Acceptance criteria: Verify each official advisory/fixed range and Node/peer boundary; produce isolated bounded candidates; preserve hosting redirects/assets/bindings and perform no upload; remove only findings supported by compatible stable releases.
- Test method: Advisory-level audit comparison, isolated cold-cache `npm ci`, peer graph, `npm run check`, Chromium/WebKit regressions, production smoke, real workerd preview, no-upload Wrangler deploy dry-run, artifact/diff/security review, and completed exact-SHA GitHub Actions conclusion.
- Completion: Commit `448a243` applies plugin `1.47.0`, Wrangler `4.114.0`, exact Workers types `5.20260722.1`, and an explicit baseline compatibility date. Candidate/repository cold installs, clean peer graph, 724→754 semantic lock boundary, audit reduction from 13/23 to 7/13 with no Cloudflare chain, 112 tests/build, 13 Chromium, 7 WebKit, production/workerd/artifact/no-upload dry-run, formatting/security/independent reviews, push verification, and exact-SHA CI run `30719418742` all passed.

## PKG-011 — DONE

- Description: Map and, where stable compatible fixes exist, patch the residual `@babel/core`, `brace-expansion`, `fast-uri`, and `js-yaml` development-toolchain audit records without bundling Next/PostCSS/Sharp or product dependency work.
- Priority: P2
- File scope: `package.json`, `package-lock.json`, direct ESLint/Babel/Webpack/JSON-schema dependencies and configuration, relevant tests/docs, and `.codex/` state. Next, React, Vite, Cloudflare, product logic, persistence, and deployment resources are excluded.
- Risk: Medium because these packages participate in lint/build/test tooling and may be pinned through multiple direct dependency trees.
- Acceptance criteria: Map every advisory via chain and reachability; prefer stable direct upstream adoption; produce isolated bounded candidates; remove only supported findings without overrides or unrelated package movement.
- Test method: Official advisory comparison, cold `npm ci`, clean peer graph, `npm run check`, Chromium/WebKit, production/workerd smoke where build graph changes, diff/security review, and exact-SHA CI.
- Completion: Commit `8fafbe9` applies the exact six-record lock-only candidate while leaving `package.json` byte-identical. Cold install, clean dependency graph, 754→754 exact lock boundary, complete-audit reduction from 7 records / 13 sources to the separately deferred Next/PostCSS/Sharp 3 / 4, 112 tests/build, 13 Chromium, 7 WebKit, production/workerd/artifact, changed-file formatting/security/scope reviews, push verification, and exact-SHA CI run `30723138038` all passed.

## PKG-012 — TODO

- Description: Normalize the 10 known repository-wide Prettier differences as one isolated formatting-only checkpoint so the existing `format:check` command becomes a reliable green gate.
- Priority: P3
- File scope: Exactly the 10 currently reported files: `next.config.ts`, `src/ai/adaptation/adapt.ts`, `src/ai/assessment/assessHand.ts`, `src/ai/personalities/presets.ts`, `src/engine/betting/types.ts`, `src/engine/deck/deck.ts`, `src/engine/evaluator/evaluator.ts`, `src/engine/state/positions.ts`, `tests/engine/positions.test.ts`, and `worker/index.ts`. Dependencies, generated output, product behavior, storage, and deployment configuration are excluded.
- Risk: Low to medium because a mechanical formatter would rewrite 10 code/config files; the exact diff requires an approval boundary before application.
- Acceptance criteria: Prettier-only changes with no semantic, import, API, generated-artifact, or dependency delta; repository-wide `npm run format:check` becomes green.
- Test method: Before/after AST- and diff-scope review where practical, `npm run format:check`, `npm run check`, Chromium/WebKit regressions if product bundles change, production/workerd smoke where configuration output changes, sensitive-data review, and exact-SHA CI.
