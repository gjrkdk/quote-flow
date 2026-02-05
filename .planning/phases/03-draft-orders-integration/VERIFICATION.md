---
phase: 03-draft-orders-integration
verified: 2026-02-05T15:48:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 3: Draft Orders Integration Verification Report

**Phase Goal:** Calculated matrix prices create valid Shopify orders with custom locked pricing
**Verified:** 2026-02-05T15:48:00Z
**Status:** PASSED
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Price calculator returns correct price for exact and between-breakpoint dimensions | VERIFIED | 25/25 tests pass (vitest run confirms). Pure function with breakpoint lookup, round-up, and clamping. `app/services/price-calculator.server.ts` (114 lines). |
| 2 | Draft Order creation via Shopify GraphQL API uses custom line item with matrix-calculated price | VERIFIED | `app/services/draft-order.server.ts` (349 lines) uses `title` + `originalUnitPrice` (line 208) instead of `variantId` to ensure Shopify respects custom pricing. GraphQL `draftOrderCreate` mutation confirmed (line 225). |
| 3 | Merchant can enter dimensions in test UI and create a real Draft Order | VERIFIED | `app/routes/app.matrices.$id.edit.tsx` has "Test Draft Order" card (lines 948-1051) with product Select, Width/Height/Quantity TextFields, and "Create Test Draft Order" Button. Action handler at intent `create-test-draft-order` (lines 449-522) calls `createDraftOrder()`. Separate `useFetcher` (line 570) prevents interference with save operations. |
| 4 | Draft Order record is saved locally with atomic counter increment | VERIFIED | `draft-order.server.ts` lines 297-324: Prisma `$transaction` creates `draftOrderRecord` and increments `store.totalDraftOrdersCreated` atomically. |
| 5 | Dashboard shows Draft Orders created count | VERIFIED | `app/routes/app._index.tsx` loads `totalDraftOrdersCreated` (line 48), conditionally renders counter card when > 0 (lines 224-243) with tag filter guidance. |
| 6 | Shopify API failures are retried with exponential backoff | VERIFIED | `draft-order.server.ts` uses `backOff` from `exponential-backoff` (line 220) with 3 attempts, 1s starting delay, 2x multiplier, 5s max, full jitter. Retry only on 429/RATE_LIMITED errors (lines 273-279). |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/services/price-calculator.server.ts` | Price calculation with breakpoint lookup | VERIFIED (114 lines, exported `calculatePrice` + `validateDimensions` + `MatrixData`, imported by `draft-order.server.ts`) | Substantive pure function implementation. No stubs, no TODOs. |
| `app/services/price-calculator.server.test.ts` | 25 test cases for all edge cases | VERIFIED (195 lines, 25/25 tests passing) | Covers exact match, round-up, clamp below, clamp above, missing cell, decimal values. |
| `app/services/draft-order.server.ts` | Draft Order creation with Shopify GraphQL | VERIFIED (349 lines, exported `createDraftOrder`, imported by edit route) | Full implementation: matrix load, validation, price calculation, variant query, GraphQL mutation with retry, local record saving. |
| `app/routes/app.matrices.$id.edit.tsx` | Test Draft Order UI card | VERIFIED (1057 lines, contains `create-test-draft-order` intent) | Test card at bottom of edit page with product selector, dimension inputs, create button, success/error banners. |
| `app/routes/app._index.tsx` | Dashboard with Draft Orders counter | VERIFIED (305 lines, contains `totalDraftOrdersCreated`) | Conditional counter display when > 0, with guidance to filter by "price-matrix" tag in Shopify admin. |
| `prisma/schema.prisma` | DraftOrderRecord model + Store counter | VERIFIED (109 lines, model DraftOrderRecord with 13 fields) | Cascade deletes on Store and PriceMatrix relations. Three indexes (storeId, matrixId, shopifyDraftOrderId). |
| `prisma/migrations/20260205122320_add_draft_order_records/migration.sql` | Migration for new table and column | VERIFIED (37 lines) | Creates DraftOrderRecord table, adds totalDraftOrdersCreated to Store, creates indexes and foreign keys with CASCADE. |
| `vitest.config.ts` | Test framework configuration | VERIFIED (8 lines) | Node environment configured for server-side tests. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app.matrices.$id.edit.tsx` | `draft-order.server.ts` | `import { createDraftOrder }` + action handler calling it | WIRED | Import on line 21, called on line 502 within `create-test-draft-order` intent handler. |
| `draft-order.server.ts` | `price-calculator.server.ts` | `import { calculatePrice, validateDimensions, MatrixData }` | WIRED | Import on lines 10-14, `validateDimensions` called on line 161, `calculatePrice` called on line 172. |
| `draft-order.server.ts` | Shopify GraphQL API | `admin.graphql` with `draftOrderCreate` mutation | WIRED | Mutation on line 224-240, wrapped in `backOff` retry, response parsed and userErrors checked. |
| `draft-order.server.ts` | `prisma.draftOrderRecord` | `tx.draftOrderRecord.create` in `$transaction` | WIRED | Record created on line 299, counter incremented on line 316, within atomic transaction (line 297). |
| `app._index.tsx` loader | `store.totalDraftOrdersCreated` | `ensureStoreExists` returns store with counter field | WIRED | Counter loaded via `ensureStoreExists` (line 37-40), returned in JSON (line 48), rendered in JSX (line 238). |
| Form submission | Action handler | `testFetcher.submit` with `create-test-draft-order` intent | WIRED | Form data submitted on line 879, intent matched on line 449, dimensions parsed and passed to service. |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| ORDER-01: Draft Order created via Shopify GraphQL API with custom locked price | SATISFIED | `createDraftOrder()` creates Draft Order via `draftOrderCreate` mutation with custom line item (`title` + `originalUnitPrice`). Human verified: Draft Order #D17 in Shopify admin shows $300.00 (matrix price), not product default $600. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `draft-order.server.ts` | 72 | `return null` in `getProductVariant` | Info | Legitimate error return when GraphQL errors occur -- not a stub pattern. Function properly returns null which is handled by caller (line 187-193). |
| `draft-order.server.ts` | 71, 326 | `console.error` | Info | Legitimate error logging for GraphQL failures and DB transaction failures. Not placeholder implementations. |

