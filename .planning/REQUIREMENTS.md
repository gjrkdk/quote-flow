# Requirements: Shopify Price Matrix App

**Defined:** 2026-02-03
**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### App Infrastructure

- [x] **INFRA-01**: App installs via Shopify OAuth flow and persists merchant session
- [x] **INFRA-02**: Embedded app uses session token authentication (mandatory for embedded apps)
- [x] **INFRA-03**: GDPR webhook handlers respond to customer data requests and deletion (mandatory for App Store)
- [x] **INFRA-04**: API key auto-generated per store on install for storefront authentication

### Matrix Management

- [x] **MATRIX-01**: Merchant can create a price matrix with named width breakpoints and height breakpoints
- [x] **MATRIX-02**: Merchant can set a price at each width/height intersection in the matrix
- [x] **MATRIX-03**: Merchant can edit an existing matrix (add/remove breakpoints, change prices)
- [x] **MATRIX-04**: Merchant can delete a matrix
- [x] **MATRIX-05**: Merchant can assign a shared matrix to one or more products
- [x] **MATRIX-06**: Each product links to at most one matrix
- [ ] **MATRIX-07**: Merchant can create a matrix by uploading a CSV file

### Pricing API

- [x] **API-01**: REST endpoint returns price for a given product + width + height
- [x] **API-02**: API authenticates requests via X-API-Key header
- [x] **API-03**: Dimensions between breakpoints round up to the next higher breakpoint
- [x] **API-04**: API returns error for dimensions outside matrix range

### Storefront Widget

- [x] **WIDGET-01**: React component renders width and height input fields with validation
- [x] **WIDGET-02**: Price updates in real-time as customer changes dimensions
- [x] **WIDGET-03**: Add-to-cart button creates a Draft Order with the calculated price
- [x] **WIDGET-04**: Widget uses Shadow DOM for CSS isolation from host page
- [x] **WIDGET-05**: Widget published as npm package with React as peer dependency

### Orders

- [x] **ORDER-01**: Draft Order created via Shopify GraphQL API with custom locked price

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Matrix Management

- **MATRIX-08**: Merchant can duplicate an existing matrix as a starting point
- **MATRIX-09**: Merchant can export matrices to CSV

### Pricing

- **PRICE-01**: Rate limiting per store to prevent API abuse
- **PRICE-02**: Price per unit display (e.g., price per sq ft) alongside total

### Orders

- **ORDER-02**: Dimension metadata (width/height) stored as order line item properties
- **ORDER-03**: Invoice URL returned for customer to complete payment

### Storefront

- **WIDGET-06**: Preset dimension quick-select buttons for common sizes
- **WIDGET-07**: Multiple unit support (inches, cm, feet, meters)
- **WIDGET-08**: Custom dimension labels (rename width/height to domain terms)

### Platform

- **PLAT-01**: Shopify Billing API integration for merchant subscriptions
- **PLAT-02**: Visual size preview showing product at customer dimensions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Formula-based pricing | Fixed breakpoint grids cover core use case; formulas add complexity merchants don't need |
| Multiple matrices per product | Use separate products for different material pricing; keeps data model simple |
| Interpolation between breakpoints | Round-up is simpler, predictable, and ensures merchants never under-price |
| Per-customer pricing | Different domain (B2B/wholesale); adds auth/account complexity |
| Inventory tracking by dimension | Unsolvable (infinite dimension combinations); suggest made-to-order workflow |
| Product bundling | Orthogonal feature; let bundle apps handle combinations |
| Built-in shipping calculator | Shopify handles shipping natively |
| Multi-currency conversion | Shopify Markets handles this |
| Quote request workflow | Different UX pattern (async); support instant checkout only |
| Mobile native app | Responsive web widget covers mobile |
| Analytics dashboard | Shopify Analytics covers order data |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| MATRIX-01 | Phase 2 | Complete |
| MATRIX-02 | Phase 2 | Complete |
| MATRIX-03 | Phase 2 | Complete |
| MATRIX-04 | Phase 2 | Complete |
| MATRIX-05 | Phase 2 | Complete |
| MATRIX-06 | Phase 2 | Complete |
| MATRIX-07 | Phase 6 | Pending |
| API-01 | Phase 4 | Complete |
| API-02 | Phase 4 | Complete |
| API-03 | Phase 4 | Complete |
| API-04 | Phase 4 | Complete |
| WIDGET-01 | Phase 5 | Complete |
| WIDGET-02 | Phase 5 | Complete |
| WIDGET-03 | Phase 5 | Complete |
| WIDGET-04 | Phase 5 | Complete |
| WIDGET-05 | Phase 5 | Complete |
| ORDER-01 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-06 after Phase 5 completion*
