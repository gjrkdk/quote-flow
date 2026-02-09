# Project Research Summary

**Project:** QuoteFlow v1.2 - Option Groups & App Store Submission
**Domain:** Shopify pricing app enhancement (dimension-based + option modifiers)
**Researched:** 2026-02-09
**Confidence:** HIGH

## Executive Summary

QuoteFlow v1.2 adds customizable option groups (dropdown price modifiers like "Glass Type: Tempered (+$25)") on top of the existing dimension-based price matrix system, and prepares for Shopify App Store submission. The existing v1.1 stack (Remix 2.5, Polaris 12, Prisma 5.8, PostgreSQL) requires NO framework upgrades. The architecture extends proven patterns: add new Prisma models for option groups/choices, modify existing price calculation to apply modifiers, and render native HTML `<select>` dropdowns in the widget.

The critical path is: (1) data model with proper cascading deletes to prevent orphaned records, (2) server-side price calculation using integer (cents) arithmetic to avoid floating-point errors, (3) admin CRUD for option groups, (4) API extensions with backwards compatibility, and (5) widget integration with optimistic UI to prevent price flicker. The most severe risk is floating-point rounding errors in price calculations - all currency must use integer (cents) arithmetic, not native JavaScript decimals.

App Store submission requires GraphQL Admin API migration (mandatory as of April 2025), GDPR webhooks (already scaffolded), and performance optimization to avoid Lighthouse score drops. The v1.1 foundation already meets 90% of App Store requirements. Research confidence is HIGH - validated against official Shopify docs, established e-commerce patterns, and competitor analysis of top product options apps.

## Key Findings

### Recommended Stack

**No stack changes required.** The validated v1.1 production stack is sufficient for option groups and App Store submission. Keep Remix 2.5, React 18.2, Polaris 12, Prisma 5.8, PostgreSQL (Neon), Vite 5.0. The only additions are data model extensions and service layer logic.

**Critical addition: GraphQL Admin API.** As of April 1, 2025, new public apps MUST use GraphQL exclusively (no REST Admin API). Migrate Draft Order creation and product fetching to GraphQL mutations/queries using the existing `@shopify/shopify-app-remix@2.7.0` client. This is a mandatory App Store requirement, not optional.

**Core technologies (no changes):**
- **Remix 2.5.0** - Admin app framework, API routes, sufficient for CRUD operations
- **Prisma 5.8.0** - Schema extension for option groups, JSON field support for selected options
- **PostgreSQL (Neon)** - Relational data model for option groups, JSON fields for order metadata
- **React 18.2.0** - Widget already works, no need for React 19 (minimize risk)
- **Native HTML `<select>`** - Accessibility best practice, mobile-optimized, zero JavaScript dependencies

**What NOT to add:**
- Headless UI / Radix UI - overkill for simple dropdowns, adds bundle size
- Custom dropdown libraries - accessibility complexity, mobile incompatibility
- React 19 upgrade - unnecessary breaking changes, no features needed
- Prisma 6/7 upgrade - no new features needed, migration risk

### Expected Features

**Must have (table stakes - users expect these):**
- Option group dropdowns (standard UI pattern, universally understood)
- Price modifiers add to base matrix price (base + options = total)
- Live price updates when selecting options (existing widget does this for dimensions)
- Multiple option groups per product (glass type + edge finish + coating)
- Fixed amount modifiers (+$10 for tempered glass)
- Percentage modifiers (+20% for UV coating, calculated from base)
- Clear modifier display in widget (+$15.00 shown next to option label)
- Option metadata in Draft Orders (merchants see what customer selected)

**Should have (competitive advantage):**
- API-first option support (headless storefronts can use REST API)
- Non-compounding percentages (all % calculated from base, not compound interest)
- Empty state graceful (products without options still work - backwards compatible)
- Option-aware price preview (widget shows base + modifiers breakdown)
- Dropdown-only simplicity (no complex conditional logic in v1.2)