No blocker or warning anti-patterns found. No TODO/FIXME/placeholder patterns in any Phase 3 files.

### Human Verification Required

Human verification was already completed during plan execution:

### 1. Draft Order Appears in Shopify Admin with Correct Price

**Test:** Create a Draft Order via the test UI with matrix dimensions.
**Expected:** Draft Order appears in Shopify admin under Orders > Drafts with custom matrix price (not product default).
**Status:** COMPLETED -- Draft Order #D17 confirmed with $300.00 price (product default was $600). Dimensions shown as custom attributes (Width: 60mm, Height: 52mm). Tag "price-matrix" applied.

### 2. Completed Draft Order Preserves Custom Price

**Test:** Complete the Draft Order through Shopify admin to create a real order.
**Expected:** The real order has the locked custom price from the matrix, not the product's standard price.
**Why human:** Requires Shopify admin interaction to complete checkout flow. Cannot verify programmatically.
**Status:** This specific sub-test was noted as optional in the plan. The core verification (Draft Order with correct price) was confirmed.

### 3. Dashboard Counter Updates

**Test:** Navigate to dashboard after creating Draft Order.
**Expected:** "Draft Orders Created" counter shows >= 1.
**Status:** COMPLETED -- Dashboard counter confirmed visible and incrementing.

### Gaps Summary

No gaps found. All 6 observable truths are verified. All required artifacts exist, are substantive (well above minimum line counts), and are properly wired. All key links are connected. The single requirement (ORDER-01) is satisfied with human verification evidence.

Key technical decisions validated in code:
- Custom line items (`title` + `originalUnitPrice`) used instead of `variantId` because Shopify ignores `originalUnitPrice` when `variantId` is present (documented in code comment at line 201-202 of draft-order.server.ts)
- Dimensions passed in merchant's display unit without conversion (matching breakpoint storage unit)
- Exponential backoff retry configured to only retry on 429/rate limit errors, not on userErrors
- Atomic Prisma transaction for record creation + counter increment

---

_Verified: 2026-02-05T15:48:00Z_
_Verifier: Claude (gsd-verifier)_
