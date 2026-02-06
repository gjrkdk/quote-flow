---
phase: 05-react-widget
plan: 02
subsystem: widget
tags: [react, vite, typescript, npm, shadow-dom]

# Dependency graph
requires:
  - phase: 04-public-rest-api
    provides: REST API endpoints for price fetching and Draft Order creation
provides:
  - Widget package scaffold with Vite library mode configuration
  - TypeScript types defining complete public API surface
  - Build tooling for ESM + UMD builds with type declarations
affects: [05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: [vite, @vitejs/plugin-react, vite-plugin-dts, use-debounce, react-shadow]
  patterns: [Vite library mode with externalized React, Shadow DOM packaging, peer dependency pattern]

key-files:
  created:
    - packages/widget/package.json
    - packages/widget/vite.config.ts
    - packages/widget/tsconfig.json
    - packages/widget/src/types.ts
    - packages/widget/src/index.ts
  modified: []

key-decisions:
  - "React 18 as peer dependency (not bundled): Consumer provides React, widget externalizes it"
  - "3 required props (apiUrl, apiKey, productId): Minimal API surface for v1"
  - "6 optional theme props mapping to CSS custom properties: Flexible styling without bloated API"
  - "onAddToCart callback with AddToCartEvent payload: Single callback for Draft Order completion"
  - "Internal API response types not exported: Keep public API minimal, hide implementation details"

patterns-established:
  - "Vite library mode: ESM + UMD builds with rollupTypes for single .d.ts file"
  - "React externalization: react, react-dom, react/jsx-runtime as external and global mapping"
  - "Public API entry point: index.ts exports only consumer-facing types and component"

# Metrics
duration: 2min
completed: 2026-02-06
---

# Phase 05 Plan 02: Widget Package Scaffold Summary

**Vite library mode package with TypeScript types, React 18 peer dependencies, and ESM/UMD builds**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-06T09:28:19Z
- **Completed:** 2026-02-06T09:30:02Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Widget package scaffolded with Vite library mode (ESM + UMD builds)
- TypeScript types define complete public API: 3 required props, 6 optional theme props, onAddToCart callback
- React 18 externalized as peer dependency (never bundled)
- Build tooling configured with vite-plugin-dts for TypeScript declarations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create widget package structure with build tooling** - `767c4fd` (chore)
2. **Task 2: Create TypeScript types and entry point** - `ac1ee56` (feat)

## Files Created/Modified
- `packages/widget/package.json` - npm package config with peer dependencies, exports, build scripts
- `packages/widget/vite.config.ts` - Vite library mode config externalizing React
- `packages/widget/tsconfig.json` - TypeScript config for React JSX
- `packages/widget/src/types.ts` - PriceMatrixWidgetProps, ThemeProps, AddToCartEvent, internal API types
- `packages/widget/src/index.ts` - Public API entry point exporting only consumer-facing types
- `packages/widget/package-lock.json` - Dependency lock file

## Decisions Made

1. **React as peer dependency**: React and react-dom in both `peerDependencies` (tells consumers they need React) and `devDependencies` (provides React for local build). This prevents bundling React into the widget output.

2. **3 required props design**: Following CONTEXT.md decision, widget requires `apiUrl`, `apiKey`, `productId` only. No hardcoded API URL, no optional product prop. Minimal API surface for v1.

3. **Theme props as CSS custom properties**: 6 optional theme props (`primaryColor`, `textColor`, `borderColor`, `borderRadius`, `fontSize`, `errorColor`) map to CSS custom properties. Flexible styling without bloated API.

4. **Internal types not exported**: API response types (`PriceApiResponse`, `DraftOrderApiResponse`, `ApiErrorResponse`) are defined but not exported from index.ts. Keeps public API minimal.

5. **Single callback pattern**: `onAddToCart` is the only callback prop. Fires when Draft Order is successfully created. Payload includes `draftOrderId`, `checkoutUrl`, `price`, `total`, `dimensions`, `quantity`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Widget package scaffold complete and ready for component implementation
- TypeScript types define the complete contract between widget and consumers
- Build infrastructure ready to produce ESM/UMD bundles with type declarations
- Note: index.ts currently imports non-existent PriceMatrixWidget.tsx - this will be created in Plan 04

## Self-Check: PASSED

All created files verified to exist:
- packages/widget/package.json
- packages/widget/vite.config.ts
- packages/widget/tsconfig.json
- packages/widget/src/types.ts
- packages/widget/src/index.ts
- packages/widget/package-lock.json

All commits verified in git history:
- 767c4fd
- ac1ee56

---
*Phase: 05-react-widget*
*Completed: 2026-02-06*