**Defer (v2+):**
- Conditional option logic ("show option B only if A = X" - complexity explosion)
- Option inventory tracking (infinite combinations break Shopify model)
- Compounding percentages (confusing pricing, unpredictable for merchants)
- Image swatches for options (asset management burden, loading performance)
- Multi-select options (pricing ambiguity - additive? maximum?)

### Architecture Approach

The architecture extends the current dimension-based pricing system with minimal modifications. Option groups are store-scoped, reusable entities assigned to products via a join table. Price calculation remains centralized in the server: widget fetches base price + option modifiers via API, never calculates prices client-side (security risk).

**Major components:**

1. **Data Layer (NEW models)** - `OptionGroup` (store-scoped, reusable), `OptionChoice` (values with modifiers), `ProductOptionGroup` (many-to-many join with position/required metadata). Cascading deletes prevent orphaned records when products unassigned.

2. **Service Layer (MODIFIED)** - `price-calculator.server.ts` applies modifiers (percentages from base, then fixed amounts). `option-lookup.server.ts` validates selections against assigned groups. `draft-order.server.ts` includes option metadata in line item properties.

3. **API Layer (MODIFIED)** - `GET /api/v1/products/:id/price` accepts optional `optionSelections` array, returns base price + modifier breakdown. `POST /api/v1/draft-orders` validates options, applies modifiers, stores selections as customAttributes. `GET /api/v1/products/:id/options` (NEW) returns assigned groups and choices.

4. **Widget Layer (MODIFIED)** - `OptionGroupSelector.tsx` (NEW) renders native `<select>` dropdowns. `usePriceFetch` hook extended to include option selections, debounced API calls. Optimistic UI updates prevent price flicker.

5. **Admin UI (NEW routes)** - `/app/options` (list groups), `/app/options/new` (create), `/app/options/:id/edit` (edit), `/app/products/:id/options` (assign to products). Polaris IndexTable and Form components.

**Key patterns:**
- **Option group reusability**: Create once, assign to multiple products (DRY principle)
- **Non-compounding percentages**: All % calculated from base matrix price, not running total
- **Option metadata in Draft Orders**: Store selections as line item properties for merchant visibility
- **Native HTML `<select>`**: Accessibility by default, mobile-optimized, no custom dropdown complexity

### Critical Pitfalls

Research identified 10 critical pitfalls. Top 5 that cause rewrites or App Store rejection:

1. **Floating-point rounding errors in price calculations** - JavaScript's `0.1 + 0.2 !== 0.3` causes incorrect prices when modifiers stack. Prevention: Store all prices as integers (cents), perform calculations in cents, only convert to decimal for display. Never use `toFixed()` during calculations. This is the #1 risk in this domain.

2. **Incorrect modifier order (percentage compounding)** - Wrong: $100 * 1.20 * 1.10 = $132. Correct: $100 + ($100 * 0.20) + ($100 * 0.10) = $130. Prevention: Calculate all percentages from base price, not running total. Document clearly in code and admin UI.

3. **Orphaned option groups after product unassignment** - Database bloat, failed API lookups, GDPR compliance risk. Prevention: Schema with `ON DELETE CASCADE` in `ProductOptionGroup` join table. GDPR `shop/redact` webhook cascades to all related records.

4. **REST API breaking changes without versioning** - Modifying `/price` endpoint signature breaks existing merchant integrations. Prevention: Make `optionSelections` optional, maintain backwards compatibility. Consider `/api/v2/price` for major changes.

5. **App Store performance requirements** - Lighthouse score drops >10% or response times >500ms = automatic rejection. Prevention: Database indexes on foreign keys, Prisma query optimization (avoid N+1), Lighthouse testing before submission, widget bundle <50KB gzipped.

**Additional critical pitfalls:**
6. Cognitive overload from too many option dropdowns (recommend max 3-4 per product)
7. Price flicker when options change (use optimistic UI, debounce API calls)
8. Missing data migration for existing products (ensure backwards compatibility)
9. Incomplete App Store listing metadata (screenshots 1600x900px, no pricing in images)
10. Inadequate accessibility (keyboard navigation, ARIA labels, WCAG 2.1 AA contrast)

## Implications for Roadmap

