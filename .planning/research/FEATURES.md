# Feature Landscape

**Domain:** Shopify Dimension-Based Price Matrix Apps
**Researched:** 2026-02-03
**Research Focus:** Custom dimension pricing (width x height) for Shopify products

## Executive Summary

Shopify dimension-based pricing apps serve merchants selling customizable products (flooring, carpet, blinds, wallpaper, fabric, murals, signage) where price depends on customer-specified dimensions. The market divides into two camps: formula-based calculators and fixed-grid matrices. This app takes the fixed-grid approach with breakpoints.

**Key insight:** Merchants want simplicity and transparency over flexibility. Apps fail when they're too complex to set up or create performance issues. Success comes from: fast setup, clear pricing display, reliable cart integration, and responsive support.

## Table Stakes

Features merchants expect. Missing any = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Dimension input UI** | Core value prop - customers must enter width/height | Medium | Must be mobile-friendly, clear labels, validation |
| **Real-time price display** | Customers expect immediate feedback as they adjust dimensions | Medium | Updates dynamically without page reload |
| **Add to cart integration** | Must create cart items with correct price and dimension metadata | High | Requires Draft Order API or cart transform functions |
| **Admin dashboard for matrix setup** | Merchants need to define pricing grids per product | High | Embedded Polaris app, must be intuitive |
| **Basic dimension validation** | Prevent invalid inputs (negative, too large, wrong format) | Low | Min/max constraints, decimal handling |
| **Mobile responsiveness** | 70%+ of Shopify traffic is mobile | Medium | Touch-friendly inputs, legible on small screens |
| **Price preview/summary** | Show calculated price before adding to cart | Low | Transparency requirement, reduces cart abandonment |
| **Multiple unit support** | Merchants sell in inches, feet, cm, meters | Medium | Unit conversion, display in merchant preference |
| **Product assignment** | Assign matrices to specific products | Medium | One matrix per product, clear association UI |
| **Order metadata** | Dimensions must appear in order details | Medium | For fulfillment - merchant needs width/height values |

## Differentiators

Features that set products apart. Not expected, but create competitive advantage.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Headless/API-first architecture** | Enables custom storefronts, not locked to Shopify themes | High | REST API for dimension validation + pricing lookup |
| **React widget (drop-in)** | Headless merchants can embed without rebuilding UI | High | Pre-built component, customizable styling |
| **Visual size preview** | Shows product image resized to customer dimensions | High | Helps customers visualize, reduces returns |
| **Smart rounding to breakpoints** | Handles in-between dimensions gracefully | Medium | Round-up strategy prevents under-pricing |
| **Bulk matrix import/export** | Fast setup for merchants with many SKUs | Medium | CSV/Excel import, reduces manual entry |
| **Multi-matrix management** | Reuse matrices across products (shared grids) | Medium | DRY principle for merchants, easier updates |
| **Preset dimension options** | Common sizes as quick-select buttons | Low | Better UX than typing, reduces input errors |
| **Price per unit display** | Shows "price per sq ft" alongside total | Low | Transparency, helps customers compare |
| **Quantity breaks** | Discount pricing for multiple units at same dimensions | Medium | "Order 5+, save 10%" logic on top of matrices |
| **API key auth per store** | Secure headless integration without OAuth complexity | Medium | Better DX for custom storefronts |
| **Theme compatibility testing** | Works across Shopify themes without manual code edits | High | Theme app extensions, avoid legacy script injection |
| **Minimum order values** | Enforce minimum price or area to cover production costs | Low | Business rule enforcement |
| **Custom dimension labels** | Rename "width/height" to domain terms (depth, length, etc.) | Low | Better merchant branding |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Formula/equation builder** | Too complex for most merchants, hard to debug | Fixed breakpoint grids - simpler mental model |
| **Unlimited custom dimensions** | 2D (width/height) covers 90% of use cases, 3D adds huge complexity | Focus on 2D matrices, defer 3D to v2 if demand exists |
| **Per-customer pricing** | Different problem domain (B2B/wholesale), adds auth/account complexity | Focus on public pricing, integrate with B2B apps later |
| **Product bundling** | Orthogonal feature, adds cart complexity | Single product focus, let bundle apps handle combinations |
| **Advanced discount rules** | Merchants expect this from discount apps, not pricing calculators | Basic quantity breaks only, defer complex promos |
| **Inventory tracking by dimension** | Unsolvable problem (infinite dimension combinations), breaks Shopify model | Document limitation, suggest "made-to-order" workflow |
| **Quote request workflow** | Different UX (async, no instant pricing), requires notification system | Support instant checkout only, integrate with quote apps later |
| **Built-in shipping calculator** | Separate domain, Shopify has native solutions | Let Shopify handle shipping, focus on product pricing |
| **Multi-currency conversion** | Shopify Markets handles this natively | Use Shopify's contextual pricing API |
| **User accounts/login** | Adds auth overhead, most dimension purchases are one-time | Support guest checkout, defer accounts |
| **Email marketing integration** | Feature creep, unrelated to pricing | Focus on core pricing, merchants use dedicated email apps |
| **Analytics dashboard** | Shopify Analytics covers order data | Expose data via Shopify Admin, avoid building BI tools |
| **Mobile app (iOS/Android)** | Web-first sufficient, native apps are 10x effort | Responsive web widget covers mobile |
| **Auto-generated product images** | Hard problem (3D rendering), breaks at scale | Support image upload, defer dynamic generation |
| **Social media integrations** | Orthogonal feature, maintenance burden | Focus on core Shopify integration |

