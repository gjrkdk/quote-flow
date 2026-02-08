# Project Milestones: Shopify Price Matrix App

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
