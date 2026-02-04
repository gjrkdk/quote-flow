# Project State: Shopify Price Matrix App

**Last Updated:** 2026-02-04
**Status:** In Progress (Phase 1 - Foundation & Authentication)

## Project Reference

**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure

**What This Is:** A public Shopify app with three components: (1) embedded admin dashboard for matrix configuration, (2) REST API for headless storefronts to fetch pricing, (3) drop-in React widget for easy integration. Merchants define breakpoint grids (width x height), assign them to products, and customers get real-time dimension-based pricing with checkout via Draft Orders.

**Current Focus:** Executing Phase 1 (Foundation & Authentication). Plan 01-01 complete - Shopify Remix scaffold with OAuth, Prisma, and GDPR webhooks.

## Current Position

**Phase:** 1 of 6 (Foundation & Authentication)
**Plan:** 01 of ~4
**Status:** In progress
**Last activity:** 2026-02-04 - Completed 01-01-PLAN.md

**Progress Bar:**
```
[█                   ] 5% (1/21 plans estimated complete)

Phase 1: Foundation & Authentication       [██        ] 1/4
Phase 2: Admin Matrix Management           [          ] 0/6
Phase 3: Draft Orders Integration          [          ] 0/1
Phase 4: Public REST API                   [          ] 0/4
Phase 5: React Widget (npm Package)        [          ] 0/5
Phase 6: Polish & App Store Preparation    [          ] 0/1
```

## Performance Metrics

**Velocity:** 5 min/plan (1 plan completed)
**Blockers:** 0
**Active Research:** 0

**Phase History:**
| Phase | Plan | Completed | Duration | Status |
|-------|------|-----------|----------|--------|
| 01-foundation-authentication | 01 | 2026-02-04 | 5min | ✓ Complete |

## Accumulated Context

### Key Decisions

**Made:**
- Roadmap structure: 6 phases following dependency chain (Foundation → Admin → Orders → API → Widget → Polish)
- Success criteria defined with observable user behaviors (not implementation tasks)
- Research flags set for Phase 3 (Draft Orders) and Phase 4 (REST API security)
- **[01-01]** PostgreSQL session storage: Use @shopify/shopify-app-session-storage-postgresql instead of Prisma storage
- **[01-01]** Session token strategy: Enable unstable_newEmbeddedAuthStrategy for session token support (third-party cookie fix)
- **[01-01]** GDPR audit trail: Store all GDPR requests in GdprRequest model for compliance audit
- **[01-01]** Connection pooling: Use pg Pool adapter with connection limit for Vercel serverless
- **[01-01]** OAuth scopes: write_products, read_customers, write_draft_orders

**Pending:**
- Matrix size limits (100x100 from research) - validated during Phase 2
- Rate limiting strategy (in-memory vs Redis) - decided during Phase 4 planning
- Pricing model (subscription vs one-time) - decided during Phase 6

### Open Todos

**Immediate:**
- [ ] Run `/gsd:plan-phase 1` to create execution plan for Foundation & Authentication

**Upcoming:**
- [ ] Research Draft Orders behavior during Phase 3 planning
- [ ] Research API security patterns (HMAC, rate limiting) during Phase 4 planning

### Known Blockers

(None - project just initialized)

### Anti-Patterns to Avoid

From research:
1. Third-party cookies for embedded sessions - use session tokens
2. Prisma connection exhaustion on Vercel - configure pooling from start
3. Missing GDPR webhooks - register in Phase 1
4. Draft Orders rate limits - implement retry logic in Phase 3
5. API without HMAC verification - design into Phase 4 from start

## Session Continuity

**Last session:** 2026-02-04 08:21:17 UTC
**Stopped at:** Completed 01-01-PLAN.md (Shopify Remix scaffold)
**Resume file:** None

**What Just Happened:**
- Executed 01-01-PLAN.md (Shopify Remix scaffold with OAuth and GDPR webhooks)
- Created Prisma schema with Store and GdprRequest models
- Configured Shopify OAuth with PostgreSQL session storage
- Implemented all 4 GDPR webhook handlers
- 2 tasks completed, 2 commits made (bc8e216, c013c4f)

**What Comes Next:**
- Continue Phase 1 with remaining plans (API key generation, admin UI)
- Next plan should implement API key generation and storage (Store model ready with apiKeyHash field)

**Context for Next Agent:**
- Shopify app foundation complete with OAuth and session persistence
- Database connection uses pg Pool adapter (Vercel compatible)
- GDPR webhooks registered and handling compliance
- No blockers - ready for API key generation plan

---
*State tracked since: 2026-02-03*
