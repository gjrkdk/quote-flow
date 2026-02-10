---
phase: 13-rest-api-extension
plan: 02
subsystem: rest-api, draft-orders, option-pricing
tags: [rest-api, option-groups, price-calculation, draft-orders, backward-compatibility]

dependency_graph:
  requires:
    - phase-13-01 (option selection validation schemas and service)
    - phase-11 (option groups data model)
    - phase-12 (option groups admin UI)
  provides:
    - Price endpoint with option selections and breakdown
    - Draft orders endpoint with option selections and custom attributes
    - Option metadata storage in DraftOrderRecord
  affects:
    - Future: Phase 13-03 (widget integration will consume these extended APIs)

tech_stack:
  added:
    - prisma/migrations/20260210205133_add_option_selections_to_draft_orders (schema migration)
  patterns:
    - Optional parameter pattern (backward compatibility via optional options)
    - Response format bifurcation (add fields when options present, omit when absent)
    - Option metadata transformation (ID pairs to name/label pairs for Shopify)
    - Prisma Json type for flexible option storage

key_files:
  created:
    - prisma/migrations/20260210205133_add_option_selections_to_draft_orders/migration.sql
  modified:
    - app/routes/api.v1.products.$productId.price.ts (116 lines added, GET with options)
    - app/routes/api.v1.draft-orders.ts (107 lines added, POST with options)
    - app/services/draft-order.server.ts (27 lines added, option custom attributes)
    - prisma/schema.prisma (1 field added, optionSelections Json?)

decisions:
  - decision: "Store option selections as JSON in DraftOrderRecord rather than normalized relations"
    rationale: "Simpler schema, captures point-in-time snapshot, options may change after order creation"
  - decision: "Transform option IDs to names/labels for Shopify custom attributes"
    rationale: "Human-readable attributes in Shopify admin, IDs would be meaningless to merchants"
  - decision: "Include basePrice and optionModifiers in response only when options provided"
    rationale: "Maintain byte-identical backward compatibility for existing clients without options"
  - decision: "Build option metadata array during price calculation rather than separate loop"
    rationale: "Avoid duplicate iteration over validatedGroups, single-pass efficiency"

metrics:
  duration_seconds: 208
  tasks_completed: 2
  files_modified: 4
  completed_date: 2026-02-10
---

# Phase 13 Plan 02: REST API Extension Summary

**One-liner:** Extended price and draft orders REST endpoints to accept optional option selections, validate against assigned groups, calculate modified prices, and return detailed breakdowns with full backward compatibility.

## What Was Built

Extended both REST API endpoints to support option group pricing:

1. **Price Endpoint Extensions** (`app/routes/api.v1.products.$productId.price.ts`):
   - Accept optional `options` query parameter as JSON-encoded string
   - Parse and validate JSON with OptionSelectionsSchema (max 5 selections)
   - Validate selections using validateOptionSelections service
   - Build PriceModifier array from validated groups and choices
   - Calculate modified price using calculatePriceWithOptions
   - Return extended response with basePrice, optionModifiers[], and modified price/total
   - Maintain identical response format when no options provided (backward compatible)

2. **Draft Orders Endpoint Extensions** (`app/routes/api.v1.draft-orders.ts`):
   - Accept optional `options` array in POST body (direct array, not JSON string)
   - Validate selections using validateOptionSelections service
   - Calculate modified price with option modifiers
   - Build option metadata array (name/label pairs) for Draft Order
   - Pass metadata to submitDraftOrder service
   - Return extended response with basePrice and optionModifiers when options used
   - Maintain identical response format when no options provided (backward compatible)

3. **Draft Order Service Extensions** (`app/services/draft-order.server.ts`):
   - Add optional `options` field to SubmitDraftOrderInput interface
   - Build custom attributes array including Width, Height, and option selections
   - Pass option custom attributes to Shopify Draft Order GraphQL mutation
   - Store optionSelections as JSON in local DraftOrderRecord

4. **Database Schema Migration**:
   - Add `optionSelections Json?` field to DraftOrderRecord model
   - Create migration: `20260210205133_add_option_selections_to_draft_orders`
   - Stores option metadata as JSON for point-in-time snapshot

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Upstream Dependencies:**
- `validateOptionSelections` from `option-validator.server.ts` (Phase 13-01)
- `calculatePriceWithOptions` from `option-price-calculator.server.ts` (Phase 13-01)
- `PriceQueryWithOptionsSchema`, `DraftOrderWithOptionsSchema` from `api.validators.ts` (Phase 13-01)
- Prisma types: `OptionGroup`, `OptionChoice` from Phase 11 schema

