---
phase: 11-data-model-price-calculation
plan: 03
subsystem: business-logic
tags: [tdd, price-calculation, integer-arithmetic, option-modifiers]
dependency_graph:
  requires: [prisma-schema, option-group-models]
  provides: [option-price-calculator, modifier-calculation, price-breakdown]
  affects: [price-calculator-service]
tech_stack:
  added: [basis-points, ceiling-rounding, non-compounding-modifiers]
  patterns: [tdd, pure-functions, integer-arithmetic, jsoc-documentation]
key_files:
  created:
    - app/services/option-price-calculator.server.ts
    - app/services/option-price-calculator.server.test.ts
  modified: []
decisions:
  - key: "Ceiling rounding for percentage modifiers"
    choice: "Math.ceil rounds toward positive infinity"
    rationale: "Favorable to merchant, consistent behavior for both positive and negative percentages"
    alternatives: ["Floor rounding", "Banker's rounding"]
    impact: "Edge case handling for fractional cents"
  - key: "Non-compounding modifier stacking"
    choice: "All modifiers calculate from base price"
    rationale: "Predictable calculation, easier merchant understanding"
    alternatives: ["Compounding percentages", "Order-dependent calculation"]
    impact: "Price calculation behavior"
  - key: "Basis points constant extraction"
    choice: "Named constant BASIS_POINTS_DIVISOR = 10000"
    rationale: "Improved code maintainability and documentation"
    alternatives: ["Magic number inline"]
    impact: "Code readability"
metrics:
  duration_seconds: 169
  tasks_completed: 1
  files_created: 2
  files_modified: 0
  commits: 3
  completed_at: "2026-02-09T20:48:48Z"
---

# Phase 11 Plan 03: Option Price Calculator with TDD Summary

**Implemented pure price calculation engine with integer arithmetic using TDD methodology (RED-GREEN-REFACTOR).**

## Tasks Completed

### Task 1: Implement and test option price calculator using TDD

**Commits:**
- RED: 860c773 - test(11-03): add failing tests for option price calculator
- GREEN: 00dd055 - feat(11-03): implement option price calculator with integer arithmetic
- REFACTOR: 9b2d2d6 - refactor(11-03): extract BASIS_POINTS_DIVISOR constant

**Files:**
- app/services/option-price-calculator.server.ts (126 lines)
- app/services/option-price-calculator.server.test.ts (299 lines)

Completed full TDD cycle for option price calculation engine:

**RED Phase:**
- Created comprehensive test suite with 25 test cases
- Covered all edge cases from plan: FIXED/PERCENTAGE modifiers, ceiling rounding, non-compounding stacking, floor at $0, zero values, breakdown structure
- Tests failed as expected (module didn't exist)

**GREEN Phase:**
- Implemented `calculateModifierAmount`: handles FIXED (returns value directly) and PERCENTAGE (Math.ceil with basis points)
- Implemented `calculatePriceWithOptions`: non-compounding stacking from base, floor at zero with Math.max(0, total)
- All 25 tests passed
- Pure functions with no database dependency
- Integer-only arithmetic (no floating-point operations)
- Comprehensive JSDoc with examples

**REFACTOR Phase:**
- Extracted magic number 10000 to BASIS_POINTS_DIVISOR constant
- Improved code documentation
- All tests still pass after refactoring

**Key implementation details:**
- FIXED modifiers return value directly (already in cents)
- PERCENTAGE modifiers use Math.ceil((basePriceCents * value) / BASIS_POINTS_DIVISOR)
- Math.ceil rounds toward positive infinity (works correctly for both positive and negative percentages)
- All percentages calculate from base price (non-compounding)
- Total floored at $0.00 to prevent negative prices
- Price breakdown includes label, type, originalValue, appliedAmountCents for each modifier

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:

1. `npx vitest run app/services/option-price-calculator.server.test.ts` - All 25 tests pass
2. No `parseFloat`, `toFixed`, or decimal arithmetic in source (only integer operations)
3. Math.ceil used for percentage calculations (line 65)
4. Math.max(0, ...) used for floor at zero (line 119)
5. All test values are integers (cents/basis points)
6. Price breakdown includes correct label, type, originalValue, and appliedAmountCents for each modifier
7. Source file: 126 lines (exceeds 50 line minimum)
8. Test file: 299 lines (exceeds 100 line minimum)
9. Pure functions with no database or external dependencies

## Test Coverage

**calculateModifierAmount (8 tests):**
- FIXED modifiers: positive, negative, zero
- PERCENTAGE modifiers: positive, negative, zero
- Ceiling rounding edge cases: 149.85 -> 150, -149.85 -> -149
- Tiny percentage: 0.0001 -> rounds up to 1

**calculatePriceWithOptions (17 tests):**
- No modifiers
- Single modifier: FIXED, PERCENTAGE
- Multiple modifiers: mixed types, multiple percentages (non-compounding)
- Negative modifiers: FIXED discount, PERCENTAGE discount
- Floor at zero: exceeding base price, 100% off, multiple discounts
- Zero base price: with FIXED, with PERCENTAGE
- All zero modifiers
- Breakdown structure validation

## Impact

**Immediate:**
- Core pricing logic ready for option groups feature
- Financial correctness ensured through comprehensive test coverage
- Integer arithmetic prevents floating-point precision errors
- Price breakdown provides transparency for UI display

**Downstream Plans Unblocked:**
- Plan 02: Service layer (can integrate price calculations) — already completed
- Future plans: GraphQL mutations, Admin UI (can call price calculator)
- Widget integration: Price preview with option modifiers

**Technical Debt:**
- None introduced

## Self-Check: PASSED

**Files created:**
- [FOUND] /Users/robinkonijnendijk/Desktop/quote-flow/app/services/option-price-calculator.server.ts
- [FOUND] /Users/robinkonijnendijk/Desktop/quote-flow/app/services/option-price-calculator.server.test.ts

**Commits:**
- [FOUND] 860c773 (RED: failing tests)
- [FOUND] 00dd055 (GREEN: implementation)
- [FOUND] 9b2d2d6 (REFACTOR: constant extraction)

All claimed files and commits exist and are verifiable.
