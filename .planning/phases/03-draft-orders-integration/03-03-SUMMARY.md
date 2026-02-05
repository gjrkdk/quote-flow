---
phase: 03-draft-orders-integration
plan: 03
subsystem: draft-order-creation
tags: [shopify-graphql, draft-orders, exponential-backoff, test-ui, dashboard]

requires:
  - "03-01 (Price Calculator Service) - calculatePrice and validateDimensions functions"
  - "03-02 (Database Schema) - DraftOrderRecord model and Store counter"
provides:
  - "Draft Order creation service with Shopify GraphQL integration and retry logic"
  - "Test Draft Order UI on matrix edit page for merchant verification"
  - "Dashboard counter showing total Draft Orders created"
affects:
  - "Phase 4 (REST API) - will use createDraftOrder for order creation endpoint"
  - "Phase 5 (React Widget) - add-to-cart flow will use Draft Order creation"

tech-stack:
  added:
    - exponential-backoff: "Retry library for Shopify API rate limit handling"
  patterns:
    - "Custom line items (title + originalUnitPrice) for custom pricing in Draft Orders"
    - "Separate useFetcher for independent form submissions in same route"
    - "Prisma transaction for atomic record creation + counter increment"

key-files:
  created:
    - "app/services/draft-order.server.ts": "Draft Order creation service (348 lines)"
  modified:
    - "app/routes/app.matrices.$id.edit.tsx": "Added test Draft Order card UI and action handler"
    - "app/routes/app._index.tsx": "Added Draft Orders created counter to dashboard"
    - "package.json": "Added exponential-backoff dependency"

key-decisions:
  - id: "custom-line-item-pricing"
    decision: "Use custom line items (title + originalUnitPrice) instead of variantId for Draft Orders"
    rationale: "Shopify ignores originalUnitPrice when variantId is present. Custom line items give full control over pricing."
    alternatives: "variantId + appliedDiscount (complex, can't handle markups)"
  - id: "dimensions-as-display-unit"
    decision: "Pass dimensions to price calculator in merchant's display unit (same as breakpoints)"
    rationale: "Breakpoints are stored in display unit (mm or cm). No conversion needed for price calculation."
    alternatives: "Convert to mm internally (caused unit mismatch bug)"
  - id: "separate-fetcher-pattern"
    decision: "Use separate useFetcher for test Draft Order flow"
    rationale: "Prevents interference with existing save/product fetchers on same route"
    alternatives: "Share fetcher with intent discrimination (risk of UI state conflicts)"

metrics:
  completed: "2026-02-05"
---

# Phase 03 Plan 03: Draft Order Creation Service Summary

**One-liner:** Shopify Draft Order creation via GraphQL with custom matrix pricing, test UI on matrix edit page, and dashboard counter

## Performance

**Commits:** 4 (2 feat + 2 fix)
**Tests:** Human-verified end-to-end (Draft Order #D17 confirmed correct $300 price)

## Accomplishments

Built the complete Draft Order creation flow connecting price calculator, database, and Shopify GraphQL API. Added test UI on matrix edit page for merchant verification and dashboard counter for tracking.

**Key Features Delivered:**
1. `createDraftOrder()` service - loads matrix, validates dimensions, calculates price, creates Shopify Draft Order with retry logic, saves local record
2. Test Draft Order card on matrix edit page - product selector, dimension inputs, create button, result banners
3. Dashboard counter showing total Draft Orders created (conditionally visible)
4. Exponential backoff retry for Shopify API rate limits (3 attempts, jitter)
5. Prisma transaction for atomic record creation + counter increment

## Task Commits

| Task | Type | Description | Commit | Files |
|------|------|-------------|--------|-------|
| 1 | feat | Draft Order service with retry logic | d831da6 | draft-order.server.ts, package.json |
| 2 | feat | Test Draft Order UI and dashboard counter | 9f8c4bb | app.matrices.$id.edit.tsx, app._index.tsx |
| fix | fix | Unit mismatch in price calculation | c116c06 | app.matrices.$id.edit.tsx, draft-order.server.ts |
| fix | fix | Use custom line items for correct pricing | ad3aead | draft-order.server.ts |

## Files Created/Modified

**Created:**
- `app/services/draft-order.server.ts` - Draft Order creation service

**Modified:**
- `app/routes/app.matrices.$id.edit.tsx` - Added test Draft Order card UI and action handler
- `app/routes/app._index.tsx` - Added Draft Orders created counter to dashboard
- `package.json` - Added exponential-backoff dependency

## Decisions Made

### 1. Custom Line Items for Pricing Control
**Decision:** Use `title` + `originalUnitPrice` (custom line item) instead of `variantId` for Draft Order line items
**Rationale:** Shopify ignores `originalUnitPrice` when `variantId` is present — this is documented Shopify API behavior. Custom line items give full control over pricing.
**Impact:** Draft Orders show correct matrix-calculated price instead of product variant's default price

### 2. Dimensions in Display Unit (No Conversion)
**Decision:** Pass dimensions directly to price calculator without mm/cm conversion
**Rationale:** Breakpoints are stored in the merchant's display unit. Converting dimensions would create a unit mismatch.
**Impact:** Fixed pricing bug where 35cm was being converted to 350mm and compared against cm breakpoints

### 3. Separate Fetcher for Test Flow
**Decision:** Use dedicated `useFetcher` for the test Draft Order form
**Rationale:** Matrix edit page already has fetchers for save and product operations. A separate fetcher prevents state interference.

## Deviations from Plan

### Bug Fixes During Human Verification

**1. [Blocking] Shopify Protected Customer Data Access**
- **Issue:** "This app is not approved to access the DraftOrder object" error
- **Fix:** User requested access in Shopify Partner Dashboard (Store management + App functionality reasons)
- **Impact:** Required manual Partner Dashboard configuration

**2. [Blocking] Unit Mismatch in Price Calculation**
- **Issue:** Action handler converted cm→mm before passing to createDraftOrder, but breakpoints stored in cm
- **Fix:** Removed conversion, pass dimensions as-is (commit c116c06)

**3. [Blocking] originalUnitPrice Ignored with variantId**
- **Issue:** Shopify ignores `originalUnitPrice` when `variantId` is present in line item
- **Fix:** Changed to custom line item with `title` + `originalUnitPrice` (commit ad3aead)

## Issues Encountered

### Shopify API Behavior: originalUnitPrice + variantId
The most significant issue was discovering that Shopify's DraftOrderLineItemInput ignores `originalUnitPrice` when `variantId` is provided. This is a known but easily missed API behavior documented in the Shopify community forums. The solution uses custom line items which fully support `originalUnitPrice`.

## Next Phase Readiness

**Ready for Phase 4 (Public REST API):** Yes

**What Phase 4 Needs:**
1. Import `createDraftOrder` from `app/services/draft-order.server.ts`
2. Create REST endpoint at `/api/v1/products/:id/price`
3. Authenticate via X-API-Key header (match against store's apiKeyHash)
4. Return price calculation results and optionally create Draft Orders
5. Rate limiting strategy decision (in-memory vs Redis)

**Lessons for Phase 4:**
- Use custom line items (not variantId) when creating Draft Orders via API
- Dimensions should be in merchant's display unit (same as breakpoints)
- exponential-backoff library already installed for Shopify API retry logic

---

**Summary created:** 2026-02-05
**Phase status:** 03-03 complete, Phase 3 fully complete
