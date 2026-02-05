# Project State: Shopify Price Matrix App

**Last Updated:** 2026-02-05
**Status:** Phase 4 In Progress — Public REST API Foundation Complete

## Project Reference

**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure

**What This Is:** A public Shopify app with three components: (1) embedded admin dashboard for matrix configuration, (2) REST API for headless storefronts to fetch pricing, (3) drop-in React widget for easy integration. Merchants define breakpoint grids (width x height), assign them to products, and customers get real-time dimension-based pricing with checkout via Draft Orders.

**Current Focus:** Phase 4 in progress. Plan 04-01 complete (API auth, validation, rate limiting). Ready for Plan 04-02 (REST endpoint).

## Current Position

**Phase:** 4 of 6 (Public REST API) — IN PROGRESS
**Plan:** 1 of 4 — COMPLETE
**Status:** In progress
**Last activity:** 2026-02-05 - Completed 04-01-PLAN.md (API auth and validation foundation)

**Progress Bar:**
```
[████████████▌       ] 57% (12/21 requirements complete)

Phase 1: Foundation & Authentication       [██████████] 3/3 ✓
Phase 2: Admin Matrix Management           [██████████] 5/5 ✓
Phase 3: Draft Orders Integration          [██████████] 1/1 ✓
Phase 4: Public REST API                   [██▌       ] 1/4
Phase 5: React Widget (npm Package)        [          ] 0/5
Phase 6: Polish & App Store Preparation    [          ] 0/1
```

## Performance Metrics

**Velocity:** 3.0 min/plan (10 plans completed)
**Blockers:** 0
**Active Research:** 0

**Phase History:**
| Phase | Plan | Completed | Duration | Status |
|-------|------|-----------|----------|--------|
| 01-foundation-authentication | 01 | 2026-02-04 | 5min | ✓ Complete |
| 01-foundation-authentication | 02 | 2026-02-04 | 3min | ✓ Complete |
| 01-foundation-authentication | 03 | 2026-02-04 | 5min | ✓ Complete |
| 02-admin-matrix-management | 01 | 2026-02-04 | 2min | ✓ Complete |
| 02-admin-matrix-management | 02 | 2026-02-04 | 3min | ✓ Complete |
| 02-admin-matrix-management | 03 | 2026-02-04 | 3min | ✓ Complete |
| 02-admin-matrix-management | 04 | 2026-02-04 | 4min | ✓ Complete |
| 02-admin-matrix-management | 05 | 2026-02-04 | UAT | ✓ Complete |
| 03-draft-orders-integration | 01 | 2026-02-05 | 4min | ✓ Complete |
| 03-draft-orders-integration | 02 | 2026-02-05 | 2min | ✓ Complete |
| 03-draft-orders-integration | 03 | 2026-02-05 | UAT | ✓ Complete |
| 04-public-rest-api | 01 | 2026-02-05 | 2min | ✓ Complete |

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
- **[01-02]** Single API key per store: Simplest approach for v1, matches most Shopify apps
- **[01-02]** One-time API key viewing: Security best practice (show full key only on generation)
- **[01-02]** Manual welcome card dismissal: Merchants control when to dismiss (per CONTEXT.md)
- **[01-02]** pm_ API key prefix: Industry convention for easy identification
- **[01-03]** Polaris-styled error boundaries in both root.tsx and app.tsx for consistent UX
- **[02-01]** Position-based cell references: Use widthPosition/heightPosition integers instead of value-based references for simpler grid logic
- **[02-01]** Cascade deletes: Configure ON DELETE CASCADE for all matrix relations (automatic cleanup)
- **[02-01]** One matrix per product: Unique constraint on ProductMatrix.productId enforces MATRIX-06 requirement
- **[02-01]** Auto-save unit preference: Immediate save on change using useFetcher pattern (no separate button)
- **[02-02]** Template breakpoints in mm with cm conversion: Small (3x3: 300/600/900mm), Medium (5x5: 200/400/600/800/1000mm), Custom (empty)
- **[02-02]** Matrix duplicate behavior: Copy name with "(copy)" suffix, copy all breakpoints and cells, do NOT copy product assignments
- **[02-02]** Matrix initialization pattern: Transaction creates matrix + breakpoints + zero-value cells atomically
- **[02-03]** Custom HTML table over Polaris DataGrid: Needed full control for spreadsheet-like behavior with inline editing, tab navigation, and dynamic breakpoint headers
- **[02-03]** Map with string keys for cells: Using Map<string, number> with 'col,row' keys provides O(1) cell lookups and natural fit for sparse 2D data
- **[02-03]** Cell re-indexing on breakpoint changes: When breakpoints added/removed in middle of array, all cells re-indexed to maintain position consistency with sorted breakpoints
- **[02-03]** Client-side empty cell validation: Highlights empty cells with red background before save, provides clear visual feedback for required fields
- **[02-04]** Product assignments persist immediately (not part of matrix save flow): Separate actions for assign/remove provide instant feedback without coupling to matrix save
- **[02-04]** GID format normalization: Resource Picker returns various GID formats, always normalize to gid://shopify/Product/{id} for consistency
- **[02-04]** Conflict modal pattern: Two-submit pattern (detect conflicts on first submit, show modal, confirm on second submit) prevents accidental reassignments
- **[03-01]** Breakpoint lookup algorithm: Use findIndex with dimension <= breakpoint.value for natural round-up behavior
- **[03-01]** Pure function design: Accept MatrixData as parameter instead of querying database (enables testing without mocking)
- **[03-03]** Custom line items for Draft Orders: Shopify ignores originalUnitPrice when variantId is present. Use title + originalUnitPrice for custom pricing.
- **[03-03]** Dimensions in display unit: Pass dimensions directly without mm/cm conversion. Breakpoints stored in merchant's display unit.
- **[04-01]** Zod for API input validation: Use z.coerce.number() for automatic string-to-number conversion in query params
- **[04-01]** RFC 7807 error format for all API responses: Consistent machine-readable error structure with type, title, status, detail fields
- **[04-01]** In-memory rate limiting: 100 requests per 15-minute window per store, single-instance only (Redis migration needed for multi-instance)
- **[04-01]** Product ID normalization to GID format: Always normalize to gid://shopify/Product/{id} for consistency with ProductMatrix table
- **[04-01]** Same error message for enumeration prevention: Return "Invalid API key" for both missing store and wrong key to prevent enumeration attacks

