---
phase: 13-rest-api-extension
plan: 01
subsystem: api-validators, option-validation
tags: [validation, business-rules, option-groups, zod-schemas]

dependency_graph:
  requires:
    - phase-11 (option groups data model)
    - phase-12 (option groups admin UI)
  provides:
    - Option selection validation schemas (OptionSelectionSchema, OptionSelectionsSchema)
    - Extended price and draft order schemas with option support
    - Business rule validator service (validateOptionSelections)
  affects:
    - Future: Phase 13-02 (price and draft orders endpoints will use these validators)

tech_stack:
  added:
    - app/validators/api.validators.ts extensions (4 new schemas)
    - app/services/option-validator.server.ts (new service)
  patterns:
    - Zod schema extension pattern (PriceQuerySchema.extend)
    - Service-layer business rule validation
    - Efficient lookup structures (Maps and Sets)
    - Return validated data to avoid re-fetching

key_files:
  created:
    - app/services/option-validator.server.ts (146 lines, validateOptionSelections service)
  modified:
    - app/validators/api.validators.ts (41 lines added, 4 new schemas + TypeScript types)

decisions: []

metrics:
  duration_seconds: 101
  tasks_completed: 2
  files_modified: 2
  completed_date: 2026-02-10
---

# Phase 13 Plan 01: Option Selection Validation Summary

**One-liner:** Zod schemas for option selections with service-layer business rule validator for product assignment, choice membership, one-per-group, and required group enforcement.

## What Was Built

Created validation foundation for option selections in REST API endpoints:

1. **API Validators Extensions** (`app/validators/api.validators.ts`):
   - `OptionSelectionSchema` - validates optionGroupId + choiceId pairs
   - `OptionSelectionsSchema` - wrapper for JSON-encoded GET query params (max 5 selections)
   - `PriceQueryWithOptionsSchema` - extends PriceQuerySchema with optional options string
   - `DraftOrderWithOptionsSchema` - extends DraftOrderSchema with optional options array
   - Exported TypeScript types for all schemas
   - Preserved existing schemas unchanged for backward compatibility

2. **Option Validator Service** (`app/services/option-validator.server.ts`):
   - `validateOptionSelections` function with comprehensive business rule enforcement
   - Rule 1: Product exists and authorized for store
   - Rule 2: All selected groups assigned to product
   - Rule 3: All selected choices belong to their groups
   - Rule 4: At most one selection per option group
   - Rule 5: All REQUIRED groups must have selections
   - Returns validated groups to avoid re-fetching in downstream code
   - Uses Maps and Sets for O(1) lookup performance
   - Human-readable error messages with group/choice names

## Deviations from Plan

None - plan executed exactly as written.

## Integration Points

**Upstream Dependencies:**
- `getProductOptionGroups` from `option-group.server.ts` (Phase 11)
- Prisma types: `OptionGroup`, `OptionChoice` from Phase 11 schema

**Downstream Usage:**
- Phase 13-02 will use `validateOptionSelections` in price and draft orders endpoints
- `PriceQueryWithOptionsSchema` ready for price endpoint
- `DraftOrderWithOptionsSchema` ready for draft orders endpoint
- `validatedGroups` return value eliminates need for re-fetching in price calculations

## Technical Implementation

**Schema Design:**
- GET endpoint uses JSON-encoded string (`options` parameter)
- POST endpoint uses direct array in body (`options` array)
- Both enforce max 5 selections (aligns with product cap from Phase 12)
- Zod `.extend()` pattern preserves original schemas for backward compatibility

**Validation Logic:**
- Single-pass validation with efficient data structures
- Build Maps once, perform O(1) lookups
- Fail-fast approach (return on first error)
- Descriptive errors reference group names, not just IDs

**Performance Considerations:**
- Validator returns `validatedGroups` to avoid duplicate DB queries
- Price calculator can use returned groups directly
- Map-based lookups scale to 5 groups efficiently

## Verification Results

All success criteria met:

- [x] 7 schema exports in api.validators.ts (3 original + 4 new)
- [x] option-validator.server.ts exports validateOptionSelections
- [x] validateOptionSelections imports getProductOptionGroups
- [x] All validation errors use human-readable names (group?.name fallback)
- [x] TypeScript types exported and available
- [x] Original schemas unchanged (backward compatibility)
- [x] No new dependencies added

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 28e348f | feat(13-01): extend API validators with option selection schemas |
| 2 | 32a0527 | feat(13-01): create option validator service with business rule validation |

## Next Steps

Phase 13-02 will:
1. Extend price endpoint to accept option selections
2. Integrate with option-price-calculator service
3. Extend draft orders endpoint with option support
4. Use `validateOptionSelections` before price calculation/order creation

## Self-Check: PASSED

**Created files verified:**
- app/services/option-validator.server.ts: EXISTS
- app/validators/api.validators.ts: MODIFIED (verified 41 lines added)

**Commits verified:**
- 28e348f: FOUND (Task 1)
- 32a0527: FOUND (Task 2)

**Exports verified:**
- OptionSelectionSchema: EXPORTED
- OptionSelectionsSchema: EXPORTED
- PriceQueryWithOptionsSchema: EXPORTED
- DraftOrderWithOptionsSchema: EXPORTED
- validateOptionSelections: EXPORTED
