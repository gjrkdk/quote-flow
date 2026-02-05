# Roadmap: Shopify Price Matrix App

**Project:** Shopify Price Matrix App
**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure
**Created:** 2026-02-03
**Depth:** Standard (6 phases)

## Overview

This roadmap delivers a public Shopify app enabling dimension-based pricing for headless storefronts. Phases follow the dependency chain: foundation authentication → merchant matrix management → Shopify order integration → public API → React widget → app store polish. Each phase delivers verifiable merchant or customer capabilities.

## Phases

### Phase 1: Foundation & Authentication

**Goal:** App installs securely into Shopify stores and persists merchant sessions

**Dependencies:** None (foundation)

**Requirements:**
- INFRA-01: App installs via Shopify OAuth flow and persists merchant session
- INFRA-02: Embedded app uses session token authentication (mandatory for embedded apps)
- INFRA-03: GDPR webhook handlers respond to customer data requests and deletion (mandatory for App Store)
- INFRA-04: API key auto-generated per store on install for storefront authentication

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Remix app, Prisma schema, OAuth config, GDPR webhooks
- [x] 01-02-PLAN.md — Dashboard UI with welcome card, API key management, empty state
- [x] 01-03-PLAN.md — Database migrations, error handling, end-to-end verification

**Success Criteria:**
1. Merchant can install the app from a development URL via Shopify OAuth
2. Merchant can access the embedded app dashboard inside Shopify admin without authentication errors
3. App generates and displays a unique API key for the merchant's store on first install
4. GDPR webhooks (customer data request, customer redact, shop redact) respond with 200 OK and log receipt

---

### Phase 2: Admin Matrix Management

**Goal:** Merchants can create, edit, and delete dimension-based price matrices through the embedded dashboard

**Dependencies:** Phase 1 (requires authentication and database)

**Requirements:**
- MATRIX-01: Merchant can create a price matrix with named width breakpoints and height breakpoints
- MATRIX-02: Merchant can set a price at each width/height intersection in the matrix
- MATRIX-03: Merchant can edit an existing matrix (add/remove breakpoints, change prices)
- MATRIX-04: Merchant can delete a matrix
- MATRIX-05: Merchant can assign a shared matrix to one or more products
- MATRIX-06: Each product links to at most one matrix

**Plans:** 5 plans

Plans:
- [x] 02-01-PLAN.md — Database schema (matrix models) and Settings page (unit preference)
- [x] 02-02-PLAN.md — Matrix list page (EmptyState/IndexTable) and create matrix page (templates)
- [x] 02-03-PLAN.md — Matrix editor with spreadsheet-style grid editing and validation
- [x] 02-04-PLAN.md — Product assignment via Shopify Resource Picker
- [x] 02-05-PLAN.md — Human verification of complete matrix management flow

**Success Criteria:**
1. Merchant can create a new matrix with width breakpoints (e.g., 12, 24, 36 inches) and height breakpoints (e.g., 12, 24, 36 inches) through the dashboard
2. Merchant can set a price at each (width, height) intersection and see a visual grid of all prices
3. Merchant can edit an existing matrix to add or remove breakpoints and update prices
4. Merchant can assign a matrix to multiple products from their store and see which products currently use each matrix
5. Merchant can delete a matrix and see confirmation that unassigning from products succeeded

---

### Phase 3: Draft Orders Integration

**Goal:** Calculated matrix prices create valid Shopify orders with custom locked pricing

**Dependencies:** Phase 2 (requires matrix data to calculate prices)

**Requirements:**
- ORDER-01: Draft Order created via Shopify GraphQL API with custom locked price

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md — Price calculator service (TDD) with breakpoint lookup and dimension validation
- [ ] 03-02-PLAN.md — DraftOrderRecord database schema and migration
- [ ] 03-03-PLAN.md — Draft Order creation service, test flow UI, and dashboard counter

