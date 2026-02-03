# Project Research Summary

**Project:** Shopify Price Matrix App
**Domain:** Shopify Embedded App + Public API + npm Widget
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

This project is a Shopify embedded app enabling merchants to sell custom-dimension products (flooring, blinds, wallpaper, fabric, signage) using breakpoint-based pricing grids. The market is divided between formula-based calculators and fixed-grid matrices—this app takes the fixed-grid approach for simplicity and merchant usability.

The architecture requires three distinct components: (1) embedded admin app for merchants to configure matrices, (2) public REST API for headless storefronts to fetch pricing, and (3) React widget as an npm package for drop-in integration. The recommended stack centers on Remix (via Shopify's official template), Prisma with PostgreSQL, and Vercel deployment with connection pooling. While Shopify now recommends React Router for new apps, Remix remains fully functional and provides cleaner separation for this dual-architecture project.

Critical risks stem from Shopify's evolving platform: third-party cookie blocking requires session tokens, connection exhaustion breaks serverless deployments, and GDPR webhooks are mandatory for app store approval. The winning strategy is to build the admin matrix management first (validates pricing logic), then layer on the API (enables headless), then ship the widget (maximizes reach). Fast setup and transparency beat feature complexity—merchants want pricing grids they can configure in 30 minutes, not formula builders that take days.

## Key Findings

### Recommended Stack

**Shopify has deprecated Polaris React** (Jan 2026) and now recommends React Router over Remix, but Remix remains viable for this project's dual architecture. The official Shopify template still uses Remix, and migration paths exist when needed.

**Core technologies:**
- **Remix** (via `@shopify/shopify-app-remix` 4.1.0): Embedded admin app with built-in OAuth, session management, and App Bridge
- **Prisma ORM 7.2.0+**: Official Shopify session storage adapter, Rust-free version is 90% smaller and 3x faster
- **PostgreSQL (Neon)**: Serverless Postgres with Vercel integration, pooled connections for serverless compatibility
- **Polaris Web Components** (CDN): Framework-agnostic replacement for deprecated Polaris React
- **Vite 7.x**: Modern build tool for React widget library mode with CSS injection plugin
- **Vercel**: Native Remix support with serverless functions for both admin and API routes
- **Node.js 20 LTS**: Required for Polaris v13+, Vercel default runtime

**Critical version notes:**
- Do NOT use `@shopify/polaris` npm package (deprecated)
- Use Shopify GraphQL Admin API exclusively (REST API deprecated Oct 2024)
- Neon pooled connections require `-pooler` hostname suffix
- Draft Orders API supports custom prices via `lineItem.priceOverride`

### Expected Features

**Must have (table stakes):**
- Dimension input UI with real-time price display
- Add-to-cart integration via Draft Orders API
- Admin dashboard for matrix CRUD (Polaris embedded app)
- Mobile-responsive widget (70%+ traffic)
- Order metadata (dimensions in order details for fulfillment)
- Product assignment (one matrix per product)
- Multiple unit support (inches, feet, cm, meters)

**Should have (competitive advantages):**
- **Headless/API-first architecture** — REST endpoints for custom storefronts (primary differentiator)
- **React widget (drop-in)** — Pre-built component for npm installation
- Breakpoint rounding logic (handles in-between dimensions)
- API key authentication per store (secure headless integration)
- Bulk matrix import/export (CSV for fast setup)
- Preset dimension options (common sizes as buttons)

**Defer to v2+:**
- Visual size preview (shows product resized to dimensions)
- Quantity breaks (discount for multiple units)
- Formula/equation builder (anti-feature—too complex)
- 3D dimensions (2D covers 90% of use cases)
- Per-customer pricing (different domain, B2B complexity)
- Inventory tracking by dimension (unsolvable problem)

**Anti-features to explicitly avoid:**
- Theme script injection (causes ghost code on uninstall)
- Formula builders (merchants prefer simple grids)
- Unlimited dimensions (2D sufficient)
- Third-party cookies (breaks in Safari/Firefox)

### Architecture Approach

Three-tier architecture with unidirectional data flow: Admin → Database ← API ← Widget. The database is the single source of truth with multi-tenant isolation via shop domain filtering.

**Major components:**

1. **Embedded Admin App** (Remix on Vercel)
   - OAuth installation and session token authentication
   - Matrix CRUD with Polaris UI
   - Product assignment interface
   - API key generation for public API
   - Draft Order creation with custom pricing

2. **Database Layer** (Prisma + PostgreSQL)
   - Multi-tenant data isolation (shop domain filter on all queries)
   - Tables: Session (Shopify), Shop (metadata + API keys), Matrix (breakpoints + prices), ProductMatrix (assignments)
   - Connection pooling required for serverless (Prisma Accelerate or Neon pooler)

3. **Public REST API** (Remix API routes)
   - API key authentication (HMAC-signed requests)
   - Versioned endpoints (`/api/v1/...`)
   - Price lookup with breakpoint rounding
   - Rate limiting per shop
   - CORS configuration for storefront domains

4. **React Widget** (npm package via Vite)
   - Shadow DOM for CSS isolation
   - Dimension input and price display
   - Fetches from REST API
   - Published with React/ReactDOM as peerDependencies

**Key patterns:**
- Session tokens (not cookies) for embedded app auth
- Prisma Client extensions for automatic shop filtering
- API versioning for backward compatibility
- Shadow DOM prevents host page CSS conflicts
- Theme App Extensions (not script tags) for theme integration

### Critical Pitfalls

1. **Third-party cookies for embedded sessions** — Use Shopify session tokens (JWT) with App Bridge, never cookies. Safari/Firefox block third-party cookies, breaking embedded apps. This is a mandatory app store check.

2. **Prisma connection exhaustion on Vercel** — Serverless functions open new DB connections per invocation. Without pooling, hits Postgres connection limit (100) and crashes. Use Prisma Accelerate, Neon pooler, or `connection_limit=1`.

3. **Missing GDPR webhooks** — Public apps require `customers/data_request`, `customers/redact`, `shop/redact` webhooks. Automatic app store rejection if missing. Must delete data within 30 days.

4. **Theme code not removed on uninstall** — Legacy Script Tag API leaves ghost code breaking merchant sites. Use Theme App Extensions (auto-removed) or npm widget (no theme injection).

5. **Draft Orders API rate limits** — 5/minute on dev stores, 2/second on production. Implement exponential backoff with jitter, check `Retry-After` header, queue bulk operations.

6. **REST API without HMAC verification** — API key alone insufficient; attackers can replay/modify requests. Use HMAC-SHA256 request signing with timestamp validation (reject if >5 minutes old).

7. **Draft Orders inventory confusion** — Draft Orders DO NOT reduce inventory until completed. Use `reserve_inventory_until` but only works with default location. Query InventoryLevel before creating draft order.

8. **Webhook delivery assumptions** — Webhooks are best-effort, not guaranteed. Implement reconciliation jobs polling GraphQL every 15 minutes for `updatedAt > last_sync_time`. Make handlers idempotent.

9. **Over-requesting access scopes** — Only request scopes needed NOW. For this app: `read_products`, `write_draft_orders`, `read_price_rules`. Excessive scopes lower install conversion and increase security risk.

10. **npm package security vulnerabilities** — CVE-2025-55182 (React 19.0-19.2.0 RCE) requires React 19.2.1+. Run `npm audit --production` before publishing. Use `.npmignore` or `"files": ["dist"]` to exclude dev dependencies.

## Implications for Roadmap

Based on research, suggested phase structure mirrors the dependency chain: foundation → admin data layer → API → widget → polish.

### Phase 1: Foundation & Authentication
**Rationale:** Everything depends on working auth and database. Multi-tenant isolation must be correct from day one—retrofitting is dangerous.

**Delivers:**
- Shopify OAuth installation flow
- Session token authentication (App Bridge)
- Prisma schema with multi-tenant models
- Database connection pooling (Neon or Accelerate)
- GDPR webhook handlers (mandatory for app store)

**Critical pitfalls to avoid:**
- Pitfall #2: Use session tokens, not cookies
- Pitfall #4: Configure connection pooling NOW
- Pitfall #3: Register GDPR webhooks early

**Research flag:** Standard Shopify auth patterns, skip deep research. Follow official template.

---

### Phase 2: Admin Matrix Management
**Rationale:** Creates the data that API/widget will consume. Merchants need this before anything else is useful. Validates pricing logic in embedded context before exposing to headless.

**Delivers:**
- Embedded Polaris dashboard
- Matrix CRUD UI (create/edit/delete pricing grids)
- Product assignment interface
- Breakpoint rounding logic
- GraphQL queries to Shopify for product data

**Uses:**
- Polaris Web Components (loaded via CDN)
- Prisma for matrix storage
- Shop domain filtering for multi-tenant isolation

**Critical pitfalls to avoid:**
- Pitfall #1: Use Theme App Extensions, not script tags
- Ensure all queries filter by `session.shop`

**Research flag:** Standard CRUD patterns with Polaris. No deep research needed.

---

### Phase 3: Draft Orders Integration
**Rationale:** Proves the pricing works end-to-end in Shopify's ecosystem before building public API. Merchants can test with embedded stores before headless customers use it.

**Delivers:**
- Draft Order creation with custom prices
- Dimension metadata in orders (for fulfillment)
- Inventory validation before order creation
- Rate limit handling with exponential backoff

**Addresses pitfalls:**
- Pitfall #5: Implement retry logic for rate limits
- Pitfall #7: Inventory doesn't reduce until completion
- Pitfall #8: Handle async draft order creation (202 status)

**Research flag:** NEEDS DEEP RESEARCH. Draft Orders have complex behavior (inventory, async, rate limits). Plan for `/gsd:research-phase` when detailing this phase.

---

### Phase 4: Public REST API
**Rationale:** Enables headless storefront integration—the primary differentiator. Widget is useless without API. Can test API independently before widget exists.

**Delivers:**
- API key generation per shop
- API key authentication middleware
- Price lookup endpoints (`GET /api/v1/products/:id/price`)
- HMAC request signing
- Rate limiting per shop
- CORS configuration
- API versioning (`/api/v1/...`)

**Uses:**
- Remix API routes (same Vercel deployment)
- Prisma queries with shop filter
- Draft Orders API for order creation endpoint

**Critical pitfalls to avoid:**
- Pitfall #6: HMAC signatures required, not just API keys
- Pitfall #10: Version API from start (`/api/v1/...`)

**Research flag:** NEEDS DEEP RESEARCH. API security patterns (HMAC, rate limiting) need detailed design. Plan for `/gsd:research-phase`.

---

### Phase 5: React Widget (npm Package)
**Rationale:** Completes headless offering. Merchants can drop into storefronts without custom development. Depends on working API.

**Delivers:**
- React component with Shadow DOM
- Dimension input UI
- Price display with loading/error states
- API client for price fetching
- Vite library build configuration
- npm package publishing

**Uses:**
- Vite 7.x with library mode
- `vite-plugin-lib-inject-css` for CSS handling
- `vite-plugin-externalize-deps` to prevent bundling React
- Shadow DOM for CSS isolation

**Critical pitfalls to avoid:**
- Pitfall #14: Run `npm audit --production`, fix React CVE
- Don't bundle React/ReactDOM (use peerDependencies)

**Research flag:** Standard React widget patterns. Vite library mode is well-documented. Skip deep research.

---

### Phase 6: Polish & App Store Preparation
**Rationale:** Final touches to meet app store requirements and merchant expectations.

**Delivers:**
- Bulk matrix import/export (CSV)
- Preset dimension buttons
- Mobile optimization
- Accessibility compliance (WCAG 2.1 AA)
- Production OAuth flow testing
- Vercel environment variable configuration
- Documentation and README

**Addresses pitfalls:**
- Pitfall #13: Test OAuth on production URL
- Pitfall #15: Polaris accessibility audit
- Pitfall #19: Configure Vercel env vars

**Research flag:** No deep research. Checklist-driven phase.

---

### Phase Ordering Rationale

**Why this sequence:**
1. **Foundation first** — Auth and database are load-bearing; wrong decisions are expensive to fix
2. **Admin before API** — Validates pricing logic in controlled embedded environment before exposing to public
3. **Draft Orders after CRUD** — Need matrix data to test pricing; proves integration with Shopify ecosystem
4. **API after Draft Orders** — Reuses draft order logic, but adds auth layer and headless concerns
5. **Widget last** — Completely dependent on API; can be developed independently once API stable
6. **Polish as final phase** — Nice-to-haves that don't block core functionality

**Dependency chains from architecture:**
- Matrix CRUD → Breakpoint Rounding → Price Display → Draft Orders
- API Auth → REST Endpoints → Headless Support
- REST API → React Widget → Theme Compatibility

**Pitfall mitigation:**
- High-risk decisions (connection pooling, session tokens) in Phase 1
- GDPR compliance early (Phase 1) avoids app store rejection
- Draft Orders complexity isolated in Phase 3 (can research deeply)
- API security patterns (HMAC) built into Phase 4 from start

### Research Flags

**Phases needing deeper research:**
- **Phase 3 (Draft Orders):** Complex behavior around inventory, async processing, rate limits. Sparse documentation on edge cases. Recommend `/gsd:research-phase draft-orders` when planning.
- **Phase 4 (REST API):** Security patterns (HMAC signing, rate limiting) need detailed design. API versioning strategy. Recommend `/gsd:research-phase api-security`.

**Phases with standard patterns (skip research):**
- **Phase 1 (Foundation):** Official Shopify template handles auth. Prisma docs cover connection pooling.
- **Phase 2 (Admin CRUD):** Standard Remix + Polaris patterns, well-documented.
- **Phase 5 (Widget):** Vite library mode guides available, Shadow DOM patterns established.
- **Phase 6 (Polish):** Checklist execution, no novel patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All technologies have official Shopify adapters or verified community usage. Remix template is production-ready despite React Router recommendation. |
| Features | **HIGH** | Validated across 10+ competitor apps and merchant reviews. Table stakes are consistent; differentiators (headless/API) align with Shopify 2026 trends. |
| Architecture | **HIGH** | Three-tier pattern is standard for Shopify apps with public APIs. Multi-tenant isolation and session tokens are well-documented. Shadow DOM for widgets has multiple production implementations. |
| Pitfalls | **HIGH** | All critical pitfalls verified with official Shopify docs. Draft Orders behavior confirmed in API reference. Security vulnerabilities (React CVE) from official advisories. |

**Overall confidence:** **HIGH**

All core decisions backed by official documentation or authoritative sources. The main uncertainty is Remix vs React Router (Shopify's recommendation shifted in late 2025), but Remix template remains fully supported with clear migration path.

### Gaps to Address

**During Phase 3 (Draft Orders) planning:**
- **Draft Orders vs Cart Transform API:** Research which provides better headless experience. Draft Orders proven but may be legacy path; Cart Transform is newer. Current recommendation is Draft Orders (documented, stable), but validate when planning Phase 3.
- **Multi-location inventory:** Draft Orders only use default location for `reserve_inventory_until`. How to handle merchants with multiple fulfillment locations?

**During Phase 4 (API) planning:**
- **Rate limiting implementation:** Redis-backed rate limiting scales better than in-memory but adds infrastructure. At what scale to switch? Current recommendation: start with in-memory Map, plan Redis migration at 1K+ shops.
- **API key rotation:** How often to rotate? What's the migration path for active integrations?

**During Phase 5 (Widget) planning:**
- **Widget adoption hypothesis:** Will headless merchants actually use pre-built widget, or prefer building custom? Consider analytics to track npm package usage vs direct API calls.

**Before app submission:**
- **Pricing model:** One-time purchase vs subscription vs usage-based? Not addressed in research—needs validation with target merchants. Recommend pricing research during Phase 6.

## Sources

### Primary (HIGH confidence)
- [Shopify Remix Template](https://github.com/Shopify/shopify-app-template-remix) — Official app template with OAuth, session storage
- [Shopify API Docs: Session Tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens) — Embedded app auth pattern
- [Shopify API Docs: Privacy Compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance) — GDPR webhook requirements
- [Shopify API Docs: Rate Limits](https://shopify.dev/docs/api/usage/limits) — Draft Orders rate limits
- [Shopify API Docs: DraftOrder](https://shopify.dev/docs/api/admin-rest/latest/resources/draftorder) — Inventory behavior, async processing
- [Prisma Deploy to Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel) — Connection pooling strategies
- [React Security Advisory CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) — Widget security
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/using-polaris-components) — UI component migration

### Secondary (MEDIUM confidence)
- [Gadget: Pass Shopify App Review](https://gadget.dev/blog/how-to-pass-the-shopify-app-store-review-the-first-time-part-1-the-technical-bit) — Common rejection reasons
- [Hookdeck: Shopify Webhooks Guide](https://hookdeck.com/webhooks/platforms/shopify-webhooks-best-practices-revised-and-extended) — Webhook reliability patterns
- [Kirill Platonov: Rate Limit Strategies](https://kirillplatonov.com/posts/shopify-api-rate-limits/) — Retry logic implementation
- [Vercel Connection Pooling](https://vercel.com/kb/guide/connection-pooling-with-functions) — Serverless database patterns
- [Shopify App Store Requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) — Performance, UX requirements
- Community discussions on Draft Orders limitations, Remix vs React Router

### Tertiary (LOW confidence, needs validation)
- Matrix size limits (100x100 recommendation based on competitor analysis, not official limit)
- Headless adoption rates (20-30% estimate from general Shopify trends, not app-specific data)
- Pricing model best practices (inferred from competitor apps, needs merchant validation)

---

**Research completed:** 2026-02-03
**Ready for roadmap:** YES

**Next step:** Roadmapper agent can use this summary to structure detailed phase requirements. High-risk phases (Draft Orders, API Security) flagged for deeper research during planning.