## Feature Dependencies

Critical sequencing for development:

```
Foundation Layer (MVP):
  Admin Dashboard (Polaris) → Matrix CRUD → Product Assignment
  ↓
  Dimension Input Widget → Breakpoint Rounding → Price Display
  ↓
  Draft Order Creation → Cart Integration → Order Metadata

Enhancement Layer (Post-MVP):
  API Auth (per store) → REST Endpoints → Headless Support
  ↓
  React Widget → Theme Compatibility → Mobile Optimization

Advanced Layer (v2+):
  Matrix Import/Export → Preset Dimensions → Quantity Breaks
  ↓
  Visual Preview → Custom Labels → Analytics
```

**Key dependency notes:**
- **Draft Orders must work before API** - embedded Shopify stores validate the pricing logic before headless
- **Matrix CRUD before widget** - can't build dimension input without backend data
- **Breakpoint rounding is critical** - prevents pricing gaps between defined grid points
- **API auth gates headless features** - React widget useless without secure API access

## MVP Recommendation

For MVP (initial launch), prioritize these features in order:

### Phase 1: Core Admin Setup (Weeks 1-2)
1. Embedded Polaris dashboard (authentication, navigation)
2. Matrix CRUD (create/edit/delete pricing grids)
3. Product assignment (assign matrix to product)
4. Basic validation (dimension ranges, price constraints)

### Phase 2: Customer-Facing Widget (Weeks 3-4)
5. Dimension input widget (width/height fields, unit selector)
6. Breakpoint rounding (round-up to nearest grid value)
7. Real-time price display (reactive calculation)
8. Add-to-cart integration (Draft Orders API)

### Phase 3: API Foundation (Weeks 5-6)
9. API key generation (per-store auth)
10. REST endpoints (validate dimensions, get pricing)
11. Order metadata (dimensions in order details)

### Phase 4: Headless Support (Weeks 7-8)
12. React widget library (drop-in component)
13. Widget customization (styling, labels)
14. Mobile optimization (responsive design)

**Defer to Post-MVP:**
- Matrix import/export (can add via UI initially)
- Visual size preview (nice-to-have, not critical)
- Preset dimension buttons (merchants can list in product description)
- Quantity breaks (edge case, adds logic complexity)
- Custom dimension labels (can use standard width/height initially)
- Multi-currency (Shopify Markets handles this)

## Market Positioning

**What makes this app different:**

| Competitor Pattern | Our Approach | Why Better |
|-------------------|--------------|------------|
| Formula-based calculators | Fixed breakpoint grids | Simpler for merchants, easier to debug |
| Theme-dependent widgets | Headless-first with API | Works on custom storefronts, not just themes |
| Monthly subscriptions | One-time purchase or usage-based | Lower barrier to adoption |
| Generic "product options" | Dimension-specific UI | Purpose-built for width/height use cases |
| Shopify-only | API-first architecture | Portable to other platforms (future) |

**Primary target merchants:**
- Selling custom-dimension products (flooring, blinds, wallpaper, signage, fabric)
- Using headless Shopify storefronts (Next.js, Hydrogen, WordPress)
- Want simple pricing (grids) not complex formulas
- Need fast setup (hours, not days)
- Value API access over point-and-click UI

**Secondary target merchants:**
- Traditional Shopify theme users who want embedded widget
- Migrating from formula apps (too complex)
- International merchants (multi-unit support)

## Success Metrics

**Adoption indicators:**
- Setup completion time < 30 minutes (first matrix to live widget)
- Widget load time < 200ms (performance baseline)
- Cart conversion rate (dimension input → add-to-cart) > 70%
- Support ticket rate < 2% of active merchants/month
- Theme compatibility > 95% of top Shopify themes

