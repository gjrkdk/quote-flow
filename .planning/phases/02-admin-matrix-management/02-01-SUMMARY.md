---
phase: 02-admin-matrix-management
plan: 01
subsystem: database-schema
status: complete
tags: [prisma, database, settings, unit-preference, postgresql]
requires:
  - 01-01 (Store model and database infrastructure)
provides:
  - PriceMatrix, Breakpoint, MatrixCell, ProductMatrix database tables
  - Unit preference setting (mm/cm) for store-wide measurement
affects:
  - 02-02 (Matrix creation UI will use these models)
  - 02-03 (Matrix editing will modify these models)
  - 02-04 (Product assignment will use ProductMatrix)
  - All subsequent phases (all pricing logic depends on these tables)
tech-stack:
  added: []
  patterns:
    - Position-based cell references (widthPosition/heightPosition instead of value-based)
    - Cascade deletes for data integrity (deleting matrix removes all related records)
    - Auto-save settings pattern with useFetcher (no page reload)
key-files:
  created:
    - prisma/migrations/20260204220146_add_matrix_models/migration.sql
  modified:
    - prisma/schema.prisma
    - app/routes/app.settings.tsx
decisions:
  - id: position-based-cells
    decision: Use position-based cell references (widthPosition/heightPosition) instead of value-based
    rationale: Simpler grid logic - cells reference their position in breakpoint arrays, not breakpoint values. When breakpoints are reordered or values change, cells stay correct as long as positions are maintained
    impact: All matrix UI and API code will work with positions, not raw dimension values
  - id: cascade-deletes
    decision: Configure ON DELETE CASCADE for all matrix relations
    rationale: Deleting a matrix should automatically clean up all breakpoints, cells, and product assignments
    impact: No orphaned records, simpler deletion logic in application code
  - id: one-matrix-per-product
    decision: Enforce unique constraint on ProductMatrix.productId
    rationale: MATRIX-06 requirement - each product can have only one matrix assigned
    impact: Database enforces business rule, prevents data integrity issues
  - id: auto-save-unit-preference
    decision: Auto-save unit preference on change (no separate save button)
    rationale: Simple single-field preference, standard pattern for toggles/selects
    impact: Better UX, immediate feedback, follows Polaris patterns
metrics:
  duration: 2min
  completed: 2026-02-04
---

# Phase 2 Plan 01: Database Schema & Settings Summary

**One-liner:** Added matrix database models (PriceMatrix, Breakpoint, MatrixCell, ProductMatrix) with cascade deletes and position-based cell references, plus Settings page for store-wide unit preference (mm/cm)

## What Was Built

### Database Schema (Task 1)
Created four new Prisma models for the matrix pricing system:

1. **PriceMatrix** - Main matrix entity
   - Links to Store with cascade delete
   - Has name, timestamps
   - Relations to breakpoints, cells, and products

