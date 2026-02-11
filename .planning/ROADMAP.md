# Roadmap: Shopify Price Matrix App (QuoteFlow)

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-02-06)
- ✅ **v1.1 Publish & Polish** - Phases 7-10 (shipped 2026-02-08)
- 🚧 **v1.2 Option Groups & App Store** - Phases 11-16 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-6) - SHIPPED 2026-02-06</summary>

Full-stack dimension-based pricing app with embedded admin dashboard, REST API, React widget, and Draft Order integration.

### Phase 1: Foundation & Shopify Integration
**Goal**: Shopify app foundation with OAuth, database, and embedded admin shell
**Plans**: 3 plans
Plans:
- [x] 01-01: Shopify app foundation with OAuth and database
- [x] 01-02: Embedded admin dashboard shell with Polaris
- [x] 01-03: Store settings and API key management

### Phase 2: Price Matrix Core
**Goal**: Matrix CRUD with spreadsheet editor and product assignment
**Plans**: 5 plans
Plans:
- [x] 02-01: Database schema for price matrices
- [x] 02-02: Matrix list and create/edit forms
- [x] 02-03: Spreadsheet-style price matrix editor
- [x] 02-04: Product assignment via Resource Picker
- [x] 02-05: Matrix validation and error handling

### Phase 3: REST API & Authentication
**Goal**: Public REST API for price lookup with authentication and rate limiting
**Plans**: 4 plans
Plans:
- [x] 03-01: REST API foundation with CORS and rate limiting
- [x] 03-02: Price lookup endpoint with round-up logic
- [x] 03-03: API authentication with store API keys
- [x] 03-04: API error handling and validation

### Phase 4: React Widget (npm Package)
**Goal**: Drop-in React widget with dimension inputs and live pricing
**Plans**: 4 plans
Plans:
- [x] 04-01: Widget foundation with Shadow DOM
- [x] 04-02: Dimension inputs and price display
- [x] 04-03: Real-time API integration
- [x] 04-04: Widget bundling and npm package setup

### Phase 5: Draft Order Integration
**Goal**: Create Shopify Draft Orders with locked matrix pricing
**Plans**: 4 plans
Plans:
- [x] 05-01: Draft Order creation endpoint
- [x] 05-02: Custom line items with locked pricing
- [x] 05-03: Widget checkout flow integration
- [x] 05-04: Draft Order error handling

### Phase 6: Enhancement & Polish
**Goal**: CSV import, billing gates, accessibility, and production readiness
**Plans**: 3 plans
Plans:
- [x] 06-01: CSV bulk import with preview
- [x] 06-02: Freemium billing gates
- [x] 06-03: Accessibility and WCAG 2.1 AA compliance

</details>

<details>
<summary>✅ v1.1 Publish & Polish (Phases 7-10) - SHIPPED 2026-02-08</summary>

Production deployment with npm widget, Vercel hosting, Shopify registration, and E2E verification.

### Phase 7: Widget Package Publishing
**Goal**: Production-ready npm package with TypeScript types and documentation
**Plans**: 2 plans
Plans:
- [x] 07-01: Package rename from @gjrkdk/pricing-matrix-widget to quote-flow
- [x] 07-02: Build verification and npm publishing

### Phase 8: Production Deployment
**Goal**: App deployed to Vercel with production PostgreSQL
**Plans**: 2 plans
Plans:
- [x] 08-01: Vercel deployment configuration
- [x] 08-02: Environment variables and database setup

### Phase 9: Shopify Integration & OAuth
**Goal**: App registered in Partner Dashboard with working OAuth flow
**Plans**: 2 plans
Plans:
- [x] 09-01: Partner Dashboard app registration
- [x] 09-02: OAuth install flow with legacy session tokens

### Phase 10: Production Verification
**Goal**: Full E2E flow verified in production environment
**Plans**: 2 plans
Plans:
- [x] 10-01: End-to-end production testing
- [x] 10-02: Widget verification in external projects

</details>

### 🚧 v1.2 Option Groups & App Store (In Progress)

**Milestone Goal:** Add customizable option groups with price modifiers and prepare for Shopify App Store submission.

#### Phase 11: Data Model & Price Calculation Foundation
**Goal**: Option groups database schema with integer-based price calculation
**Depends on**: Phase 10 (production foundation)
**Requirements**: OPT-01, OPT-02, OPT-05, PRICE-01, PRICE-02, PRICE-03, PRICE-04
**Success Criteria** (what must be TRUE):
  1. Option groups can be created with name and store association
  2. Option choices can be added to groups with fixed amount or percentage modifiers
  3. Option groups can be assigned to multiple products (shared, reusable)
  4. Price calculation applies modifiers using integer (cents) arithmetic without floating-point errors
  5. Percentage modifiers are calculated from base matrix price (non-compounding)
**Plans**: 3 plans

Plans:
- [x] 11-01-PLAN.md — Prisma schema for option groups, choices, and product assignments with migration
- [x] 11-02-PLAN.md — Zod validators and service layer for option group CRUD and assignments
- [x] 11-03-PLAN.md — TDD: Option price calculator with integer arithmetic and price breakdown

#### Phase 12: Admin UI for Option Groups
**Goal**: Merchants can create and manage option groups through Polaris admin dashboard
**Depends on**: Phase 11
**Requirements**: OPT-03, OPT-04
**Success Criteria** (what must be TRUE):
  1. Merchant can create, edit, and delete option groups with named choices
  2. Merchant can assign multiple option groups to a product
  3. Merchant can control display order of option groups on products
  4. Merchant sees which products use each option group
  5. Admin UI prevents deletion of option groups assigned to products (or shows warning)