**Success Criteria:**
1. System can create a Draft Order for a product with matrix pricing using a specified width and height
2. Draft Order displays the calculated price (not the product's default price) as the line item price
3. Draft Order appears in the merchant's Shopify admin under Orders > Drafts with correct product, quantity, and custom price
4. Merchant can complete the Draft Order through Shopify admin and it converts to a real order with the locked custom price

---

### Phase 4: Public REST API

**Goal:** Headless storefronts can authenticate and retrieve dimension-based prices via REST API

**Dependencies:** Phase 3 (reuses pricing and Draft Order logic)

**Requirements:**
- API-01: REST endpoint returns price for a given product + width + height
- API-02: API authenticates requests via X-API-Key header
- API-03: Dimensions between breakpoints round up to the next higher breakpoint
- API-04: API returns error for dimensions outside matrix range

**Success Criteria:**
1. External client can send GET request to `/api/v1/products/:id/price?width=18&height=30` with valid API key and receive price response
2. API returns 401 Unauthorized for requests without valid X-API-Key header
3. API returns rounded-up price when customer dimensions fall between defined breakpoints (e.g., width=18 rounds to 24-inch breakpoint)
4. API returns 400 Bad Request with error message when dimensions exceed matrix range or product has no assigned matrix

---

### Phase 5: React Widget (npm Package)

**Goal:** Merchants can add drop-in React widget to headless storefronts with dimension inputs and live pricing

**Dependencies:** Phase 4 (widget calls REST API for pricing)

**Requirements:**
- WIDGET-01: React component renders width and height input fields with validation
- WIDGET-02: Price updates in real-time as customer changes dimensions
- WIDGET-03: Add-to-cart button creates a Draft Order with the calculated price
- WIDGET-04: Widget uses Shadow DOM for CSS isolation from host page
- WIDGET-05: Widget published as npm package with React as peer dependency

**Success Criteria:**
1. Developer can install widget via `npm install @yourorg/shopify-price-matrix-widget` and render it in a React app
2. Customer sees width and height input fields and price updates in real-time as they type valid dimensions
3. Customer clicks "Add to Cart" and receives Draft Order confirmation (or redirect to complete checkout)
4. Widget styles do not conflict with host page CSS (Shadow DOM isolation verified)
5. Widget package is published to npm and downloadable by external developers

---

### Phase 6: Polish & App Store Preparation

**Goal:** App meets Shopify App Store quality standards and provides merchant-friendly bulk operations

**Dependencies:** Phase 5 (all core features complete)

**Requirements:**
- MATRIX-07: Merchant can create a matrix by uploading a CSV file

**Success Criteria:**
1. Merchant can upload a CSV file with headers (width, height, price) and create a complete matrix in one operation
2. Dashboard displays mobile-responsive UI on tablet and phone screen sizes without horizontal scrolling
3. All form fields and interactive elements meet WCAG 2.1 AA accessibility standards (keyboard navigation, screen reader labels)
4. App passes Shopify embedded app security review checklist (session tokens, GDPR webhooks, appropriate scopes)

---

## Progress

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| **1. Foundation & Authentication** | Complete | 4 | 100% |
| **2. Admin Matrix Management** | Complete | 6 | 100% |
| **3. Draft Orders Integration** | Pending | 1 | 0% |
| **4. Public REST API** | Pending | 4 | 0% |
| **5. React Widget (npm Package)** | Pending | 5 | 0% |
| **6. Polish & App Store Preparation** | Pending | 1 | 0% |

**Total Requirements:** 21/21 mapped
**Overall Progress:** 48% (10/21 requirements complete)

---

## Notes

**Research Flags:**
- Phase 3 (Draft Orders): Complex behavior around inventory, async processing, rate limits. Flagged for deep research during planning.
- Phase 4 (REST API): Security patterns (HMAC signing, rate limiting) need detailed design. Flagged for deep research during planning.

**Coverage:**
- All 21 v1 requirements mapped to phases
- No orphaned requirements
- No requirements duplicated across phases

**Next Step:** Plan Phase 3 via `/gsd:plan-phase 3`

---
*Last updated: 2026-02-04*
