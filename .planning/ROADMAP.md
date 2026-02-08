# Roadmap: v1.1 Publish & Polish

**Milestone:** v1.1
**Status:** Active
**Created:** 2026-02-06

## Overview

This milestone takes the shipped v1.0 MVP from development to production. The widget gets published to npm, the app gets deployed to Vercel, and it's registered in the Shopify Partner Dashboard so merchants can install it via direct link. Final phase verifies the complete flow in production.

## Phases

### Phase 07: Publish Widget to npm ✓

**Goal:** Publish `@pricing-matrix/widget` to the npm registry so developers can install it
**Status:** Complete (2026-02-07)
**Depends on:** None (widget code complete from v1.0)
**Plans:** 2 plans (2/2 complete)

**Requirements:**
- PUBLISH-01: Widget published to npm with README, types, peer dependencies
- PUBLISH-02: Semver versioning, build artifacts verified

**Success Criteria:**
1. `npm install @pricing-matrix/widget` works from any project
2. Package includes TypeScript types, ESM build, and README with usage examples
3. Widget renders correctly when imported from the published package

Plans:
- [x] 07-01-PLAN.md — Prepare package metadata, README, LICENSE, and verify build
- [x] 07-02-PLAN.md — Authenticate with npm and publish @gjrkdk/pricing-matrix-widget

---

### Phase 08: Production Deploy to Vercel

**Goal:** Deploy the app to Vercel with a production Neon database and stable URL
**Depends on:** None (can run in parallel with Phase 07)
**Plans:** 2 plans

**Requirements:**
- DEPLOY-01: App on Vercel with production PostgreSQL and stable URL
- DEPLOY-02: Production environment variables configured
- DEPLOY-03: Admin UI and REST API work on production URL

**Success Criteria:**
1. App is accessible at a stable Vercel URL (not localhost/ngrok)
2. Production database is provisioned and migrations applied
3. Embedded admin UI loads inside Shopify admin
4. REST API endpoints respond to authenticated requests

Plans:
- [ ] 08-01-PLAN.md — Configure Vercel adapter, Prisma dual-URL, build pipeline, and production TOML
- [ ] 08-02-PLAN.md — Create Neon DB, production Shopify app, deploy to Vercel, verify

---

### Phase 09: Shopify Partner Dashboard Registration

**Goal:** Register the app in Partner Dashboard so merchants can install via direct link
**Depends on:** Phase 08 (needs production URL for OAuth config)
**Plans:** TBD

**Requirements:**
- APP-01: App registered with correct OAuth redirects and scopes
- APP-02: Installable via direct install link
- APP-03: OAuth install flow works end-to-end on production

**Success Criteria:**
1. App is registered in Shopify Partner Dashboard with production URL
2. OAuth redirect URLs point to Vercel deployment
3. A merchant can install the app using the direct install link
4. After install, merchant lands on the embedded dashboard

---

### Phase 10: E2E Production Verification

**Goal:** Verify the complete flow works in production from install to Draft Order
**Depends on:** Phases 07, 08, 09 (all prior work complete)
**Plans:** TBD

**Requirements:**
- VERIFY-01: Full end-to-end flow in production
- VERIFY-02: Published npm widget works in external project

**Success Criteria:**
1. Fresh store installs the app via direct link
2. Merchant creates a price matrix in the embedded dashboard
3. REST API returns correct prices for the matrix
4. Published widget fetches price and creates a Draft Order
5. Draft Order appears in Shopify admin with correct pricing

---

## Phase Dependencies

```
Phase 07 (npm publish) ──────────────┐
                                      ├──→ Phase 10 (E2E verification)
Phase 08 (Vercel deploy) ──→ Phase 09 (Partner Dashboard) ──┘
```

## Milestone Summary

**Total Phases:** 4 (07-10)
**Total Requirements:** 10
**Estimated Plans:** TBD (created during phase planning)

---
*Created: 2026-02-06*
