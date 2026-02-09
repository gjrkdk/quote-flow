# Shopify Price Matrix App (QuoteFlow)

## What This Is

A public Shopify app that lets merchants create dimension-based price matrices (width x height) and assign them to products. Merchants manage matrices through an embedded dashboard in Shopify admin using Polaris. Headless storefront customers get real-time pricing through a REST API and a drop-in React widget published on npm. Orders are created via Shopify Draft Orders with custom locked prices. Deployed at quote-flow-one.vercel.app with Neon PostgreSQL.

## Core Value

Merchants can offer custom-dimension pricing on their headless Shopify storefronts without building their own pricing infrastructure.

## Requirements

### Validated

- ✓ Merchant can create a price matrix with fixed width and height breakpoints and a price at each intersection — v1.0
- ✓ Merchant can assign a shared matrix to multiple products (one matrix per product) — v1.0
- ✓ Merchant can manage matrices through an embedded Polaris dashboard in Shopify admin — v1.0
- ✓ Headless storefront can look up price by product + width + height via REST API — v1.0
- ✓ Prices round up to the next breakpoint when customer dimensions fall between defined steps — v1.0
- ✓ Storefront customers see a drop-in React widget with dimension inputs, live price display, and add-to-cart — v1.0
- ✓ Orders are created as Shopify Draft Orders with the custom calculated price locked in — v1.0
- ✓ Each store gets an API key for storefront-to-API authentication — v1.0
- ✓ App is installable as a public Shopify app (App Store listed) — v1.0
- ✓ Widget published to npm as quote-flow with README, types, peer dependencies — v1.1
- ✓ Widget package version follows semver (0.1.0), build artifacts verified — v1.1
- ✓ App deployed to Vercel with production PostgreSQL and stable URL — v1.1
- ✓ Production environment variables configured — v1.1
- ✓ App serves embedded admin UI and REST API endpoints on production — v1.1
- ✓ App registered in Shopify Partner Dashboard with correct OAuth redirects and scopes — v1.1
- ✓ Installable via direct install link — v1.1
- ✓ OAuth install flow works end-to-end on production — v1.1
- ✓ Full E2E flow verified in production: install → matrix → API → widget → Draft Order — v1.1
- ✓ Widget published on npm works in external projects — v1.1

### Active

<!-- v1.2 Option Groups & App Store -->

- [ ] Merchant can create reusable option groups with named choices (e.g. "Glass Type": Clear, Tempered, Laminated)
- [ ] Each option choice has a price modifier — either fixed amount or percentage of base matrix price
- [ ] Merchant can assign option groups to products (shared across products, multiple groups per product)
- [ ] Option modifiers stack on the base matrix price, percentages calculated from base (not compounded)
- [ ] REST API accepts option selections and returns the modified total price
- [ ] Widget renders option group dropdowns alongside dimension inputs with live price updates
- [ ] App submitted to Shopify App Store and passes review

### Out of Scope

- Formula-based pricing — v1 uses fixed breakpoint matrices only
- ~~Add-on options~~ — Now in scope as option groups for v1.2
- Multiple matrices per product — use separate products for different material pricing
- Interpolation between breakpoints — round-up strategy keeps it simple and predictable
- Non-headless storefronts — this targets headless/custom storefronts specifically
- OAuth/Storefront token auth — custom API key is simpler for headless integration

### Deferred (from v1.0)

- MATRIX-08: Duplicate matrix
- MATRIX-09: Export matrices to CSV
- PRICE-02: Price per unit display
- ORDER-02: Dimension metadata as line item properties
- ORDER-03: Invoice URL for customer payment
- WIDGET-06: Preset dimension quick-select
- WIDGET-07: Multiple unit support
- WIDGET-08: Custom dimension labels
- PLAT-02: Visual size preview

## Context

- **Target merchants:** Shops selling custom-cut or custom-sized products (glass, fabric, wood, metal, etc.) on headless Shopify storefronts
- **Pricing model:** Fixed breakpoint grid — merchants define discrete width steps, height steps, and a price at each (width, height) intersection. Customer dimensions snap up to the next higher step.
- **Storefront integration:** Two paths — (1) REST API for custom integrations, (2) drop-in React widget with full UX
- **Order flow:** Widget/API → calculate price → create Draft Order with locked custom price → convert to real order
- **Current state:** v1.1 shipped. 7,173 LOC TypeScript. Production at quote-flow-one.vercel.app (Vercel fra1 + Neon EU Central). Widget on npm as quote-flow@0.1.0.
- **Tech stack:** Remix 2.5, React 18, Polaris 12, Prisma 5.8, PostgreSQL (Neon), Vite 5, TypeScript 5.3

## Constraints

- **Tech stack**: Remix + Prisma + Polaris — Shopify's official app template and conventions
- **Hosting**: Vercel (fra1) — serverless deployment
- **Database**: Neon PostgreSQL (EU Central)
- **Shopify API**: Must use legacy install flow (not managed installation) for proper offline session tokens
- **Public app**: Must meet Shopify App Store review requirements

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fixed breakpoints over formulas | Simpler for merchants, covers core use case | ✓ Good |
| Round-up for in-between dimensions | Predictable pricing, merchants always get breakpoint price | ✓ Good |
| Draft Orders for custom pricing | Only reliable way to lock custom price in Shopify | ✓ Good |
| API key per store (not Storefront token) | Storefront API tokens won't authenticate custom endpoints | ✓ Good |
| One matrix per product | Simple data model; separate products for variant pricing | ✓ Good |
| Remix + Polaris on Vercel | Follows Shopify conventions; Vercel supports Remix well | ✓ Good |
| Custom line items for Draft Orders | Shopify ignores originalUnitPrice when variantId present | ✓ Good |
| Custom HTML table over Polaris DataGrid | Full spreadsheet control for inline editing and tab nav | ✓ Good |
| Shadow DOM with CSS-in-JS for widget | Style isolation without external CSS dependency | ✓ Good |
| In-memory rate limiting | MVP choice for single-instance; Redis migration path documented | ⚠️ Revisit |
| use_legacy_install_flow = true | Managed installation creates invalid offline session tokens | ✓ Good |
| Shop-specific webhooks via afterAuth | App-specific TOML webhooks incompatible with legacy install flow | ✓ Good |
| OPTIONS before auth in loaders | Remix routes OPTIONS to loader; browser preflight needs 204 | ✓ Good |

| Reusable option groups with price modifiers | Flexible add-on pricing without formula complexity | — Pending |
| Percentage modifiers from base (no compounding) | Predictable for merchants, simpler calculation | — Pending |

---
*Last updated: 2026-02-09 after v1.2 milestone start*