**Pending:**
- Pricing model (subscription vs one-time) - decided during Phase 6

### Open Todos

**Immediate:**
- [ ] Execute Plan 04-02 (REST endpoint implementation)

**Upcoming:**
- [ ] Research widget packaging patterns during Phase 5 planning

### Known Blockers

(None)

### Anti-Patterns to Avoid

From research:
1. Third-party cookies for embedded sessions - use session tokens
2. Prisma connection exhaustion on Vercel - configure pooling from start
3. Missing GDPR webhooks - register in Phase 1 ✓
4. Draft Orders rate limits - implement retry logic in Phase 3 ✓
5. API without HMAC verification - design into Phase 4 from start
6. **Shopify originalUnitPrice + variantId** - originalUnitPrice is ignored when variantId is present. Use custom line items for custom pricing.

### Lessons Learned

- **[01-UAT]** Polaris CSS must be explicitly imported via `links` export — AppProvider alone doesn't load styles
- **[01-UAT]** Root ErrorBoundary needs its own Polaris CSS import since it renders outside the app layout
- **[02-UAT]** In embedded Shopify apps with `unstable_newEmbeddedAuthStrategy`, never use Polaris `url` props for navigation. Always use Remix's `useNavigate` for client-side navigation to preserve session token context.
- **[02-UAT]** Never call `navigate()` during render. Use `useEffect` or server-side `redirect()`.
- **[03-UAT]** Shopify DraftOrderLineItemInput ignores `originalUnitPrice` when `variantId` is present. Use custom line items (title + originalUnitPrice) for matrix pricing.
- **[03-UAT]** Breakpoints are stored in merchant's display unit. Don't convert dimensions before price calculation.
- **[03-UAT]** Shopify protected customer data access must be configured in Partner Dashboard before using DraftOrder API.

## Session Continuity

**Last session:** 2026-02-05
**Stopped at:** Completed 04-01-PLAN.md (API auth and validation foundation)
**Resume file:** None

**What Just Happened:**
- Executed Plan 04-01: Created API authentication, validation, and rate limiting utilities
- Installed zod@4.3.6 for input validation with coercion
- Created authenticateApiKey middleware with timing-safe comparison
- Created in-memory rate limiter (100 req/15min per store)
- All error responses follow RFC 7807 format

**What Comes Next:**
- Plan 04-02: REST endpoint implementation (GET /api/prices/:productId)
- Compose authenticateApiKey + checkRateLimit + price calculation
- Use PriceQuerySchema for query parameter validation
- Return price response with rate limit headers

**Context for Next Agent:**
- Phase 4 Plan 01 complete: Authentication, validation, and rate limiting foundation ready
- New utilities: authenticateApiKey, checkRateLimit, PriceQuerySchema, ProductIdSchema, normalizeProductId
- Existing services: price-calculator.server.ts (calculatePrice), draft-order.server.ts
- Database: Store (with apiKeyHash), PriceMatrix, ProductMatrix, Breakpoint, MatrixCell
- All error responses use RFC 7807 format (type, title, status, detail)
- Rate limiting is in-memory (single-instance only, Redis migration needed for multi-instance)
- Database running on localhost:5400
- Dependencies: zod@4.3.6, exponential-backoff

---
*State tracked since: 2026-02-03*
