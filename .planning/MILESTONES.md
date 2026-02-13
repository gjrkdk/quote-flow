# Project Milestones: Shopify Price Matrix App

## v1.2 Option Groups & App Store (Shipped: 2026-02-13)

**Delivered:** Customizable option groups with price modifiers (fixed and percentage), full-stack integration from database through admin UI, REST API, and widget, plus GraphQL migration and GDPR compliance with async job processing.

**Phases completed:** 11-15 (14 plans total)

**Key accomplishments:**
- Option groups data model with Prisma schema, Zod validators, service layer, and TDD price calculator using integer (cents) arithmetic
- Admin UI for option group management: list with IndexTable, create/edit forms with dynamic choices, product assignment with 5-group cap enforcement
- REST API extended with option selections, price breakdowns, and draft order metadata (backward compatible)
- Widget integration with option dropdowns, live price updates, and draft order creation with selected options
- GraphQL Admin API migration (draftOrderCreate, products query) and GDPR compliance with async job queue via Vercel Cron

**Stats:**
- 82 files created/modified, +17,936/-247 lines
- 10,821 lines of TypeScript (cumulative)
- 5 phases, 14 plans
- 4 days from start to ship (2026-02-09 → 2026-02-13)

**Git range:** `2460598` → `acf1590`

**Deferred:** App Store submission (STORE-02, STORE-03, STORE-04) — Phase 16 removed, no impact on core functionality

**What's next:** App Store submission, billing activation, user feedback collection

---

## v1.1 Publish & Polish (Shipped: 2026-02-08)

**Delivered:** Production-ready deployment with npm widget package, Vercel hosting, Shopify Partner Dashboard registration, and full E2E production verification.

**Phases completed:** 7-10 (8 plans total)

**Key accomplishments:**
- Published `quote-flow@0.1.0` to npm with TypeScript types, ESM/UMD builds, and MIT license
- Deployed to Vercel (fra1) with Neon PostgreSQL (EU Central) at quote-flow-one.vercel.app
- Registered as public Shopify app with working OAuth install flow
- Fixed auth: legacy install flow for proper offline sessions, CORS preflight before authentication
- Full E2E verified: install → matrix → Price API → Draft Order → widget rendering

**Stats:**
- 60 files created/modified
- 7,173 lines of TypeScript (cumulative)
- 4 phases, 8 plans, 34 commits
- 3 days from start to ship (2026-02-06 → 2026-02-08)

**Git range:** `v1.0` → `02757b8`

**What's next:** User feedback collection, App Store review submission, billing activation

---

## v1.0 MVP (Shipped: 2026-02-06)

**Delivered:** Full-stack dimension-based pricing app for Shopify with embedded admin dashboard, REST API, React widget, and Draft Order integration.

**Phases completed:** 1-6 (23 plans total)

**Key accomplishments:**
- Embedded Shopify admin dashboard with matrix CRUD, product assignment via Resource Picker, and unit preference settings
- Spreadsheet-style price matrix editor with ARIA grid keyboard navigation, breakpoint management, and unsaved changes protection
- REST API with API key authentication, dimension-based price lookup, round-up pricing, CORS, and rate limiting
- React widget (npm package) with Shadow DOM CSS isolation, real-time price updates, and Draft Order checkout flow
- Draft Order integration using custom line items for locked matrix pricing
- CSV bulk import with preview, freemium billing gates ($12/month), and WCAG 2.1 AA accessibility

**Stats:**
- 145 files created/modified
- 6,810 lines of TypeScript
- 6 phases, 23 plans
- 4 days from start to ship (2026-02-03 → 2026-02-06)

**Git range:** `64e0473` → `a604cb9`

**What's next:** App Store submission, production deployment, user feedback collection

---
