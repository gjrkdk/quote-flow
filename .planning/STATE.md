# Project State: Shopify Price Matrix App (QuoteFlow)

**Last Updated:** 2026-02-10
**Status:** v1.2 Option Groups & App Store — Phase 13 in progress

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-09)

**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure

**Current Focus:** Phase 13 - REST API Extension for Option Groups

## Current Position

**Milestone:** v1.2 Option Groups & App Store
**Phase:** 13 of 16 (REST API Extension)
**Plan:** 1 of 2 (complete)
**Status:** Phase 13 Plan 01 complete - option selection validation foundation ready
**Last activity:** 2026-02-10 — Phase 13 Plan 01 executed (validation schemas & business rule service)

Progress: [███████████████████░] 68% (11 of 16 phases complete)

Milestones:
- v1.0 MVP: 6 phases, 23 plans — shipped 2026-02-06
- v1.1 Publish & Polish: 4 phases, 8 plans — shipped 2026-02-08
- v1.2 Option Groups & App Store: 6 phases, 3+ plans — in progress (Phase 12 next)

## Performance Metrics

**Velocity:**
- Total plans completed: 38 (v1.0: 23 plans, v1.1: 8 plans, v1.2: 7 plans)
- v1.0 duration: 4 days
- v1.1 duration: 2 days
- v1.2 duration: In progress

**By Milestone:**

| Milestone | Phases | Plans | Duration |
|-----------|--------|-------|----------|
| v1.0 MVP | 6 | 23 | 4 days |
| v1.1 Publish & Polish | 4 | 8 | 2 days |
| v1.2 Option Groups & App Store | 6 | TBD | In progress |

**Recent Trend:**
- v1.0 → v1.1: Faster (focused deployment work)
- v1.2 expected: Similar to v1.0 (new features + App Store prep)

| Plan | Duration (s) | Tasks | Files |
|------|--------------|-------|-------|
| Phase 11 P01 | 148 | 2 tasks | 2 files |
| Phase 11 P02 | 153 | 2 tasks | 2 files |
| Phase 11 P03 | 169 | 1 tasks | 2 files |
| Phase 12 P01 | 75 | 2 tasks | 2 files |
| Phase 12 P02 | 133 | 2 tasks | 2 files |
| Phase 12 P03 | 120 | 2 tasks | 1 files |
| Phase 13 P01 | 101 | 2 tasks | 2 files |

## Archived

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`

## Accumulated Context

### Production Environment
- App: https://quote-flow-one.vercel.app (Vercel fra1 + Neon EU Central)
- Widget: quote-flow@0.1.0 on npm
- Codebase: 7,173 LOC TypeScript

### Technical Decisions for v1.2
- Reusable option groups with price modifiers (flexible add-on pricing)
- Percentage modifiers from base price, non-compounding (predictable calculations)
- Integer (cents) arithmetic for all price calculations (avoid floating-point errors)
- GraphQL Admin API migration mandatory (REST deprecated for App Store)
- DIRECT_URL environment variable added to .env for local development (Phase 11: required by Prisma for schema validation)
- Replace strategy for option group choice updates (delete all, create new - simpler than diffing)
- Application-level cap enforcement for option group assignments (5 groups per product in service layer)
- Ceiling rounding for percentage modifiers (Math.ceil toward positive infinity)
- Non-compounding modifier stacking (all calculate from base price)
- Follow exact IndexTable pattern from matrices list page for option groups list (Phase 12-01: consistency in admin UI)
- Show 'Required/Optional' as Type column in option groups list (Phase 12-01: clarity)
- Display product usage warning in delete modal for option groups (Phase 12-01: merchant awareness of impact)
- JSON serialization for nested form data in option group forms (Phase 12-02: handle complex choice arrays)
- Context-specific help text for modifier values based on type (Phase 12-02: user guidance for FIXED vs PERCENTAGE)
- Separate fetcher instances for independent form actions on same page (Phase 12-03: prevent action conflicts)
- Loader-level aggregation for product option group counts (Phase 12-03: avoid N+1 queries in assignment UI)
- "At limit" badge for products with 5 option groups assigned (Phase 12-03: visual cap enforcement)

### Known Technical Debt
- Billing gates disabled for testing (TODO markers in `billing.server.ts`)
- In-memory rate limiting (Redis migration path documented for multi-instance)
- `use_legacy_install_flow = true` required for proper offline session tokens
- CORS preflight handled before authentication in REST API routes

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Rename widget npm package from @gjrkdk/pricing-matrix-widget to @gjrkdk/quote-flow | 2026-02-08 | 4e5f1cc | [001-rename-widget-package](./quick/001-rename-widget-package/) |

### Blockers/Concerns

None yet.

## Session Continuity

**Last session:** 2026-02-10T19:48:39.342Z
**Stopped at:** Completed 13-01-PLAN.md
**Resume file:** None

---
*State tracked since: 2026-02-03*
