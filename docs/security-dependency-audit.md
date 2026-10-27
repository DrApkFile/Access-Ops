# Dependency security remediation — 27 October 2026

## Current follow-up audit — 27 October 2026

A fresh `bun audit --json` found **1 moderate advisory** after the earlier8→0 checkpoint: [GHSA-6pq8-jhm2-2vcw / CVE-2026-110816](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw), affected qs>=6.7.0 through6.16.0, fixed6.16.1. Installed/pinned6.16.0 was genuinely affected. A hostile own `toString` array element may crash `qs.stringify` with `arrayFormat:comma`; no direct application use of that mode was found, but the transitive package was still patched rather than suppressed.

Paths include API→@google/adk→optional MCP/A2A→Express→body-parser→qs and web dev→shadcn→MCP→Express→qs, plus Express's direct qs dependency. Actual traversal is `.accessops-local/free-vision/qs-dependency-paths.log`. The root override alone changed6.16.0→6.16.1, and `bun install` generated the corresponding two-line lock update with new integrity. No major/unrelated dependency upgrade occurred.

| New check | Actual result |
|---|---|
| `bun audit --json` before | Exit1,1 moderate finding; `audit.log` |
| `bun install` | Exit0; targeted patched qs installed |
| `bun install --frozen-lockfile` | Exit0, no changes; reproducible manifest/lock |
| Actual installed qs + hostile comma-array controls |6.16.1; two variants PASS/no uncaught exception, exit0; `qs-verification.json` |
| `bun audit --json` after | Exit0, `{}`,0 findings; `audit-final.log` |
| Regression/build/type/lint/source-boundary | See [current delivery](accessops-final-hardening-delivery.md); failures and isolated rerun retained |

No security check was disabled. New key-shaped Groq/OpenRouter values are redacted and rejected by source-secret scanning; server keys remain private. Zero known advisories does not certify all application/deployment security. Earlier eight-advisory inventory below remains historical.

## Earlier evidence (historical; superseded by the current checkpoint above)

**Current audit: 0 findings, down from 8 (5 high, 3 moderate).** This is the actual Bun registry audit, not a suppression or a production-readiness claim. Evidence is private under `.accessops-local/hardening/`; see the [consolidated hardening delivery](accessops-final-hardening-delivery.md) for final regression results.

## Reproduced inventory

All versions below were actually installed before remediation. The eight findings represent five distinct GHSA identifiers; three brace-expansion advisories each apply to two installed major-version lines. All are transitive. The table preserves the audit's range-specific count.

| # | Package/version before | Advisory and severity | Affected range; first fixed version | Installed remediation |
|---|---|---|---|---|
| 1 | brace-expansion 5.0.9 | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), high | >=4 <5.0.11; 5.0.11 | 5.0.12 |
| 2 | brace-expansion 1.1.18 | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p), high | <1.1.19; 1.1.19 | 1.1.21 |
| 3 | brace-expansion 5.0.9 | Same GHSA-6j4f-fj2g-mc7p, high | >=4 <5.0.10; 5.0.10 | 5.0.12 |
| 4 | brace-expansion 1.1.18 | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), moderate | <1.1.21; 1.1.21 | 1.1.21 |
| 5 | brace-expansion 5.0.9 | Same GHSA-q2hr-2g5m-vwhr, moderate | >=4 <5.0.12; 5.0.12 | 5.0.12 |
| 6 | brace-expansion 1.1.18 | Same GHSA-qhr7-859c-m2p7, high | <1.1.20; 1.1.20 | 1.1.21 |
| 7 | esbuild 0.18.20 | [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99), moderate | <=0.24.2; 0.25.0 | Remove archived loader chain; maintained tsx uses esbuild 0.28.2. Drizzle's own esbuild remains 0.25.12. |
| 8 | zod 4.4.3 and 3.25.76 | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), high | <4.6.6; 4.6.6 | All active consumers resolve 4.6.7. |

Before/after machine evidence: `audit-before.json`, `audit-intermediate.json`, `audit-after.json`, `audit-final.log`; original audit exit 1, final audit exit 0 with `{}`. Registry findings can change; rerun rather than treating this timestamp as a permanent guarantee.

## Dependency paths and exposure assessment

- **brace-expansion 1.x:** web → eslint 9.39.5 → @eslint/config-array 0.21.2 → minimatch 3.1.5 → brace-expansion. **5.x:** web → eslint-config-next 16.4.3 → typescript-eslint 8.67.0 → @typescript-eslint/typescript-estree → minimatch 10.2.6 → brace-expansion. A second path is web → shadcn → ts-morph 26 → @ts-morph/common → minimatch 10.2.6. These are development/build tooling. Malicious nested/rewrite brace patterns can exhaust stack/CPU. No public application endpoint passing imported operational data to these development glob parsers was identified. That inspection does not prove all possible tool invocations safe; all affected active versions were patched.
- **esbuild:** api → drizzle-kit 0.31.10 → @esbuild-kit/esm-loader 2.6.5 → @esbuild-kit/core-utils 3.3.2 → esbuild ~0.18.20. The advisory concerns an exposed esbuild development server's permissive CORS, not arbitrary emitted production JavaScript. AccessOps uses Next and Bun servers, and Drizzle is used as a CLI; no esbuild `serve` deployment was identified. The obsolete affected chain was nevertheless removed.
- **zod:** web → eslint-config-next → eslint-plugin-react-hooks 7.1.1 → zod 4.4.3; web → shadcn 4.18.0 → zod 3.25.76. The API/domain's direct Zod 4.6.7 was already patched. These vulnerable nested validators were tooling dependencies; this is not evidence that production import validation used vulnerable Zod. Oversized collections are still bounded at application boundaries, and every active Zod path now resolves the patched release.