2. **Breakpoint** - Width/height dimension breakpoints
   - Stores axis (width/height), value (dimension in store's unit), position (sort order)
   - Unique constraint prevents duplicate breakpoints per axis
   - Cascade deletes when matrix deleted

3. **MatrixCell** - Price per width x height intersection
   - Uses **position-based references** (widthPosition/heightPosition)
   - Stores price for each grid cell
   - Unique constraint ensures one price per intersection
   - Cascade deletes when matrix deleted

4. **ProductMatrix** - Product assignments
   - Links Shopify products to matrices (one matrix per product)
   - Caches productTitle to avoid API calls for display
   - Unique constraint on productId enforces MATRIX-06 requirement
   - Cascade deletes when matrix deleted

**Store model enhancement:**
- Added `unitPreference` field (defaults to "mm")
- Supports "mm" or "cm" for all matrices in the store

### Settings Page (Task 2)
Built functional unit preference selector:

- Polaris `Layout.AnnotatedSection` for proper settings layout
- `Select` component with mm/cm options
- Auto-save pattern using `useFetcher` (no page reload)
- Success banner that auto-dismisses after 3 seconds
- Validates unit values in action
- Disabled select during submission to prevent race conditions

## Technical Implementation

### Migration
- Created migration `20260204220146_add_matrix_models`
- Applied via `prisma migrate deploy`
- Added all foreign keys with CASCADE delete
- Added indexes for query performance (storeId, matrixId, axis)
- Added unique constraints for data integrity

### Settings Page Features
- Loader fetches current `unitPreference` from database
- Action handles `update-unit` intent with validation
- Uses Remix `useFetcher` for auto-save without navigation
- Success state managed with React useState and useEffect
- Banner auto-dismisses after 3 seconds

## Testing & Verification

All verification criteria passed:
- `npx prisma migrate status` - All migrations applied
- `npx prisma validate` - Schema valid
- TypeScript compilation successful
- Prisma client regenerated with new models

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

### Position-Based Cell References
**Decision:** Use `widthPosition` and `heightPosition` integers instead of storing actual dimension values.

**Why:** Simpler grid logic. When a merchant reorders breakpoints or changes a dimension value, cells stay correct as long as we maintain position consistency. This makes the grid UI simpler - cells are just a 2D array indexed by position.

**Impact:** All matrix UI will work with positions (0-indexed). When displaying to users, we'll look up the actual dimension value from the Breakpoint array using the position as the index.

### Cascade Deletes Everywhere
**Decision:** Configure `onDelete: Cascade` for all matrix relations.

**Why:** When a merchant deletes a matrix, all related data (breakpoints, cells, product assignments) should disappear automatically. This prevents orphaned records and simplifies application code - we never need to manually clean up relations.

**Impact:** Deletion is a single database operation. No application-level cleanup logic needed.

### One Matrix Per Product
**Decision:** Unique constraint on `ProductMatrix.productId`.

**Why:** MATRIX-06 requirement from phase research. Each product can have only one pricing matrix assigned. Database enforces this business rule.

**Impact:** Application code can rely on uniqueness - no need to check for multiple assignments. Attempting to assign a product to a second matrix will fail at database level with clear error.

### Auto-Save Unit Preference
**Decision:** Save immediately on select change, no separate save button.

**Why:** This is a simple single-field preference, not a complex form. Industry standard pattern for toggles and selects is immediate save with feedback.

**Impact:** Better UX - merchant sees "Settings saved" banner immediately. Follows Polaris design patterns. Uses `useFetcher` to avoid page reload.

## Next Phase Readiness

**Ready for Phase 2 Plan 02 (Matrix Creation):**
- Database models exist and are migrated
- Unit preference available for grid UI display
- Cascade deletes configured for safe cleanup

**No blockers.**

## Key Files Modified

### Created
- `prisma/migrations/20260204220146_add_matrix_models/migration.sql` - Database migration adding all matrix tables

### Modified
- `prisma/schema.prisma` - Added 4 models (PriceMatrix, Breakpoint, MatrixCell, ProductMatrix) and updated Store
- `app/routes/app.settings.tsx` - Complete Settings page with unit preference selector

## Performance Notes

**Duration:** 2 minutes
- Task 1 (schema): 1 min
- Task 2 (settings): 1 min

**Commits:** 2 atomic commits
- `1b9f746` - Database schema changes
- `c8e58fe` - Settings page implementation

## Success Criteria Met

- [x] Database has PriceMatrix, Breakpoint, MatrixCell, ProductMatrix tables with proper constraints
- [x] Store model has unitPreference field defaulting to "mm"
- [x] Settings page allows toggling between mm and cm
- [x] Cascade deletes configured (deleting a matrix removes its breakpoints, cells, and product assignments)

## Pattern Established: Position-Based Grid

This plan establishes the **position-based grid pattern** that will be used throughout the matrix UI:

```
Breakpoints are sorted arrays with positions:
- Width:  [100mm (pos 0), 200mm (pos 1), 300mm (pos 2)]
- Height: [150mm (pos 0), 250mm (pos 1)]

Cells reference positions, not values:
- Cell at (widthPosition: 1, heightPosition: 0) = 200mm x 150mm = $X.XX
```

This makes:
- Reordering simple (update position field)
- Value changes safe (positions stay stable)
- Grid UI straightforward (2D array indexed by position)
- Database queries efficient (index on position)

Future plans (matrix creation, editing) will implement UI around this pattern.
