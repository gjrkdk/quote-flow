# Project State: Shopify Price Matrix App (QuoteFlow)

**Last Updated:** 2026-02-08
**Status:** v1.1 Shipped — Quick tasks in progress

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-08)

**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure

**Current Focus:** Quick maintenance tasks

## Current Position

**Milestone:** v1.1 Publish & Polish — SHIPPED
**Next:** Not yet planned
**Last activity:** 2026-02-08 — Completed quick task 001 (rename widget package)

Progress:
- v1.0 MVP: 6 phases, 23 plans — shipped 2026-02-06
- v1.1 Publish & Polish: 4 phases, 8 plans — shipped 2026-02-08
- Quick tasks: 1 completed (001-rename-widget-package)

## Archived

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`

## Accumulated Context

- Production: https://quote-flow-one.vercel.app (Vercel fra1 + Neon EU Central)
- Widget: quote-flow@0.1.0 on npm
- Billing gates disabled for testing (TODO markers in `billing.server.ts`)
- In-memory rate limiting (Redis migration path documented for multi-instance)
- `use_legacy_install_flow = true` required for proper offline session tokens
- CORS preflight handled before authentication in REST API routes

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Rename widget npm package from @gjrkdk/pricing-matrix-widget to @gjrkdk/quote-flow | 2026-02-08 | 4e5f1cc | [001-rename-widget-package](./quick/001-rename-widget-package/) |

## Session Continuity

**Last session:** 2026-02-08 17:44:00 UTC
**Stopped at:** Quick task 001 complete
**Resume file:** .planning/quick/001-rename-widget-package/001-SUMMARY.md

---
*State tracked since: 2026-02-03*
