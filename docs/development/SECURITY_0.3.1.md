# v0.3.1 dependency assessment

Assessed on 2026-11-09. This supersedes the residual dependency findings in the [v0.3.0 assessment](SECURITY_0.3.0.md), without changing that historical record. This is a source/local-runtime assessment, not a production penetration test.

## Resolved chains

| Chain                         | Change                                                                                | Compatibility evidence                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| typescript-eslint → minimatch | Scope an override to `@typescript-eslint/typescript-estree`: minimatch 11.0.1         | Real project-service `allowDefaultProject` positive/negative cases, dotfiles and bounded adversarial glob preprocessing |
| vinext → @vercel/og → Satori  | vinext 1.0.1 and plugin-rsc 0.5.34 bring the supported OG 1.0.3 / Satori 0.33.5 stack | Actual built Node and Worker routes decode a 240×120 PNG and reject unsafe internal SVG styles                          |
| Satori → fflate               | Scope fflate 0.7.5 to Satori                                                          | Valid ZIP roundtrip and malformed ZIP64 rejection in a process with a five-second limit                                 |

React/React DOM/RSC stay at 19.2.8. Existing bounded Miniflare sharp/Undici overrides remain. The obsolete image-size override was removed because the upgraded adapter no longer installs that dependency.

The official-registry audit of the locked graph reports **0 vulnerabilities**, including development and optional dependencies. `npm run audit:dependencies` is a CI gate at moderate severity; an unavailable registry fails the gate instead of being reported as a clean audit.

## Why a direct Satori override was insufficient

`@vercel/og` bundles Satori into its Node and edge files. Replacing only the standalone Satori package would leave those embedded copies unchanged. OG 1.0.3 includes the fixed serializer, but its newer HarfBuzz/WASM/font integration also needs the official vinext runtime transformation. A direct import under plain Node bypasses this integration and failed during investigation; it is not the supported application path.

vinext 1.0.1 is the small stable upgrade carrying the upstream compatibility plugin while retaining the project's React version and custom Worker API. Both supported paths are exercised through production Vite builds, with the same Worker entry and binding configuration used by the application. No dynamic OG route is added to the product: temporary regression routes are built separately under ignored `.vinext/` directories and removed after the checks.

The new Satori graph initially exposed a third advisory: its exact fflate 0.7.3 dependency has a malformed ZIP64 reader issue. The scoped patch fixes the installed reader. OG's prebundled font decompression code still contains a 0.7.3 source annotation, but does not include the affected `unzipSync`/ZIP64 reader. This distinction was inspected separately; an override does not rewrite a bundled library. The current app continues to serve a static `public/og.png`.

## Ongoing validation

`npm run test:dependencies` checks real callers and built rendering, not just package version strings. It is included in `npm run check`, alongside release consistency, formatting, lint, type checks, all unit tests and the application build. Chromium, selected desktop WebKit, and the built production Worker remain separate complete browser gates.

Temporary fixtures use synthetic content only. Existing test timeouts and poker simulation sample counts are unchanged. A zero audit result describes the advisory database and lockfile at the assessment date; it is not proof that all software is vulnerability-free or that a hosted deployment was upgraded.

## Primary references

- [minimatch glob amplification advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [Satori SVG escaping advisory](https://github.com/advisories/GHSA-wx4j-mvgx-mqwp)
- [Satori serializer fix](https://github.com/vercel/satori/commit/26a52affc031216fee5882b6e965c8dbc7ac1782)
- [fflate ZIP64 advisory](https://github.com/advisories/GHSA-px8p-9vwx-vf98)
- [Upstream vinext HarfBuzz integration](https://github.com/cloudflare/vinext/blob/main/packages/vinext/src/plugins/og-harfbuzz.ts)