Full path listings: `why-{brace,esbuild,zod}-before.txt` and `why-*-after.txt`. These describe lock resolution; actual package-link traversal is independently captured in `installed-dependency-proof.json`.

## Minimal changes and compatibility

1. Upgrade **shadcn 4.18.0 → 4.22.2**, same major, in `apps/web/package.json`. Its supported dependency changed to Zod 4. Removing it was inappropriate: the application actually imports `shadcn/tailwind.css`.
2. Root override **zod: 4.6.7** now satisfies the inspected consumers' supported ranges, including the updated shadcn. No Zod 3-only consumer was arbitrarily forced to v4.
3. Root override **@esbuild-kit/esm-loader: npm:tsx@4.23.12** replaces the archived loader with its [upstream-recommended successor](https://github.com/esbuild-kit/esm-loader). Drizzle's bundled CLI uses its own modern registration path; its version remains 0.31.10. The newer published stable Drizzle inspected during this task still retained the obsolete declaration, so an unrelated major/beta migration was avoided. This compatibility override is explicit technical debt: remove it when upstream drops the obsolete dependency, then rerun isolated generation and the audit.
4. The API now explicitly declares patched **sharp 0.35.5**, already present in the application tree/override, for bounded WebP decoding. This adds no new package version or unsupported major upgrade; frozen installation and the final audit were rerun.
5. Targeted lock resolution updates **brace-expansion 1.1.18 → 1.1.21** and **5.0.9 → 5.0.12**, both within existing minimatch constraints. No cross-major blanket brace override.

Bun 1.3.14 remains the declared/runtime package manager. Its older `update` behavior can add a requested transitive name to root dependencies. An isolated manifest/lockfile experiment first verified the supported newer resolver. Only the targeted lockfile operation used Bun 1.4.4 (`bun x bun@1.4.4 update brace-expansion --lockfile-only`); the application/runtime was not migrated. The lock format stays compatible, and Bun 1.3.14 frozen installs passed. This distinction avoids silently taking unrelated Bun runtime/SQL changes.

## Installed tree verification and reproducibility

An incremental frozen install initially retained old links in unchanged parent packages. A zero lockfile audit was therefore **not** accepted as sufficient proof. Active root/workspace dependency directories were moved, without deletion, to private `hardening/dependencies-before/`; a genuinely fresh `bun install --frozen-lockfile` installed 1806 packages successfully. The preserved directories are recovery artifacts, not served application dependencies.

`installed-dependency-proof.json` now reports **8/8 PASS** for actual Node resolution through the relevant parent packages. It verifies both brace major lines, both tool Zod paths, API Zod, Drizzle esbuild, and the loader alias (actual package identity `tsx`, esbuild 0.28.2). The earlier stale-link diagnosis is not represented as a successful install; the original generated directories remain available for recovery and inspection.

From repository root, with Bun 1.3.14 on PATH:

```sh
bun install --frozen-lockfile
bun audit --json
bun run test
ACCESSOPS_INTEGRATION=1 bun run test:integration
bun run typecheck
bun run lint
bun run security
bun run build
```

Targeted resolution already performed (not required for normal frozen installation):

```sh
bun x bun@1.4.4 update brace-expansion --lockfile-only
bun install --frozen-lockfile
```

The isolated Drizzle TypeScript schema/config generation ran twice **after the fresh install**, both exit 0 (`dependency-tools-result.json`, `dependency-tools-fresh.log`); existing databases/schema were untouched. Final build, browser, acceptance and Bumps checks are listed with exact results in the consolidated delivery. No audit rules were disabled, advisories suppressed, test assertions removed, or blanket forced upgrades used. No remaining finding from this inventory needs a temporary exception.

Final lock review: `lock-version-review.json` compares package/version sets rather than confusing Bun hoisting/path rewrites with upgrades. It records 47 changed sets, including removal of the obsolete esbuild platform packages, the shadcn registry/cn/type-fest additions, supported browser-data/tool patches and deduplication. The only major-set change among existing packages is the intentional elimination of Zod 3 in favor of supported Zod 4.6.7. Both lock format versions are 1. No unexpected existing-package major upgrade was found. The unified lock diff is included in `source-changes.diff`; frozen install, actual resolution, build and browser verification passed afterward.
