# Project State: Shopify Price Matrix App (QuoteFlow)

**Last Updated:** 2026-02-13
**Status:** v1.2 Option Groups & App Store — Shipped

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure

**Current Focus:** Between milestones — v1.2 complete, next milestone not yet planned

## Current Position

**Milestone:** v1.2 Option Groups & App Store — SHIPPED
**Status:** All phases complete, milestone archived

Progress: [████████████████████████] 100% (15 of 15 phases complete, 45 plans executed)

Milestones:

- v1.0 MVP: 6 phases, 23 plans — shipped 2026-02-06
- v1.1 Publish & Polish: 4 phases, 8 plans — shipped 2026-02-08
- v1.2 Option Groups & App Store: 5 phases, 14 plans — shipped 2026-02-13

## Performance Metrics

**Velocity:**

- Total plans completed: 45 (v1.0: 23 plans, v1.1: 8 plans, v1.2: 14 plans)
- v1.0 duration: 4 days
- v1.1 duration: 2 days
- v1.2 duration: 4 days

**By Milestone:**

| Milestone                      | Phases | Plans | Duration |
| ------------------------------ | ------ | ----- | -------- |
| v1.0 MVP                       | 6      | 23    | 4 days   |
| v1.1 Publish & Polish          | 4      | 8     | 2 days   |
| v1.2 Option Groups & App Store | 5      | 14    | 4 days   |

## Archived

- `.planning/milestones/v1.0-ROADMAP.md`
- `.planning/milestones/v1.0-REQUIREMENTS.md`
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.1-ROADMAP.md`
- `.planning/milestones/v1.1-REQUIREMENTS.md`
- `.planning/milestones/v1.2-ROADMAP.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`
- `.planning/milestones/v1.2-MILESTONE-AUDIT.md`

## Accumulated Context

### Production Environment

- App: https://quote-flow-one.vercel.app (Vercel fra1 + Neon EU Central)
- Widget: quote-flow@0.1.0 on npm
- Codebase: 10,821 LOC TypeScript

### Known Technical Debt

- Billing gates disabled for testing (TODO markers in `billing.server.ts`)
- In-memory rate limiting (Redis migration path documented for multi-instance)
- `use_legacy_install_flow = true` required for proper offline session tokens
- CORS preflight handled before authentication in REST API routes
- App Store submission deferred (STORE-02, STORE-03, STORE-04)

### Quick Tasks Completed

| #   | Description                                                                        | Date       | Commit  | Directory                                                                                        |
| --- | ---------------------------------------------------------------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------ |
| 001 | Rename widget npm package from @gjrkdk/pricing-matrix-widget to @gjrkdk/quote-flow | 2026-02-08 | 4e5f1cc | [001-rename-widget-package](./quick/001-rename-widget-package/)                                  |
| 002 | Create privacy policy page at /privacy for App Store submission                    | 2026-02-13 | 4a03fe7 | [002-create-privacy-policy-url](./quick/2-create-privacy-policy-url-that-is-needed/)             |
| 003 | Add ability to edit matrix title after creation via inline edit UI                | 2026-02-13 | 0090b4d | [003-add-ability-to-edit-matrix-title](./quick/3-add-ability-to-edit-matrix-title-after-c/)      |
| 004 | Make matrix list items bigger using ResourceList instead of condensed IndexTable   | 2026-02-13 | e509ea9 | [004-make-matrix-list-items-bigger](./quick/4-make-the-created-matrix-list-items-bigge/)         |
| 005 | Show Duplicate and Delete actions always visible on matrix and option group cards  | 2026-02-13 | 881fe38 | [005-show-duplicate-delete-actions-always-vis](./quick/5-show-duplicate-delete-actions-always-vis/) |
| 006 | Make option group edit page match matrix edit page (layout, save button, inline title editing) | 2026-02-13 | 7bf998d | [006-make-option-group-edit-page-match-matrix](./quick/6-make-option-group-edit-page-match-matrix/) |

### Blockers/Concerns

None.

## Session Continuity

**Last session:** 2026-02-13
**Stopped at:** Completed quick task 006 - Make option group edit page match matrix edit page
**Resume file:** None

---

_State tracked since: 2026-02-03_
