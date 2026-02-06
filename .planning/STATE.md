# Project State: Shopify Price Matrix App

**Last Updated:** 2026-02-06
**Status:** Phase 6 Complete — All Polish & App Store Preparation Complete

## Project Reference

**Core Value:** Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure

**What This Is:** A public Shopify app with three components: (1) embedded admin dashboard for matrix configuration, (2) REST API for headless storefronts to fetch pricing, (3) drop-in React widget for easy integration. Merchants define breakpoint grids (width x height), assign them to products, and customers get real-time dimension-based pricing with checkout via Draft Orders.

**Current Focus:** Phase 6 complete. All plans finished: 06-01 (CSV parser), 06-02 (Freemium billing), 06-03 (Accessibility & Responsive UI), 06-04 (CSV Import & Freemium Gating). Ready for App Store submission.

## Current Position

**Phase:** 6 of 6 (Polish & App Store Preparation)
**Plan:** 4 of 4 complete
**Status:** Phase complete
**Last activity:** 2026-02-06 - Completed 06-04-PLAN.md (CSV Import & Freemium Gating)

**Progress Bar:**
```
[█████████████████████] 100% (23/23 requirements complete)

Phase 1: Foundation & Authentication       [██████████] 3/3 ✓
Phase 2: Admin Matrix Management           [██████████] 5/5 ✓
Phase 3: Draft Orders Integration          [██████████] 3/3 ✓
Phase 4: Public REST API                   [██████████] 3/3 ✓
Phase 5: React Widget (npm Package)        [██████████] 4/4 ✓
Phase 6: Polish & App Store Preparation    [██████████] 4/4 ✓
```

## Performance Metrics

