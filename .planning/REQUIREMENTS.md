# Requirements: v1.1 Publish & Polish

**Milestone:** v1.1
**Status:** Active
**Created:** 2026-02-06

## Publishing

- [x] **PUBLISH-01**: Widget published to npm as `@gjrkdk/pricing-matrix-widget` with README, types, and correct peer dependencies *(scope changed from @pricing-matrix)*
- [x] **PUBLISH-02**: Widget package version follows semver (0.1.0), build artifacts verified before publish

## Production Deployment

- [ ] **DEPLOY-01**: App deployed to Vercel with production PostgreSQL database and stable URL
- [ ] **DEPLOY-02**: Production environment variables configured (Shopify API keys, database URL, app URL)
- [ ] **DEPLOY-03**: Production app serves embedded admin UI and REST API endpoints correctly

## Shopify Partner Dashboard

- [ ] **APP-01**: App registered in Shopify Partner Dashboard with correct OAuth redirect URLs and scopes
- [ ] **APP-02**: App installable on a store via direct install link (not App Store)
- [ ] **APP-03**: OAuth install flow works end-to-end on production URL

## Verification

- [ ] **VERIFY-01**: Full end-to-end flow works in production: install app → create matrix → price API → widget → Draft Order
- [ ] **VERIFY-02**: Widget published on npm works when installed in an external project

## Deferred from v1.0 (not in v1.1 scope)

Carried forward for future milestones:
- MATRIX-08: Duplicate matrix
- MATRIX-09: Export matrices to CSV
- PRICE-02: Price per unit display
- ORDER-02: Dimension metadata as line item properties
- ORDER-03: Invoice URL for customer payment
- WIDGET-06: Preset dimension quick-select
- WIDGET-07: Multiple unit support
- WIDGET-08: Custom dimension labels
- PLAT-02: Visual size preview

---
*Created: 2026-02-06*