**Usage patterns:**
- Merchants typically manage 5-20 products with dimensions
- Average matrix size: 10x10 breakpoints (100 price points)
- Mobile traffic: 65-75% of dimension inputs
- Headless adoption: 20-30% of installs (higher value customers)

## Edge Cases & Limitations

Document these explicitly to set expectations:

| Edge Case | Limitation | Mitigation |
|-----------|-----------|-----------|
| Dimensions between breakpoints | Rounds up to next grid value | Document rounding strategy clearly |
| Very large dimensions | May exceed reasonable pricing | Set max dimension constraints |
| Decimal precision | Limited to 2 decimal places | Display rounding behavior |
| Matrix size | Max 100x100 breakpoints (10K prices) | Sufficient for 99% of use cases |
| Concurrent edits | No real-time collaboration | Single-user edit mode |
| Offline usage | Requires internet for pricing lookup | Cache common dimensions (future) |
| API rate limits | 1000 req/min per store | Document limits, provide caching guidance |

## Confidence Assessment

| Feature Category | Confidence | Reasoning |
|-----------------|-----------|-----------|
| Table stakes | **HIGH** | Verified across 10+ competitor apps, consistent merchant reviews |
| Differentiators | **MEDIUM** | Headless/API features are hypothesis based on Shopify trends, not proven demand |
| Anti-features | **MEDIUM-HIGH** | Based on merchant complaints about complexity, some are assumptions |
| Dependencies | **HIGH** | Technical constraints (Draft Orders API, Polaris) are well-documented |
| MVP scope | **MEDIUM** | Phasing is opinionated, may need adjustment based on developer velocity |

## Research Gaps

Areas needing validation during development:

1. **Draft Orders vs Cart Transform API** - Which provides better headless experience? Draft Orders are proven but may be legacy path.
2. **React widget adoption** - Will headless merchants actually use pre-built widget, or prefer building custom?
3. **Pricing model** - One-time purchase vs subscription vs usage-based? Need merchant feedback.
4. **Matrix size limits** - Is 100x100 sufficient, or do edge cases need 200x200+?
5. **Multi-matrix assignment** - Do merchants ever need multiple matrices per product (variants)?

## Sources

### Competitor Analysis
- [MS Custom Size Price Calculator](https://apps.shopify.com/smart-price-calculator) - Leading dimension pricing app
- [MH Smart Size Price Calculator](https://apps.shopify.com/custom-size-price-calculator) - Image visualization features
- [Apippa Custom Price Calculator](https://apps.shopify.com/custom-price-calculator) - Formula-based approach (4.82/5 rating)
- [SE: Option Price Calculator](https://apps.shopify.com/option-price-calculator) - Blinds/flooring specialist
- [Price Calculator by Dimensions](https://apps.shopify.com/floor-calculator) - Area/volume pricing

### Shopify Platform Documentation
- [Building Apps in Admin](https://shopify.dev/docs/apps/build/admin) - Polaris, App Bridge requirements
- [Storefront API Guide](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api) - Headless commerce patterns
- [App Store Best Practices](https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices) - Performance, UX requirements

### Merchant Expectations
- [Shopify App Store Requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) - Official guidelines
- [App UI Uninstall Reasons](https://www.shopify.com/partners/blog/app-ui) - Why merchants abandon apps
- [Custom Product Options Reviews](https://apps.shopify.com/dynamic-product-options/reviews) - Complexity complaints

### Performance & Technical
- [Web Performance Tools 2026](https://performance.shopify.com/blogs/blog/web-performance-tools-for-2026) - Shopify standards
- [Cart Transform API](https://shopify.dev/docs/api/functions/latest/cart-transform) - Modern cart customization
- [Draft Orders Guide](https://www.revize.app/blog/shopify-draft-orders-guide) - Custom pricing implementation

### Market Trends
- [Shopify Headless Commerce 2026](https://litextension.com/blog/shopify-headless/) - Headless adoption patterns
- [App Bloat & Performance](https://www.endschema.com/why-your-shopify-apps-are-killing-your-sales-in-2026-and-how-to-fix-it-with-custom-liquid/) - Merchant pain points
- [Pricing Best Practices](https://shopify-option-price-calculator.lpages.co/flooring/) - Domain-specific patterns

### Domain-Specific Use Cases
- [Draft Orders for Custom Pricing](https://shopify.dev/docs/apps/build/b2b/draft-orders) - B2B patterns applicable to dimensions
- [Rounding Rules for Packaging](https://addify.store/product/custom-price-calculator-by-formula/) - Unit packaging logic
- [Polaris Dashboard Patterns](https://www.shopside.com.au/post/lessons-from-polaris-our-first-embedded-shopify-app) - Real-world implementation lessons