**Plans**: 3 plans

Plans:
- [x] 12-01-PLAN.md — Option groups list page with IndexTable, delete modal, and navigation link
- [x] 12-02-PLAN.md — Create and edit forms with dynamic choices and Zod validation
- [x] 12-03-PLAN.md — Product assignment on edit page and full UI verification checkpoint

#### Phase 13: REST API Extension
**Goal**: API accepts option selections and returns modified prices with backward compatibility
**Depends on**: Phase 12
**Requirements**: API-01, API-02, API-03, API-04
**Success Criteria** (what must be TRUE):
  1. REST API accepts option selections alongside dimensions and returns total price
  2. API validates that option selections match product's assigned option groups
  3. Draft Orders include selected options as line item metadata
  4. Existing API calls work without options (backward compatible)
  5. API returns price breakdown showing base price and option modifiers
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md — Validation schemas and option validator service
- [x] 13-02-PLAN.md — Price endpoint and draft orders extension with options

#### Phase 14: Widget Integration
**Goal**: Widget renders option dropdowns with live price updates
**Depends on**: Phase 13
**Requirements**: WIDGET-01, WIDGET-02, WIDGET-03, WIDGET-04
**Success Criteria** (what must be TRUE):
  1. Widget renders dropdown for each option group assigned to the product
  2. Widget updates price live as customer selects options
  3. Widget shows price modifier next to each option value (e.g. "+$15.00", "+20%")
  4. Widget works correctly with products that have no option groups (backward compatible)
  5. Widget provides accessible keyboard navigation for option dropdowns
**Plans**: 4 plans

Plans:
- [x] 14-01-PLAN.md — REST API endpoint for product options + widget type extensions
- [x] 14-02-PLAN.md — useOptionGroups hook, OptionGroupSelect component, usePriceFetch extension, CSS styles
- [x] 14-03-PLAN.md — Main widget integration with option groups and draft order extension
- [x] 14-04-PLAN.md — Gap closure: fix dollars-to-cents unit mismatch in option price calculation

#### Phase 15: GraphQL Migration & GDPR
**Goal**: Shopify Admin API calls migrated to GraphQL with functional GDPR webhooks
**Depends on**: Phase 14
**Requirements**: STORE-01
**Success Criteria** (what must be TRUE):
  1. Draft Order creation uses GraphQL draftOrderCreate mutation (not REST)
  2. Product fetching uses GraphQL products query (not REST)
  3. GDPR webhooks (customers/data_request, customers/redact, shop/redact) actually delete data
  4. shop/redact webhook removes all option groups and matrices for the store
  5. Webhook responses return within 200ms (queue long-running deletions)
**Plans**: 2 plans

Plans:
- [ ] 15-01-PLAN.md — JobQueue model, job queue service, and GDPR deletion service
- [ ] 15-02-PLAN.md — Webhook async refactor and Vercel Cron endpoint

#### Phase 16: Performance Audit & App Store Submission
**Goal**: App submitted to Shopify App Store and passes performance standards
**Depends on**: Phase 15
**Requirements**: STORE-02, STORE-03, STORE-04
**Success Criteria** (what must be TRUE):
  1. Lighthouse score has not degraded more than 10% from baseline
  2. App listing complete with icon, 3 screenshots (1600x900px), and description
  3. Test credentials provided for reviewers with working demo store
  4. App submitted to Shopify App Store for review
  5. Database has proper indexes on foreign keys (storeId, productId, optionGroupId)
**Plans**: TBD

Plans:
- [ ] 16-01: TBD during phase planning

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13 → 14 → 15 → 16

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Shopify Integration | v1.0 | 3/3 | Complete | 2026-02-04 |
| 2. Price Matrix Core | v1.0 | 5/5 | Complete | 2026-02-05 |
| 3. REST API & Authentication | v1.0 | 4/4 | Complete | 2026-02-05 |
| 4. React Widget (npm Package) | v1.0 | 4/4 | Complete | 2026-02-06 |
| 5. Draft Order Integration | v1.0 | 4/4 | Complete | 2026-02-06 |
| 6. Enhancement & Polish | v1.0 | 3/3 | Complete | 2026-02-06 |
| 7. Widget Package Publishing | v1.1 | 2/2 | Complete | 2026-02-07 |
| 8. Production Deployment | v1.1 | 2/2 | Complete | 2026-02-08 |
| 9. Shopify Integration & OAuth | v1.1 | 2/2 | Complete | 2026-02-08 |
| 10. Production Verification | v1.1 | 2/2 | Complete | 2026-02-08 |
| 11. Data Model & Price Calculation Foundation | v1.2 | 3/3 | Complete | 2026-02-09 |
| 12. Admin UI for Option Groups | v1.2 | 3/3 | Complete | 2026-02-09 |
| 13. REST API Extension | v1.2 | 2/2 | Complete | 2026-02-10 |
| 14. Widget Integration | v1.2 | 4/4 | Complete | 2026-02-10 |
| 15. GraphQL Migration & GDPR | v1.2 | 0/TBD | Not started | - |
| 16. Performance Audit & App Store Submission | v1.2 | 0/TBD | Not started | - |
