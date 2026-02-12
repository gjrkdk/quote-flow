# Project State: Shopify Price Matrix App (QuoteFlow)

**Last Updated:** 2026-02-12
**Status:** v1.2 Option Groups & App Store — Phase 15 in progress

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-09)

**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure

**Current Focus:** Phase 15 - GraphQL Migration & GDPR

## Current Position

**Milestone:** v1.2 Option Groups & App Store
**Phase:** 15 of 16 (GraphQL Migration & GDPR)
**Plan:** 1 of 2 (complete)
**Status:** Job queue infrastructure complete - async webhook processing foundation ready
**Last activity:** 2026-02-12 — Plan 15-01 complete (job queue, GDPR handlers)

Progress: [██████████████████████] 90% (15 of 16 phases started, 14.5 complete)

Milestones:
- v1.0 MVP: 6 phases, 23 plans — shipped 2026-02-06
- v1.1 Publish & Polish: 4 phases, 8 plans — shipped 2026-02-08
- v1.2 Option Groups & App Store: 6 phases, 11+ plans — in progress (Phase 15 next)

## Performance Metrics

**Velocity:**
- Total plans completed: 43 (v1.0: 23 plans, v1.1: 8 plans, v1.2: 12 plans)
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
| Phase 13 P02 | 208 | 2 tasks | 4 files |
| Phase 14 P01 | 102 | 2 tasks | 2 files |
| Phase 14 P02 | 109 | 2 tasks | 4 files |
| Phase 14 P03 | 129 | 2 tasks | 2 files |
| Phase 14 P04 | 75 | 1 tasks | 2 files |
| Phase 14 P04 | 75 | 1 tasks | 2 files |
| Phase 15 P01 | 228 | 3 tasks | 4 files |

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
- Store option selections as JSON in DraftOrderRecord rather than normalized relations (Phase 13-02: simpler schema, point-in-time snapshot)
- Transform option IDs to names/labels for Shopify custom attributes (Phase 13-02: human-readable for merchants)
- Include basePrice and optionModifiers in response only when options provided (Phase 13-02: backward compatibility)
- Return empty array (not 404) for products without option groups (Phase 14-01: widget should handle empty state gracefully)
- Place all option types in internal section of widget types file (Phase 14-01: not exported to consumers)
- Extend PriceApiResponse and DraftOrderApiResponse with optional fields (Phase 14-01: backward compatible)
- Use native HTML select for option groups (Phase 14-02: better accessibility and mobile support than custom dropdown)
- No debouncing for option selection changes (Phase 14-02: immediate price refetch unlike debounced dimensions)
- Pre-select default choices for REQUIRED groups on mount (Phase 14-03: improves UX, ensures valid initial state)
- Pass undefined (not empty array) when no selections (Phase 14-03: cleaner API semantics)
- Math.round for dollar-to-cents conversion (Phase 14-04: handles floating-point precision when multiplying by 100)
- Convert all API response price fields to dollars (Phase 14-04: ensures consistent dollar amounts in basePrice and appliedAmount fields)
- Database-backed job queue with exponential backoff (Phase 15-01: simpler than external queue service for MVP)
- Acknowledgment-only for customer_redact (Phase 15-01: app stores no customer PII)

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

**Last session:** 2026-02-12T17:03:05.174Z
**Stopped at:** Completed 15-01-PLAN.md
**Resume file:** None

---
*State tracked since: 2026-02-03*
