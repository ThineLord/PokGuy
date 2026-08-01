# Known Issues

## Invalid persisted settings can block startup — resolved

- Status: Fixed in `4aec6ee`
- Priority: Closed P1
- Resolution: Numeric settings, profile pools, selected IDs, and AI habit records are normalized before use; startup and import recovery are covered by unit, component, and Chromium tests.

## Recovered startup data is not rewritten immediately

- Status: Accepted safety tradeoff
- Priority: P3
- Impact: If a damaged or old record is recovered and the user performs no action that saves data, a refresh can show the migration/recovery notice again.
- Next step: Only consider automatic rewrite together with version-aware backup/forward-compatibility rules; do not overwrite unknown future schemas based on the current broad migration signal.

## Physical iOS Safari is not automated

- Status: Reduced by PKG-003; accepted manual boundary
- Priority: P3
- Impact: Seven repeatable Playwright WebKit tests now cover the browser engine and explicit iPhone/iPad-sized viewports, but desktop WebKit emulation cannot prove physical-device safe areas, touch behavior, or dynamic browser chrome.
- Next step: Retain the real-device checks in `TESTING.md`; add device-farm automation only when its cost and privacy boundary are justified.

## Older training records lack action-time snapshots

- Status: Known limitation
- Priority: P3
- Impact: A legacy/imported grade can only be paired with an action when record count and chronological order make the mapping unambiguous; otherwise Review Lab intentionally shows the grade without action context.
- Next step: Keep the safe fallback in Phase 8.0; design a versioned migration separately for PKG-005.

## Repository-wide formatting baseline is not clean

- Status: Pre-existing; observed on 2026-08-01
- Priority: P3
- Impact: `npm run format:check` reports 10 untouched files, so it cannot yet serve as a repository-wide gate without a separate formatting-only change.
- Next step: Keep changed-file formatting clean; schedule any baseline normalization as an isolated, reviewable task.

## Lockfile uses mixed npm registries — resolved

- Status: Fixed in `cb19453`; exact-SHA GitHub Actions run `30710451561` passed
- Priority: Closed P2
- Resolution: Replaced only 98 mirror hostnames after npmjs metadata parity and cold-cache integrity verification. The lockfile now contains 717 npmjs.org and zero npmmirror.com resolved URLs, with every version, integrity hash, path, dependency edge, and flag unchanged.

## Production dependency advisories

- Status: Reduced by PKG-007 commit `2c2782d`; exact-SHA CI run `30713299084` passed. Residual PostCSS/Sharp findings are deferred with mitigation.
- Priority: P1 residual upstream dependency risk
- Impact: Updating Next removes all nine Next-specific advisory records. Stable Next `16.2.12` still installs PostCSS `8.4.31` and Sharp `0.34.5`, leaving three PostCSS and one Sharp advisory record; npm's parent propagation therefore still reports three high package-level nodes. PokGuy does not build user-supplied CSS or use `next/image`, reducing current reachability without eliminating the vulnerable packages.
- Next step: Monitor stable Next for its merged PostCSS/Sharp compatibility work and update when a stable release declares PostCSS `>=8.5.18` and Sharp `>=0.35.0`. Do not force overrides or adopt preview/canary builds.

## React and build-toolchain dependency advisories

- Status: Direct React Server Components finding resolved by PKG-008 commit `237ff2b` / CI run `30714243780`; both direct Vite findings resolved by PKG-009 commit `0754a4f` / exact-SHA CI run `30716519172`. Remaining toolchain findings are open.
- Priority: P1 residual Cloudflare/Wrangler toolchain risk
- Impact: Vite `8.0.16` removes `GHSA-v6wh-96g9-6wx3` and `GHSA-fx2h-pf6j-xcff`, reducing the complete audit from 14 package records / 25 advisory sources to 13 / 23. Remaining findings belong to Cloudflare/Wrangler and Next's PostCSS/Sharp chains; grouping them would cross separate adapter and production dependency boundaries.
- Next step: Audit the Cloudflare plugin/Wrangler/Miniflare/workerd chain as PKG-010 with isolated candidates and real runtime/deploy validation. Never use an unreviewed broad `npm audit fix`.

## Quality check is not branch-protected

- Status: Open governance boundary
- Priority: P3
- Impact: GitHub Actions reports failures, but `main` currently permits direct pushes and merges without requiring the `Quality` check.
- Next step: Consider branch protection only as a separately approved repository-policy change because it would alter the direct-main maintenance workflow.

## Toolchain warnings during successful checks

- Status: Observed, non-failing
- Priority: P3
- Impact: Node may report `module.register()` deprecation and jsdom LocalStorage experimental warnings; vinext may report proxy detection; Playwright may report color-variable warnings.
- Next step: Reassess during future dependency maintenance, without changing pinned dependencies solely to silence warnings.
