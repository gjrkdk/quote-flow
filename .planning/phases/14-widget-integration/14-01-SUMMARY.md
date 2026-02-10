---
phase: 14-widget-integration
plan: 01
subsystem: widget-api
tags: [rest-api, widget-types, option-groups]
dependency_graph:
  requires:
    - Phase 13 REST API extension (option selections support in price/draft-order endpoints)
    - Phase 12 option group assignment UI
    - Phase 11 option groups service layer
  provides:
    - REST endpoint for widget to discover product option groups
    - Widget type system for option groups and selections
  affects:
    - Widget Plans 02 and 03 (will consume these types and endpoint)
tech_stack:
  added:
    - GET /api/v1/products/:productId/options endpoint
  patterns:
    - CORS preflight handling (consistent with existing REST API routes)
    - API key authentication via X-API-Key header
    - Rate limiting (100 req/15min per store)
    - RFC 7807 error responses
    - Graceful empty array response for missing/unauthorized products
key_files:
  created:
    - app/routes/api.v1.products.$productId.options.ts
  modified:
    - packages/widget/src/types.ts
decisions:
  - Return empty array (not 404) for products without option groups - widget should handle empty state gracefully
  - Place all option types in internal section of widget types file - not exported to consumers
  - Extend PriceApiResponse and DraftOrderApiResponse with optional fields - backward compatible
metrics:
  duration: 102
  tasks_completed: 2
  files_modified: 2
  commits: 2
  completed_date: 2026-02-10
---

# Phase 14 Plan 01: REST API & Widget Types Summary

REST endpoint for widget to discover option groups, plus foundational types for option group rendering and selection.

## Tasks Completed

### Task 1: Create GET /api/v1/products/:productId/options REST endpoint
**Commit:** cefe36f

Created new Remix resource route following exact patterns from existing REST API endpoints:

**CORS handling:**
- Preflight OPTIONS request returns 204
- Access-Control-Allow-Origin: * (widget can call from any origin)
- Access-Control-Allow-Methods: GET, OPTIONS
- Access-Control-Allow-Headers: X-API-Key, Content-Type

**Authentication & rate limiting:**
- API key authentication via `authenticateApiKey(request)` from `~/utils/api-auth.server`
- Rate limiting via `checkRateLimit(store.id)` - 100 requests per 15 min window per store
- Rate limit headers added to all responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

**Product ID validation:**
- Uses `ProductIdSchema` and `normalizeProductId` from `~/validators/api.validators`
- Supports both numeric and gid:// formats
- RFC 7807 error response (400) for invalid format

**Option groups fetching:**
- Calls `getProductOptionGroups(normalizedProductId, store.id)` from `~/services/option-group.server`
- Returns `{ optionGroups: [] }` with 200 status for:
  - Product not found
  - Product unauthorized (belongs to different store)
  - Product has no option groups assigned
- Widget should not distinguish between these cases - just render empty state

**Response format:**
```json
{
  "optionGroups": [
    {
      "id": "og_...",
      "name": "Size",
      "requirement": "REQUIRED",
      "choices": [
        {
          "id": "choice_...",
          "label": "Small",
          "modifierType": "FIXED",
          "modifierValue": 500,
          "isDefault": false
        }
      ]
    }
  ]
}
```

**Error handling:**
- RFC 7807 format for all error responses
- 400 for invalid product ID
- 401 for missing/invalid API key (handled by authenticateApiKey)
- 405 for non-GET methods (action export)
- 429 for rate limit exceeded (handled by checkRateLimit)
- 500 for unexpected errors
- All error responses include CORS headers

**Files created:**
- `app/routes/api.v1.products.$productId.options.ts` (140 lines)

### Task 2: Extend widget type system with option group types
**Commit:** 2ae87a6

Extended `packages/widget/src/types.ts` with option-related types in the internal section (not exported to consumers):

**Core option types:**
1. `OptionGroup` - option group assigned to a product
   - `id: string`
   - `name: string`
   - `requirement: 'REQUIRED' | 'OPTIONAL'`
   - `choices: OptionChoice[]`

2. `OptionChoice` - choice within an option group
   - `id: string`
   - `label: string`
   - `modifierType: 'FIXED' | 'PERCENTAGE'`
   - `modifierValue: number` (cents for FIXED, basis points for PERCENTAGE)
   - `isDefault: boolean`

3. `OptionSelection` - user's selection for an option group
   - `optionGroupId: string`
   - `choiceId: string`

**API response types:**
4. `OptionGroupsApiResponse` - response from GET /api/v1/products/:productId/options
   - `optionGroups: OptionGroup[]`

5. `OptionModifierInfo` - price breakdown for applied modifiers
   - `optionGroup: string` (group name)
   - `choice: string` (choice label)
   - `modifierType: 'FIXED' | 'PERCENTAGE'`
   - `modifierValue: number` (original modifier value)
   - `appliedAmount: number` (actual cents applied)

**Extended existing types (backward compatible):**
- `PriceApiResponse` - added optional fields:
  - `basePrice?: number` (base price before modifiers)
  - `optionModifiers?: OptionModifierInfo[]` (breakdown of applied modifiers)

- `DraftOrderApiResponse` - added same optional fields:
  - `basePrice?: number`
  - `optionModifiers?: OptionModifierInfo[]`

These optional fields are only included when options are provided in the request. Existing widget consumers that don't use options will not see these fields.

**Files modified:**
- `packages/widget/src/types.ts` (+56 lines)

## Verification

All verification checks passed:

1. TypeScript compiles without errors: `npx tsc --noEmit` from project root
2. Widget TypeScript compiles: `cd packages/widget && npx tsc --noEmit`
3. New route file follows same patterns as existing API routes:
   - CORS helper function (`withCors`)
   - Authentication via `authenticateApiKey`
   - Rate limiting via `checkRateLimit` and `getRateLimitHeaders`
   - RFC 7807 error responses
   - OPTIONS preflight handling
   - 405 for non-GET methods via action export

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria

All success criteria met:

- [x] REST API endpoint `GET /api/v1/products/:productId/options` is implemented and type-checks
- [x] Widget types include all option-related interfaces needed for Plans 02 and 03
- [x] Both backward-compatible (PriceApiResponse/DraftOrderApiResponse extended with optional fields)

## Next Steps

Phase 14 Plan 02 will implement the widget UI for rendering option groups and collecting user selections. The types and endpoint created in this plan provide the foundation for that work.

## Self-Check

Verifying all claimed artifacts exist:

**Files:**
- FOUND: app/routes/api.v1.products.$productId.options.ts
- FOUND: packages/widget/src/types.ts

**Commits:**
- FOUND: cefe36f (Task 1: REST endpoint)
- FOUND: 2ae87a6 (Task 2: Widget types)

**Result:** PASSED - All artifacts verified
