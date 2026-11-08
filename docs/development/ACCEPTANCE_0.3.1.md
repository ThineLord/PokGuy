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

Feature validation passed 203 unit tests, four dependency compatibility/security gates, the complete quality/build gate, and 25 Chromium browser tests. The release description records the final complete Chromium, selected desktop WebKit and built Worker counts, exact reviewed commit, merged-main SHA and successful CI links. No existing test timeout or poker simulation sample count was changed.

Fresh Node 22 installs are required in CI. The version, lockfile root versions, bilingual READMEs, changelog, bilingual release notes and published tag must agree before publication. Test-configuration moves retain explicit project roots, output locations and owned server working directories.

## Findings resolved during verification

A simple standalone Satori override would not replace OG's embedded copy. Upgrading OG alone also exposed runtime compatibility problems. The supported vinext 1.0.1 integration supplies the upstream HarfBuzz/WASM/font transformations while retaining React 19.2.8.

The upgraded adapter delegates development startup to Vite, whose default port differs. The application now uses the supported Vite commands with explicit strict port 3000, maintaining the documented URL and failing clearly on a collision.

Generated dependency-test builds are ignored by lint and removed by the test runner. Investigation logs are separate from successful final regression evidence.

## Boundary

Poker behavior and browser storage schema/key contracts are unchanged. A source release is not a production deployment; hosted behavior and physical iOS hardware remain unverified. Single-active-tab storage remains the supported model. A zero audit result describes the current advisory database, not a universal security guarantee. See [the dependency assessment](SECURITY_0.3.1.md) for the bundled-code distinction and primary references.