**Velocity:** 6.6 min/plan (21 plans completed)
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
| 04-public-rest-api | 02 | 2026-02-05 | 2min | ✓ Complete |
| 04-public-rest-api | 03 | 2026-02-06 | 5min | ✓ Complete |
| 05-react-widget | 01 | 2026-02-06 | 63min | ✓ Complete |
| 05-react-widget | 02 | 2026-02-06 | 2min | ✓ Complete |
| 05-react-widget | 03 | 2026-02-06 | 2min | ✓ Complete |
| 05-react-widget | 04 | 2026-02-06 | 7min | ✓ Complete |
| 06-polish-app-store-preparation | 01 | 2026-02-06 | 2min | ✓ Complete |
| 06-polish-app-store-preparation | 02 | 2026-02-06 | 3min | ✓ Complete |
| 06-polish-app-store-preparation | 03 | 2026-02-06 | 2min | ✓ Complete |
| 06-polish-app-store-preparation | 04 | 2026-02-06 | 4min | ✓ Complete |

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
- **[04-02]** CORS on all responses: withCors() wrapper adds CORS headers to success and error responses for headless storefront integration
- **[04-02]** Store ownership validation: lookupProductMatrix validates matrix belongs to authenticated store (prevents cross-store access)
- **[04-02]** Resource routes for REST endpoints: Export loader/action with no default export for REST API endpoints
- **[04-02]** Generic 500 errors: Never expose internal details in error responses (console.error for debugging)
- **[04-03]** Null query param handling: searchParams.get() returns null not undefined; filter before Zod parsing for .default() to work
- **[05-01]** Currency field in Store model: ISO 4217 currency code with USD default for price formatting
- **[05-01]** Dimension ranges from breakpoints: Calculate min/max from first/last breakpoint values for client-side validation hints
- **[05-01]** Draft Order REST endpoint authentication: Create Shopify admin GraphQL client from store's access token (REST pattern, not embedded app auth)
- **[05-01]** Draft Order invoiceUrl as checkoutUrl: GraphQL mutation selects invoiceUrl for customer-facing checkout redirect
- **[05-02]** React as peer dependency: React and react-dom in both peerDependencies and devDependencies (consumer provides React, build uses local copy)
- **[05-02]** 3 required props (apiUrl, apiKey, productId): Minimal API surface for v1, no hardcoded defaults
- **[05-02]** Theme props as CSS custom properties: 6 optional props mapping to CSS vars (primaryColor, textColor, borderColor, borderRadius, fontSize, errorColor)
- **[05-02]** Single callback pattern: onAddToCart fires when Draft Order created, payload includes draftOrderId, checkoutUrl, price, total, dimensions, quantity
- **[05-02]** Internal types not exported: API response types defined but not exposed in public API
- **[05-03]** 400ms debounce timing: Within 300-500ms range per CONTEXT.md, balances responsiveness with API rate limiting
- **[05-03]** CSS shimmer skeleton for Shadow DOM: Custom CSS animation instead of react-loading-skeleton (library's style injection incompatible with Shadow DOM)
- **[05-03]** AbortController for request cancellation: Cancels in-flight requests when dimension inputs change to prevent race conditions
- **[05-03]** Metadata caching pattern: Store currency/unit/dimensionRange on first successful fetch (these don't change for a product)
- **[05-04]** CSS as TypeScript export: Using styles.ts instead of .css file avoids CSS import issues in Vite library mode. CSS string injected via <style> tag inside Shadow DOM.
- **[05-04]** Theme prop runtime customization: 6 optional theme properties map to CSS custom properties as inline styles on Shadow DOM root for runtime theming without CSS rebuilds
- **[05-04]** Client-side dimension validation: Widget validates dimensions are numeric and within dimensionRange before enabling add-to-cart, showing inline error messages
- **[05-04]** Checkout redirect flow: Add-to-cart creates Draft Order, calls onAddToCart callback, then redirects to checkout URL via window.location.href
- **[06-01]** csv-parse library for CSV parsing: Industry-standard parser with robust edge case handling (malformed rows, varied column counts)
- **[06-01]** 1MB CSV file size limit: Prevents resource exhaustion and DoS attacks via oversized file uploads
- **[06-01]** Position-based cell mapping: Cell keys use widthIdx,heightIdx matching Phase 2 matrix structure for seamless integration
- **[06-01]** Last-value-wins for duplicate entries: Simple conflict resolution for duplicate width/height pairs without requiring user intervention
- **[06-01]** Automatic header detection: First row checked for "width", "height", or "price" keywords to skip headers automatically
- **[06-01]** Error collection pattern: Continue parsing to collect ALL errors (not fail-fast) so users can fix multiple issues at once
- **[06-02]** Freemium plan pricing: $12/month with 14-day trial for unlimited matrices and CSV import
- **[06-02]** Free tier limit: 1 matrix with full functionality (no feature gating except CSV import)
- **[06-02]** isTest flag from NODE_ENV: Development mode uses isTest=true to prevent charging test stores
- **[06-02]** Billing check utilities pattern: checkBillingStatus, requirePaidPlan, canCreateMatrix for consistent billing enforcement across routes
- **[06-03]** W3C ARIA grid pattern with roving tabindex: App Store requires WCAG 2.1 AA compliance. ARIA grid pattern provides full keyboard navigation for matrix editor.
- **[06-03]** Polaris Grid for responsive dashboard layout: Built-in Shopify component with consistent breakpoints (xs/sm/md/lg/xl) for 2-column desktop, 1-column tablet/mobile.
- **[06-03]** Preserve horizontal scroll on matrix grid: Existing decision from Phase 2. Large grids need horizontal scroll on small screens; ARIA pattern doesn't conflict with scrolling.
- **[06-04]** CSV Import as 4th template option: Added alongside Small, Medium, Custom templates for clear selection in ChoiceList
- **[06-04]** Freemium UI pattern: Free merchants see upgrade banner instead of file upload, paid merchants get full CSV import flow
- **[06-04]** CSV preview before creation: Show parsed grid with dimensions and prices to catch errors before database commit
- **[06-04]** Multi-intent form pattern: Single action handler routes upgrade, preview_csv, confirm_csv, create via intent parameter
- **[06-04]** Client-side CSV reading: FileReader API reads file as text, avoids multipart/form-data complexity
- **[06-04]** Matrix limit enforcement for all templates: canCreateMatrix check applied to create and confirm_csv intents (prevents free-tier bypass)

**Pending:**
- None

### Open Todos

**Immediate:**
- [ ] Plan Phase 5 (React Widget)

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

**Last session:** 2026-02-06
**Stopped at:** Completed 06-04-PLAN.md (CSV Import & Freemium Gating)
**Resume file:** None

**What Just Happened:**
- Executed Plan 06-04: CSV Import & Freemium Gating
- Added CSV Import as 4th template option in create matrix page
- Implemented file upload with DropZone for paid merchants
- Added upgrade banner for free merchants (CSV is paid feature)
- Built CSV preview flow with grid display, error list, and validation
- Created matrix from CSV via Prisma transaction (breakpoints + cells)
- Enforced free-tier limit (1 matrix) for ALL templates (Small, Medium, Custom, CSV)
- Added upgrade flow via Shopify billing.require() redirect
- Task commit: 6d67999 (feat)

**What Comes Next:**
- Phase 6 complete! All 4 plans finished.
- All project requirements complete (23/23 = 100%)
- Ready for App Store submission and production deployment

**Context for Next Agent:**
- CSV import feature complete with preview and error handling
- Freemium business model enforced across all matrix creation paths
- All 6 phases complete: Foundation → Admin → Orders → API → Widget → Polish
- App is production-ready

---
*State tracked since: 2026-02-03*
