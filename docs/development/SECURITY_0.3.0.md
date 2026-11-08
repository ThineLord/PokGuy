# v0.3.0 dependency and runtime assessment

Assessment date: 2026-11-09. This is a source/local-runtime assessment, not a production deployment or penetration-test claim.

## Changes

- Next and its ESLint configuration: 16.4.5. Vite: 8.1.6. Vitest and coverage: 4.1.12.
- Refresh compatible transitive patches including brace-expansion, fast-uri, source-map-js and Zod.
- Keep vinext 0.0.50 and the stable Miniflare 4 integration. Pin Miniflare's transitive sharp to 0.35.5 and Undici to 7.30.2; pin image-size to 2.1.0. These overrides require the built Worker regression gate on future upgrades.
- Declare local ASSETS and IMAGES bindings with remote image access disabled. The emitted Worker must transform a real PNG into a 64-pixel WebP. Tests check bytes, MIME type and decoded dimensions, plus SVG, remote URL, invalid width and missing-file responses.

The npm 10 lockfile update resolver failed while exploring optional peers; npm 12 generated the lockfile, then Node 22/npm 10 `npm ci` installed it successfully. The lockfile and CI remain reproducible without legacy peer flags.

## Remaining advisories

The refreshed npm audit reports **0 critical, 0 high, 11 moderate package records**. Package records include propagated dependency reports and do not equal distinct exploitable vulnerabilities. Two underlying moderate advisories remain:

| Dependency                                 | Reachability in this project                                                                                               | Follow-up                                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| minimatch 10.2.6 through typescript-eslint | ESLint processes repository input during development/CI; not shipped as an application request handler                     | Wait for upstream supported minimatch 11 adoption; avoid an unverified major override                                   |
| Satori 0.16.0 through @vercel/og/vinext    | The app serves a checked-in static `public/og.png`; no dynamic OG rendering route or user-controlled SVG generation exists | Reassess before introducing dynamic OG/user-controlled templates; upgrade the adapter after compatible upstream support |

No current user-facing exploit was demonstrated. These are explicit residual risks, not a clean security certificate. No production environment, credentials or remote image service was provisioned.

## Primary references

- [Next security advisories](https://github.com/vercel/next.js/security/advisories)
- [Vite security advisories](https://github.com/vitejs/vite/security/advisories)
- [sharp SVG advisory](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w)
- [Undici advisory](https://github.com/nodejs/undici/security/advisories/GHSA-2m5v-pch6-74hx)
- [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [Satori advisory](https://github.com/advisories/GHSA-wx4j-mvgx-mqwp)