Based on research, suggested phase structure prioritizes foundation (data model, service layer) before UI (admin, widget), and ensures App Store readiness throughout.

### Phase 1: Data Model & Price Calculation Foundation
**Rationale:** Option groups require new database models, and price calculation logic is the highest-risk component (floating-point errors). This foundation must be solid before building UI or API endpoints.

**Delivers:**
- Prisma schema: `OptionGroup`, `OptionChoice`, `ProductOptionGroup` models
- Database migration with cascading deletes
- Service layer: `option-lookup.server.ts`, `price-calculator.server.ts` with integer (cents) arithmetic
- Unit tests: currency edge cases, percentage modifiers, non-compounding validation

**Addresses features:**
- Option group data structure (table stakes)
- Fixed/percentage modifiers (table stakes)
- Reusable option groups across products (competitive advantage)

**Avoids pitfalls:**
- Floating-point rounding errors (integer arithmetic)
- Incorrect modifier order (percentages from base)
- Orphaned option groups (cascading deletes)
- Missing data migration (backwards compatible schema)

**Research needed:** NO (schema patterns well-documented in ARCHITECTURE.md)

### Phase 2: Admin UI for Option Groups
**Rationale:** Merchants need to create and assign option groups before the widget/API can use them. Admin CRUD can be tested manually without widget complexity.

**Delivers:**
- `/app/options` (list), `/app/options/new` (create), `/app/options/:id/edit` (edit)
- `/app/products/:id/options` (assign option groups to products)
- Polaris IndexTable, Form components
- Validation: unique option group names, minimum 1 choice per group

**Addresses features:**
- Option group CRUD (table stakes)
- Product assignment with position/required controls (table stakes)
- Multiple option groups per product (table stakes)

**Avoids pitfalls:**
- Cognitive overload guidance (warn if >4 option groups per product)
- Admin UI shows option group usage (which products use this group)

**Research needed:** NO (standard Polaris patterns, existing admin UI follows same structure)

### Phase 3: REST API Extension with Backwards Compatibility
**Rationale:** API must be ready before widget integration. Backwards compatibility ensures existing merchants (if any direct API users) aren't broken.

**Delivers:**
- `GET /api/v1/products/:id/price` accepts optional `optionSelections` array
- `POST /api/v1/draft-orders` accepts optional `optionSelections`, validates against assigned groups
- `GET /api/v1/products/:id/options` (NEW endpoint)
- Response includes base price + modifier breakdown
- Validation: option IDs exist, belong to product, required groups selected

**Addresses features:**
- API-first option support (competitive advantage)
- Price modifier calculation (table stakes)
- Option validation in API (table stakes)

