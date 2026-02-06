---
phase: 05-react-widget
plan: 01
subsystem: api
tags: [rest-api, currency, draft-orders, shopify-graphql, zod, cors, rate-limiting]

# Dependency graph
requires:
  - phase: 04-public-rest-api
    provides: REST API authentication, rate limiting, product matrix lookup service
  - phase: 03-draft-orders-integration
    provides: Draft Order creation pattern, price calculation service
provides:
  - Extended price API with currency, dimension ranges, and unit preference
  - REST endpoint for Draft Order creation via API key authentication
  - Widget-ready API responses with all metadata for client-side formatting and validation
affects: [05-react-widget, widget-integration, headless-storefront]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shopify admin GraphQL client creation from store access token for REST API contexts"
    - "DraftOrder GraphQL mutation with invoiceUrl for customer checkout URL"

key-files:
  created:
    - app/routes/api.v1.draft-orders.ts
  modified:
    - prisma/schema.prisma
    - app/services/product-matrix-lookup.server.ts
    - app/routes/api.v1.products.$productId.price.ts
    - app/validators/api.validators.ts

key-decisions:
  - "Store currency field defaults to USD - merchants can configure currency code"
  - "Dimension ranges calculated from first/last breakpoint values (min/max bounds)"
  - "Draft Order endpoint creates Shopify admin client using store's access token (REST pattern, not embedded app auth)"
  - "Draft Order response includes invoiceUrl as checkoutUrl for customer-facing checkout"
  - "DraftOrderSchema validates productId, width, height, quantity in request body"

patterns-established:
  - "Product matrix lookup now includes store metadata (currency, unitPreference) for consistent response formatting"
  - "REST endpoints create admin GraphQL client from store's access token for non-embedded contexts"
  - "Draft Order creation follows same retry logic and record-keeping patterns as embedded app flow"

# Metrics
duration: 63min
completed: 2026-02-06
---

# Phase 5 Plan 1: Widget API Extensions Summary

**REST API extended with currency codes, dimension ranges for validation hints, and Draft Order creation endpoint for headless checkout**

## Performance

- **Duration:** 63 min
- **Started:** 2026-02-06T09:27:19Z
- **Completed:** 2026-02-06T10:30:47Z
- **Tasks:** 3
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- Price API responses now include ISO 4217 currency code (not "store-default"), dimension range bounds, and unit preference
- Widget can format prices client-side using Intl.NumberFormat with real currency codes
- Widget can show placeholder hints and validate dimensions client-side before API calls
- New POST /api/v1/draft-orders endpoint enables checkout from headless storefronts
- Draft Order endpoint returns checkout URL (invoiceUrl) for customer purchase flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Add currency field and extend product matrix lookup** - `8d699d6` (feat)
2. **Task 2: Extend price API with currency, dimensionRange, and unit** - `dc51cbb` (feat)
3. **Task 3: Create POST /api/v1/draft-orders REST endpoint** - `ce325db` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added currency field to Store model (default: "USD")
- `prisma/migrations/20260206102751_add_store_currency/migration.sql` - Database migration
- `app/services/product-matrix-lookup.server.ts` - Extended ProductMatrixResult with dimensionRange, unit, currency; fetches store metadata
- `app/routes/api.v1.products.$productId.price.ts` - Extended response with real currency code, dimensionRange object, productMatrix.unit
- `app/validators/api.validators.ts` - Added DraftOrderSchema for request body validation
- `app/routes/api.v1.draft-orders.ts` - New POST endpoint for Draft Order creation via API key auth

## Decisions Made

**1. Currency field defaults to USD**
- Rationale: Most common default, merchants can configure via admin UI later
- Aligns with ISO 4217 standard currency codes

**2. Dimension ranges from breakpoint min/max values**
- Rationale: Widget needs bounds for placeholder text and client-side validation
- Calculated as first/last breakpoint value for each axis
- Zero fallback if no breakpoints exist

**3. REST Draft Order endpoint creates admin client from access token**
- Rationale: REST API requests lack embedded app session context
- Creates GraphQL client using store's access token directly
- Same pattern can be reused for other REST endpoints needing Shopify API access

**4. Draft Order mutation includes invoiceUrl**
- Rationale: Widget needs checkout URL to redirect customers
- invoiceUrl is customer-facing checkout link from Shopify
- Returned as checkoutUrl in API response for clarity

**5. DraftOrderSchema validates JSON body**
- Rationale: POST endpoints need structured validation (not query params)
- z.number() for width/height/quantity (already parsed from JSON)
- productId accepts both numeric and GID formats (normalized to GID)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Non-interactive Prisma migration**
- Problem: `prisma migrate dev` requires interactive environment
- Solution: Created migration file manually, applied with `prisma migrate deploy`
- Resolution: Migration applied successfully, schema synchronized

**2. Prisma client regeneration needed**
- Problem: TypeScript didn't recognize new currency field after schema change
- Solution: Ran `npx prisma generate` to regenerate client types
- Resolution: TypeScript compilation passed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for widget development:**
- Price API returns all metadata needed for client-side formatting (currency, unit, dimension ranges)
- Draft Order API provides complete checkout flow from external storefronts
- Both endpoints follow established patterns (CORS, rate limiting, RFC 7807 errors)

**Widget can now:**
- Format prices with correct currency using Intl.NumberFormat
- Show dimension input placeholders with min/max hints from dimensionRange
- Validate dimensions client-side before submitting to price API
- Create Draft Orders and redirect to Shopify checkout with invoiceUrl

**No blockers identified.**

---
*Phase: 05-react-widget*
*Completed: 2026-02-06*

## Self-Check: PASSED

All files created as documented:
- app/routes/api.v1.draft-orders.ts ✓

All commits exist in git history:
- 8d699d6 ✓
- dc51cbb ✓
- ce325db ✓