**Downstream Usage:**
- Phase 13-03 (widget integration) will call these extended endpoints
- External API consumers can now submit option selections with price/order requests
- Draft Orders in Shopify admin show option selections as custom attributes alongside dimensions

## Technical Implementation

**Backward Compatibility Strategy:**
- Optional parameters: `options` is optional in both endpoints
- Response format bifurcation: when no options, response identical to Phase 4/5 format
- When options provided, add `basePrice` and `optionModifiers` fields
- Existing clients without option support continue working unchanged

**Option Metadata Transformation:**
- REST API receives option selections as ID pairs (optionGroupId + choiceId)
- Validator service returns full validated groups with choices
- Endpoints extract names/labels from validated data
- Draft Order custom attributes use human-readable "GroupName: ChoiceLabel" format
- Local DraftOrderRecord stores original name/label metadata as JSON

**Price Calculation Flow:**
1. Calculate base price from matrix (always, even with options)
2. If options provided:
   - Build PriceModifier[] from validated groups
   - Call calculatePriceWithOptions (non-compounding, ceiling rounding)
   - Use modified price as unit price
3. If no options: use base price as unit price
4. Response includes breakdown when options used

**Data Storage:**
- Shopify Draft Order: option selections as custom attributes (visible in admin)
- Local DraftOrderRecord: option selections as JSON (point-in-time snapshot)
- No normalized relations (simpler, captures state at order creation time)

## Verification Results

All success criteria met:

- [x] Both endpoints accept option selections and return modified prices
- [x] Both endpoints validate selections against product's assigned groups
- [x] Draft Orders include option metadata as custom attributes
- [x] Local records store option selections as JSON
- [x] Backward compatibility maintained (existing clients work unchanged)
- [x] All prices calculated using integer cents arithmetic
- [x] TypeScript compilation passes (existing errors unrelated to changes)
- [x] Prisma migration created successfully

## API Examples

**Price endpoint with options:**
```
GET /api/v1/products/12345/price?width=100&height=200&quantity=1&options=%5B%7B%22selections%22%3A%5B%7B%22optionGroupId%22%3A%22opt_123%22%2C%22choiceId%22%3A%22choice_456%22%7D%5D%7D%5D

Response:
{
  "basePrice": 1000,
  "optionModifiers": [
    {
      "optionGroup": "Glass Type",
      "choice": "Tempered",
      "modifierType": "PERCENTAGE",
      "modifierValue": 1500,
      "appliedAmount": 150
    }
  ],
  "price": 1150,
  "currency": "USD",
  "dimensions": {"width": 100, "height": 200, "unit": "cm"},
  "quantity": 1,
  "total": 1150,
  "matrix": "Standard Glass",
  "dimensionRange": "10-500cm"
}
```

**Draft orders with options:**
```
POST /api/v1/draft-orders
{
  "productId": "12345",
  "width": 100,
  "height": 200,
  "quantity": 1,
  "options": [
    {"optionGroupId": "opt_123", "choiceId": "choice_456"}
  ]
}

Response:
{
  "draftOrderId": "gid://shopify/DraftOrder/789",
  "name": "#D1",
  "checkoutUrl": "https://...",
  "total": "11.50",
  "basePrice": 1000,
  "optionModifiers": [...],
  "price": 1150,
  "dimensions": {"width": 100, "height": 200, "unit": "cm"},
  "quantity": 1
}
```

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 1bc7663 | feat(13-02): extend price endpoint with option selections and breakdown |
| 2 | c904a74 | feat(13-02): extend draft orders endpoint and service with option support |

## Next Steps

Phase 13-03 will:
1. Extend pricing widget to display option groups
2. Integrate with extended REST endpoints
3. Send option selections on price lookup and draft order creation
4. Display price breakdown with option modifiers in UI

## Self-Check: PASSED

**Created files verified:**
- prisma/migrations/20260210205133_add_option_selections_to_draft_orders/migration.sql: EXISTS

**Modified files verified:**
- app/routes/api.v1.products.$productId.price.ts: MODIFIED (116 lines added)
- app/routes/api.v1.draft-orders.ts: MODIFIED (107 lines added)
- app/services/draft-order.server.ts: MODIFIED (27 lines added)
- prisma/schema.prisma: MODIFIED (optionSelections field added)

**Commits verified:**
- 1bc7663: FOUND (Task 1 - price endpoint)
- c904a74: FOUND (Task 2 - draft orders endpoint and service)

**Integration verified:**
- PriceQueryWithOptionsSchema imported and used
- DraftOrderWithOptionsSchema imported and used
- validateOptionSelections called in both endpoints
- calculatePriceWithOptions called in both endpoints
- optionSelections field added to DraftOrderRecord