**Avoids pitfalls:**
- REST API breaking changes (optional parameter, graceful degradation)
- Missing server-side validation (always recalculate price, don't trust client)
- Performance issues (database indexes, Prisma `include` optimization)

**Research needed:** LIGHT (API versioning strategy for Remix routes - may need pattern research if complex)

### Phase 4: Widget Integration with Optimistic UI
**Rationale:** Widget is the customer-facing component, requires API from Phase 3 and option groups from Phase 2. Most complex UX component with accessibility requirements.

**Delivers:**
- `OptionGroupSelector.tsx` (native HTML `<select>`)
- `useOptionGroups.ts` hook (fetch assigned groups)
- `usePriceFetch` modification (include option selections, debounce)
- Optimistic UI updates (instant feedback, API verification in background)
- Mobile-optimized dropdowns (48x48px tap targets)
- Accessibility: keyboard navigation, ARIA labels, WCAG 2.1 AA contrast

**Addresses features:**
- Option group dropdowns (table stakes)
- Live price updates (table stakes)
- Clear modifier display (table stakes)
- Empty state graceful (backwards compatibility)

**Avoids pitfalls:**
- Price flicker (optimistic UI, debounce, show loading alongside price not instead)
- Cognitive overload (visual grouping, smart defaults, progressive disclosure)
- Accessibility violations (native `<select>`, keyboard testing, screen reader testing)
- Performance issues (bundle size <50KB, lazy loading, React.memo)

**Research needed:** NO (native HTML `<select>` patterns well-documented in STACK.md)

### Phase 5: GraphQL Migration & GDPR Webhooks
**Rationale:** Mandatory for App Store submission. REST Admin API deprecated, GraphQL required as of April 2025. GDPR webhooks must actually delete data, not just acknowledge.

**Delivers:**
- Draft Order creation migrated to GraphQL `draftOrderCreate` mutation
- Product fetching migrated to GraphQL `products` query
- GDPR webhooks: `customers/data_request`, `customers/redact`, `shop/redact`
- Webhook testing: Shopify CLI triggers, verify deletion in database
- Schema cascade deletes: `shop/redact` removes all option groups for store

**Addresses features:**
- App Store compliance (mandatory)
- GDPR compliance (mandatory)

**Avoids pitfalls:**
- App Store rejection for REST API usage
- GDPR complaints for incomplete data deletion
- Webhook timeout (respond <200ms, queue long-running deletions)

**Research needed:** NO (official Shopify docs in STACK.md, patterns well-established)

### Phase 6: Performance Audit & App Store Submission
**Rationale:** Final pre-submission checks ensure no performance regressions, complete listing metadata, and pass accessibility audits.

**Delivers:**
- Lighthouse testing on test store (no >10% score drop)
- Load testing (100 concurrent users, slow network conditions)
- Database indexes verified (storeId, productId, optionGroupId)
- App Store listing: 3 screenshots (1600x900px), description, privacy policy URL
- Accessibility audit: keyboard-only testing, screen reader testing, axe DevTools
- Test credentials for reviewers (demo store with matrices + option groups)

**Addresses features:**
- App Store compliance (mandatory)
- Performance standards (mandatory)

**Avoids pitfalls:**
- App Store rejection for performance issues
- App Store rejection for incomplete listing metadata
- Accessibility violations (keyboard navigation, ARIA labels, color contrast)

**Research needed:** NO (Shopify App Store requirements documented in PITFALLS.md)

### Phase Ordering Rationale

**Foundation-first approach:**
- Data model before UI (can't build admin UI without database schema)
- Admin UI before widget (merchants create option groups before customers use them)
- API before widget (widget depends on API endpoints)
- Performance audit last (need complete feature set to measure)

**Risk mitigation through dependencies:**
- Price calculation in Phase 1 (highest risk, must be solid foundation)
- Backwards compatibility in Phase 3 (avoid breaking existing integrations)
- Optimistic UI in Phase 4 (UX polish after core functionality works)
- App Store compliance in Phase 5-6 (complete features before submission)

**Parallel work opportunities:**
- Phase 2 (Admin UI) and Phase 3 (API) can overlap once data model is complete
- Phase 5 (GraphQL migration) can start while Phase 4 (widget) is in progress
- Documentation and listing metadata (Phase 6) can be drafted throughout

### Research Flags

**Phases needing deeper research during planning:**
NONE. All phases have well-documented patterns in research files. Standard implementation.

**Phases with established patterns (skip research-phase):**
- **Phase 1:** Prisma schema patterns, price calculation logic - detailed in ARCHITECTURE.md
- **Phase 2:** Polaris admin UI components - existing app already uses this pattern
- **Phase 3:** REST API extensions - existing API structure, add optional parameter
- **Phase 4:** Native HTML `<select>` - accessibility best practice, STACK.md has implementation
- **Phase 5:** GraphQL Admin API - official Shopify docs, STACK.md has migration guide
- **Phase 6:** App Store submission - PITFALLS.md has complete checklist

**If complexity emerges during implementation:**
- **Phase 3 API versioning:** If backwards compatibility becomes complex, may need Remix API versioning pattern research (currently assumes simple optional parameter)
- **Phase 4 optimistic UI:** If state management becomes unwieldy with multiple option groups, may need Zustand/Jotai research (currently assumes React useState sufficient)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | Existing v1.1 stack validated in production, no upgrades needed. GraphQL migration documented in official Shopify docs. Native `<select>` is web standard. |
| Features | **HIGH** | Table stakes verified across 10+ product options apps (Easify, Sellio, SC Product Options). Differentiators (API-first, Shadow DOM) already proven in v1.1. |
| Architecture | **HIGH** | Extends existing proven patterns (data model + service layer + API + widget). Schema design follows standard many-to-many with metadata pattern. No novel patterns required. |
| Pitfalls | **HIGH** | Floating-point errors well-documented in financial applications research. App Store requirements from official Shopify docs. Accessibility patterns from WCAG 2.1 AA standards. |

**Overall confidence:** HIGH

### Gaps to Address

**Minor gaps (can be resolved during implementation):**

1. **Option group display limit recommendation** - Research suggests max 3-4 option groups per product to avoid cognitive overload, but optimal number needs user testing validation. Mitigation: Start with soft warning at 4 groups, gather analytics post-launch.

2. **Percentage modifier display format** - Should widget show "+20%" or "+$20.00 (20%)" or both? Research doesn't provide clear preference. Mitigation: Test both formats with merchants in Phase 2 admin UI, use clearer option for widget in Phase 4.

3. **Option metadata format in Draft Orders** - Shopify supports both `properties` (legacy) and `customAttributes` (newer). Research recommends `customAttributes` but both are valid. Mitigation: Use `customAttributes` as per GraphQL `draftOrderCreate` mutation schema.

4. **Rate limiting migration to Redis** - Current in-memory rate limiting doesn't work across Vercel instances (acknowledged technical debt). Not critical for v1.2 launch but should be roadmapped for v1.3. Mitigation: Document as known limitation, monitor API abuse post-launch.

**No blocking gaps.** All areas have sufficient research to proceed with roadmap planning and implementation.

## Sources

### Primary (HIGH confidence)

**Shopify Official Documentation:**
- [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) - Technical and listing requirements
- [GraphQL mandatory (April 2025)](https://shopify.dev/changelog/starting-april-2025-new-public-apps-submitted-to-shopify-app-store-must-use-graphql) - REST deprecation
- [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance) - GDPR webhook requirements
- [Draft Order GraphQL mutation](https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate) - API reference
- [Performance optimization](https://shopify.dev/docs/apps/build/performance) - App Store performance standards
- [Accessibility best practices](https://shopify.dev/docs/apps/build/accessibility) - WCAG requirements

**Web Standards:**
- [Prisma JSON Fields Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) - Data model patterns
- [Select Dropdown Accessibility](https://www.atomica11y.com/accessible-design/select/) - WCAG best practices for dropdowns
- [WCAG 2.1 AA standards](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility requirements

### Secondary (MEDIUM confidence)

**Competitor Analysis:**
- [Top Shopify Product Options Apps Compared (2026)](https://easy-flow.app/shopify-product-options-apps-compared/) - Feature comparison of Easify, Sellio, SC Product Options
- [Best Product Options Apps for Shopify (2026)](https://easifyapps.com/blog/best-shopify-product-options-apps/) - Market leaders analysis

**Financial Calculations:**
- [JavaScript Rounding Errors (Financial Applications)](https://www.robinwieruch.de/javascript-rounding-errors/) - Floating-point pitfalls
- [Handle Money in JavaScript: Financial Precision](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc) - Integer arithmetic patterns
- [Currency Calculations in JavaScript](https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/) - Currency.js vs Dinero.js comparison

**Database & API Patterns:**
- [Database Migrations: Safe, Downtime-Free Strategies](https://vadimkravcenko.com/shorts/database-migrations/) - Schema migration best practices
- [API Versioning Best Practices for Backward Compatibility](https://endgrate.com/blog/api-versioning-best-practices-for-backward-compatibility) - API versioning patterns

### Tertiary (LOW confidence - informational only)

**UX Patterns:**
- [Dropdown UI Design: Anatomy, UX, and Use Cases](https://www.setproduct.com/blog/dropdown-ui-design) - Dropdown best practices
- [Understanding optimistic UI and React's useOptimistic Hook](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/) - Optimistic UI patterns

---

*Research completed: 2026-02-09*
*Ready for roadmap: YES*
*Next step: Requirements definition (roadmapper agent)*
