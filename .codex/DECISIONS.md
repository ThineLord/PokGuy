# Maintenance Decisions

Architecture and poker-rule decisions remain authoritative in `ARCHITECTURE.md` and `POKER_RULES.md`. This file records only maintenance-loop decisions.

## 2026-08-01 — Preserve the existing Phase 8.0 worktree

- Treat all files present at startup as user-owned work.
- Audit and validate them as one coherent Review Lab checkpoint instead of replacing or splitting them blindly.
- Allow only directly related, independently verified repairs before checkpointing.

## 2026-08-01 — Keep product state and recovery state separate

- `docs/IMPLEMENTATION_STATUS.md` and `docs/NEXT_STEPS.md` describe product capabilities and roadmap.
- `.codex/` records exact branch, SHA, dirty state, validation evidence, risks, and resume commands.
- State files must never contain credentials, user data, or private machine paths.

## 2026-08-01 — Preserve compatibility boundaries

- Do not change the poker engine, public behavior, LocalStorage key, or v2 schema during PKG-001.
- Do not infer a new license, product rebrand, or tournament behavior.
- Do not begin the proposed v3 decision-snapshot migration without a separate design checkpoint because it changes stored data.

## 2026-08-02 — Recover fields without rewriting the storage contract

- Keep `riverlab-poker-v2` and schema version 2 unchanged.
- Preserve any complete, unique pool of at least eight valid AI profiles, including custom-only pools; repair only malformed entries and only pad damaged short pools to eight.
- Treat an explicit empty AI selection as “use the complete profile pool,” matching existing behavior.
- Drop incomplete AI habit observations rather than passing unsafe partial objects to the UI or silently inventing statistics.
- Keep repaired startup data in memory until the next normal save. Do not immediately overwrite the raw record because an unknown future schema could otherwise be destructively downgraded.

## 2026-08-02 — Keep WebKit coverage selected and explicit

- Keep `npm run test:e2e` pinned to the full Chromium project so the established local gate retains its scope and runtime.
- Select seven high-value existing tests for WebKit through the `@webkit` title tag; avoid duplicate test bodies and avoid weakening assertions for browser timing.
- Keep the WebKit runtime in Playwright's user cache. Do not add a dependency or change `package-lock.json` merely to install a browser binary.
- Treat Desktop Safari WebKit plus explicit mobile viewports as browser-engine coverage, not proof of physical iOS safe-area, touch, or dynamic-address-bar behavior.
- Preserve `.openai/hosting.json` and deployment state because PKG-003 changes only local test infrastructure.

## 2026-08-02 — Start CI with one read-only core gate

- Trigger on pushes to `main` and pull requests targeting `main`; use ordinary `pull_request`, never the higher-trust `pull_request_target` event for untrusted code tests.
- Run only clean dependency installation and the canonical `npm run check`; keep browser downloads and E2E local until their CI cost is evaluated separately.
- Use the latest patched Node 22 LTS line (`22.x`) instead of freezing the sole gate to the older minimum 22.13.0 patch. A minimum-version compatibility job can be designed separately if needed.
- Pin official action releases to full commit SHAs, grant only `contents: read`, and disable checkout credential persistence.
- Do not enable branch protection automatically. Requiring the check would change repository governance and the current direct-main maintenance workflow.
- Do not rewrite mixed lockfile registry URLs inside CI. Audit and any normalization belong to separately approved PKG-006.

## 2026-08-02 — Normalize lockfile origins without overriding user npm configuration

- Replace only the exact `https://registry.npmmirror.com/` origin in the 98 affected `packages[*].resolved` values; keep every package version, integrity hash, tarball pathname, dependency edge, flag, package key, root field, and lockfile version unchanged.
- Require npmjs metadata parity and a cold-cache integrity-checked install before applying the transformation to the repository.
- Do not use `npm install --package-lock-only` as a registry-normalization mechanism because npm does not guarantee that it rewrites existing custom registry origins.
- Do not add a project `.npmrc` in this task. Registry choice remains a user/operator preference, while committed lockfile provenance is reviewed independently.
- Treat npm audit advisory remediation as separate dependency-maintenance work; do not change dependency versions inside this provenance-only checkpoint.

## 2026-08-02 — Patch supported Next packages and defer incompatible transitive overrides

- Update `next` and `eslint-config-next` together from `16.2.6` to current stable `16.2.12`; keep React, Vite, vinext, Wrangler, and Cloudflare unchanged.
- Measure audit improvement by distinct advisory records as well as npm's package-level summary. Parent-package propagation keeps the package-level total at three even after all nine Next-specific advisory records disappear.
- Do not override Next's exact PostCSS `8.4.31` or Sharp `^0.34.5` declarations. Upstream safe-version adoption changes vendored PostCSS bundles, image optimization, tests, and Turbopack tracing, so a version-only override is not equivalent to the upstream fix.
- Do not adopt preview/canary Next builds for this application. Revisit the residual findings when a stable release incorporates PostCSS `>=8.5.18` and Sharp `>=0.35.0` with its compatibility changes.
- Treat reduced reachability as mitigation, not resolution: PokGuy does not build untrusted CSS or use `next/image`, but the affected packages remain installed.
