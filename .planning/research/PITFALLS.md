# Pitfalls Research: Adding Option Groups & App Store Submission

**Domain:** Shopify App Enhancement (Option Groups with Price Modifiers + App Store Submission)
**Project:** QuoteFlow - Existing Matrix Pricing App
**Researched:** 2026-02-09
**Confidence:** HIGH (verified with official Shopify docs and multiple sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, app store rejection, or major security/compliance issues.

### Pitfall 1: Floating Point Rounding Errors in Price Calculations

**What goes wrong:** Price calculations using JavaScript's native floating-point arithmetic produce incorrect results. For example, `0.1 + 0.2 !== 0.3`, and `2.05 * 100` returns `204.99999999999997` instead of `205`. When option modifiers stack on matrix prices, these errors compound, causing customers to be charged incorrect amounts (typically a few cents off).

**Why it happens:** All numbers in JavaScript use IEEE 754 double-precision floating-point format, which cannot precisely represent decimal values in binary. Floating-point errors occur in 17-56% of mathematical operations. Developers assume native number operations are safe for currency.

**Consequences:**
- Incorrect prices displayed to customers
- Draft Orders created with wrong totals
- Merchant revenue loss or overcharging
- Customer complaints and chargebacks
- Loss of merchant trust
- Inconsistent pricing between widget display and actual checkout

**Prevention:**
- Store all prices as integers (cents) in the database
- Multiply by 100 before storing: `Math.round(price * 100)`
- Perform all calculations in cents using integer arithmetic
- Only convert to decimal display format at the final UI rendering step
- Use libraries like `currency.js`, `dinero.js`, or `big.js` for complex calculations
- For Shopify integration: prices in cents align with Shopify's API expectations (many endpoints accept cents)
- Never use `toFixed()` during intermediate calculations (only for final display)

**Detection:**
- Unit tests with currency edge cases: `0.1 + 0.2`, `2.05 * 100`, percentage calculations
- Test calculations with 3-4 option modifiers stacked together
- Compare final price to manual calculation spreadsheet
- Monitor Draft Order prices vs. calculated widget prices
- User reports: "My price is off by a few cents"

**Phase to address:** Option Groups Data Model & Price Calculation (first phase of v1.2)

**Sources:**
- [JavaScript Rounding Errors (in Financial Applications)](https://www.robinwieruch.de/javascript-rounding-errors/)
- [Handle Money in JavaScript: Financial Precision Without Losing a Cent](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
- [Currency Calculations in JavaScript](https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/)

---

### Pitfall 2: Incorrect Modifier Order of Operations (Percentage Compounding)

**What goes wrong:** Option modifiers apply in the wrong order, causing percentage modifiers to compound instead of calculating from the base matrix price. For example:
- Base matrix price: $100
- Option 1: +20% (should be $20)
- Option 2: +10% (should be $10)
- **Wrong:** $100 * 1.20 = $120, then $120 * 1.10 = $132 (compounded)
- **Correct:** ($100 * 0.20) + ($100 * 0.10) + $100 = $130 (both from base)

**Why it happens:** Developers naturally chain percentage calculations without distinguishing between "compound interest" vs "all from base" semantics. Project requirements state "percentages calculated from base (not compounded)" but implementation uses sequential multiplication.

**Consequences:**
- Customers overcharged on multi-option configurations
- Price discrepancies between widget estimates and final checkout
- Merchant confusion about how pricing works
- Customer complaints: "Your calculator is wrong"
- Refund requests after Draft Order completion
- Loss of merchant credibility

**Prevention:**
- Document modifier order in code comments: "All percentages calculate from base matrix price"
- Implement calculation as: `basePrice + sum(fixedModifiers) + basePrice * sum(percentageModifiers)`
- Separate fixed-amount and percentage modifiers into two accumulation steps
- Unit tests with multiple percentage modifiers comparing to spreadsheet calculations
- Show calculation breakdown in admin UI: "Base: $100, +20% Glass ($20), +10% Coating ($10) = $130"
- Admin preview feature: merchants can test configurations before publishing

**Detection:**
- Unit test: base $100, two 10% options should equal $120 not $121
- Manual testing: configure 3+ percentage options and verify against calculator
- Merchant feedback: "My prices don't match my spreadsheet"
- Widget price display vs. actual Draft Order price mismatch

**Phase to address:** Option Groups Price Calculation Logic (first phase of v1.2)

**Sources:**
- [Pricing settings - Commerce Dynamics 365](https://learn.microsoft.com/en-us/dynamics365/commerce/price-settings)
- [Pricing & Custom Formula - Acowebs](https://acowebs.com/guideline/plugin-docs-faqs/wcpa/pricing-custom-formula/)

---

### Pitfall 3: Orphaned Option Groups After Product Unassignment

**What goes wrong:** When a product is unassigned from a matrix or deleted from Shopify, option groups remain assigned to that product in the database. These orphaned records cause:
- Failed API lookups (product exists but references deleted option groups)
- Admin UI showing option groups with no valid products
- Database bloat from unreachable records
- Confusing merchant experience: "Why can't I delete this option group?"

**Why it happens:** Schema lacks proper cascading deletes or referential integrity checks. Foreign key constraints don't cascade when products are unassigned. Developers focus on create/update flows but neglect cleanup on delete.

**Consequences:**
- Database integrity violations
- REST API errors for valid-looking product IDs
- Merchant confusion when editing option groups
- Cannot delete option groups due to "phantom" references
- Data leakage: merchant thinks data is deleted but it persists
- GDPR compliance risk: data not fully redacted on shop deletion

**Prevention:**
- Schema design: Add `ProductOptionGroup` join table with `ON DELETE CASCADE` to `ProductMatrix`
- When product unassigned from matrix: delete all `ProductOptionGroup` records
- When option group deleted: verify no product assignments or cascade delete
- Implement database foreign key constraints, not just Prisma schema annotations
- GDPR `shop/redact` webhook: cascade delete all related option groups
- Admin UI: warn merchants before deleting products with option groups
- Background job: periodic cleanup of orphaned records (defensive)

**Detection:**
- Database integrity checks: `SELECT * FROM product_option_groups WHERE product_id NOT IN (SELECT product_id FROM product_matrices)`
- Admin UI test: assign options → unassign product → check option groups table
- API test: request price for recently unassigned product
- Monitor logs for "option group not found" errors on valid product IDs

**Phase to address:** Option Groups Data Model (before any product assignment features)

**Sources:**
- [Data migration challenges: Common issues and fixes](https://www.rudderstack.com/blog/data-migration-challenges/)
- [Schema migrations: pitfalls and risks](https://quesma.com/blog-detail/schema-migrations)

---

### Pitfall 4: Missing Data Migration for Existing Products

**What goes wrong:** New option groups schema is deployed, but existing products with matrices have no migration path. API calls for existing products fail because they lack the new option groups structure. Merchants can't use new features on existing products without recreating everything from scratch.

**Why it happens:** Developers add new tables/columns but don't write migrations for existing data. Assume "new feature, new data" but existing products need backwards compatibility. Schema changes treated as purely additive without considering existing records.

**Consequences:**
- Existing merchants can't use option groups without deleting and recreating matrices
- Widget breaks for previously working products
- REST API errors: "option groups not found" for valid products
- Poor merchant experience: "I have to redo all my work?"
- App store rejection: reviewers test with existing data, finds breakage
- Emergency hotfix required post-deployment

**Prevention:**
- Write Prisma migration that adds new tables without breaking existing data
- Default behavior: products without option groups = empty array (not null/error)
- API backwards compatibility: `/price` endpoint works with or without option groups
- Widget graceful degradation: renders dimension inputs only if no option groups
- Admin UI: clearly show which products have option groups enabled
- Test migration on copy of production database before deploying
- Deploy in phases: (1) schema + backwards compat, (2) enable features, (3) remove old code

**Detection:**
- Test on development database with real production data copy
- API test suite: run against products created before schema change
- Load existing product in admin UI and verify no errors
- Widget rendering test with pre-migration product IDs
- Monitor error rates immediately after deployment

**Phase to address:** Option Groups Data Model & Migration (before deployment)

**Sources:**
- [Database Migrations: Safe, Downtime-Free Strategies](https://vadimkravcenko.com/shorts/database-migrations/)
- [Safely making database schema changes](https://planetscale.com/blog/safely-making-database-schema-changes)

---

### Pitfall 5: REST API Breaking Changes Without Versioning

**What goes wrong:** The `/price` endpoint signature changes to require option group selections, breaking existing merchant integrations. Merchants using the REST API directly (not the widget) experience errors when upgrading. No API versioning means no smooth migration path.

**Why it happens:** Developers modify existing endpoints instead of creating versioned endpoints. Assume all users go through the widget, forgetting direct API consumers. Focus on new features without considering backwards compatibility.

**Consequences:**
- Breaking change for merchants with custom storefront integrations
- Production errors on merchant sites without warning
- Support tickets: "Your API stopped working"
- Merchant churn: "We can't trust this app"
- Emergency rollback required
- Loss of developer credibility

**Prevention:**
- API versioning strategy: `/api/v1/price` remains unchanged, add `/api/v2/price` with option groups
- Make option groups optional in API: `optionSelections?: Array<{groupId, choiceId}>`
- Backwards compatibility: if no options provided, calculate base matrix price only
- Document migration guide: "v1 deprecated, migrate to v2 by [date]"
- Return API version in response headers: `X-API-Version: 2`
- Widget uses v2, direct integrations can choose when to migrate
- Announce changes to merchants with migration timeline (30-60 days)

**Detection:**
- Integration tests for both v1 (legacy) and v2 (new) endpoints
- Monitor v1 endpoint usage to know when safe to deprecate
- Test existing merchant integrations before deployment (ask for test stores)
- Semantic versioning for widget package: major version bump (0.1.0 → 1.0.0)
- Documentation clearly shows both versions with migration path

**Phase to address:** REST API Enhancement (after data model, before widget update)

**Sources:**
- [API Versioning Best Practices for Backward Compatibility](https://endgrate.com/blog/api-versioning-best-practices-for-backward-compatibility)
- [How to handle versioning and backwards compatibility of APIs](https://www.theplatformpm.com/articles/how-to-handle-versioning-and-backwards-compatibility-of-apis)

---

### Pitfall 6: Cognitive Overload from Too Many Option Dropdowns

**What goes wrong:** Merchants create 5+ option groups per product (e.g., glass type, coating, tint, edge work, corner style), resulting in a widget with 7 total inputs (width + height + 5 dropdowns). Users face decision paralysis, abandon cart, or select wrong options.

**Why it happens:** Merchants have complex product catalogs and want to model every variation. No UX guidance on maximum recommended options. Admin UI doesn't warn about cognitive load. Developers enable unlimited option groups without considering user experience.

**Consequences:**
- High cart abandonment rates
- Poor mobile UX (7+ form fields)
- Increased customer support: "How do I choose?"
- Incorrect orders: customers rush through too many choices
- Accessibility issues: excessive tab navigation for keyboard users
- Merchant complaints: "Customers aren't completing orders"

**Prevention:**
- Admin UI guidance: recommend maximum 3-4 option groups per product
- Warning banner in admin: "More than 4 option groups may overwhelm customers"
- Widget UX patterns for large option sets:
  - Collapsible sections: "Advanced Options" collapsed by default
  - Smart defaults: auto-select most common choices
  - Progressive disclosure: show relevant options based on previous selections
  - Step wizard for 5+ options: dimensional inputs → basic options → advanced options
- Mobile-optimized dropdowns: minimum 48x48px tap targets
- Help text for each option: explain what customers are choosing
- Group related options visually (border/background)
- Consider multi-step configuration for complex products

**Detection:**
- User testing with 5+ option groups on mobile
- Analytics: time spent on product page vs. cart abandonment
- Heatmaps: are users interacting with all dropdowns?
- Merchant feedback: "My conversion rate dropped"
- Accessibility audit: keyboard navigation through all inputs

**Phase to address:** Widget UX Enhancement (after basic option groups working)

**Sources:**
- [Dropdown UI Design: Anatomy, UX, and Use Cases](https://www.setproduct.com/blog/dropdown-ui-design)
- [Best Practices for Designing Drop-Down Menu](https://vareweb.com/blog/best-practices-for-designing-drop-down-menu/)

---

### Pitfall 7: Price Flicker When Option Selections Change

**What goes wrong:** User selects an option, price disappears or shows "Calculating..." for 200-500ms, then new price appears. This flicker happens on every option change, creating a janky, unprofessional experience. Users lose confidence: "Is this the right price?"

**Why it happens:** Widget makes synchronous API call to `/price` endpoint for every option change. No optimistic UI updates. Loading state replaces price display instead of showing alongside it. Network latency causes visible delay.

**Consequences:**
- Poor perceived performance
- User frustration: "Why is this so slow?"
- Looks unprofessional compared to competitors
- Users doubt price accuracy during flicker
- Accessibility issue: screen readers announce "loading" repeatedly
- Mobile users on slow networks experience 1-2 second delays

**Prevention:**
- Optimistic UI updates: calculate price client-side immediately, verify with API in background
- Show loading indicator next to price, not instead of price: "$123.45 ⟳"
- Debounce API calls: wait 150ms after last option change before requesting
- Client-side price calculation logic (duplicate server logic): instant feedback
- React `useOptimistic` hook for immediate state updates
- Preload all option prices on widget initialization (if small dataset)
- Cache API responses in memory: same configuration = no API call
- Animated number transitions instead of abrupt changes: $100 → $110 → $120
- Loading state only for initial load, not for option changes

**Detection:**
- Manual testing on throttled network (Chrome DevTools: Slow 3G)
- Measure time between option change and price update
- User testing: "Does this feel fast?"
- Lighthouse performance score for widget page
- Monitor API response times: should be <100ms p95

**Phase to address:** Widget UX Enhancement (after basic option groups working)

**Sources:**
- [Understanding optimistic UI and React's useOptimistic Hook](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/)
- [React 19 useOptimistic Hook Breakdown](https://dev.to/dthompsondev/react-19-useoptimistic-hook-breakdown-5g9k)

---

### Pitfall 8: Missing App Store Performance Requirements

**What goes wrong:** App adds significant load time to Shopify admin pages or reduces merchant store Lighthouse scores. App store review rejects submission for poor performance. Reviewers find response times >500ms or Lighthouse score drops >10%.

**Why it happens:** Developers test on fast networks and local databases. Don't measure performance impact on real Shopify stores. Unoptimized database queries (N+1 problems). No performance monitoring before submission.

**Consequences:**
- Automatic app store rejection
- Months of work blocked from launch
- Need to rewrite slow queries/components before resubmission
- Merchant stores become slower (poor reviews)
- App uninstalls due to performance
- Cannot earn "Built for Shopify" badge

**Prevention:**
- Performance budgets: <500ms response time for 95% of requests
- Webhooks respond within 200ms (Shopify times out after 5 seconds)
- Database query optimization:
  - Use Prisma `include` carefully (avoid N+1)
  - Add indexes for foreign keys: `storeId`, `matrixId`, `productId`
  - Limit queries: don't fetch all records without pagination
- Lighthouse testing on real stores before submission:
  - Test home page and product pages with widget
  - Ensure Lighthouse score doesn't drop >10%
- Use Vercel Analytics/Edge Functions for performance monitoring
- Load testing: simulate 100 concurrent users
- React.lazy() for code splitting: widget components loaded on demand
- Memoize expensive calculations: `React.memo`, `useMemo`

**Detection:**
- Lighthouse CI in deployment pipeline
- Load testing with k6 or Artillery
- New Relic / Vercel Analytics for production monitoring
- Shopify's "Built for Shopify" performance webinar checklist
- Test on Shopify's development stores (realistic environment)

**Phase to address:** Pre-submission Performance Audit (before App Store submission)

**Sources:**
- [About performance optimization](https://shopify.dev/docs/apps/build/performance)
- [Shopify App Development: Building High-Performance Extensions](https://speedboostr.com/shopify-app-development-building-high-performance-extensions-in-2025/)
- [Improve admin performance FAQ](https://community.shopify.dev/t/improve-admin-performance-faq/1100)

---

### Pitfall 9: Incomplete App Store Listing Metadata

**What goes wrong:** App submission is rejected for missing required screenshots (need 3 desktop at 1600x900px), poorly written descriptions with keyword stuffing, app name >30 characters, or feature images without alt text. Reviewers reject immediately without reviewing functionality.

**Why it happens:** Developers focus on building features, treat app listing as afterthought. Don't read Shopify's listing requirements documentation. Copy descriptions from competitors without understanding guidelines. Rush submission without design resources.

**Consequences:**
- Immediate rejection at first screening (before technical review)
- Delays launch by weeks waiting for resubmission review
- Multiple rejection cycles if issues not fully addressed
- Poor app store presentation even if approved
- Low conversion rate: merchants don't understand value proposition
- Missing SEO opportunity in app store search

**Prevention:**
- **Screenshots:** Exactly 3 desktop (1600x900px), crop browser/desktop backgrounds, focus on app functionality
- **App name:** ≤30 characters, matches TOML configuration, no "Shopify" trademark
- **Introduction:** 100 characters, benefit-focused, avoid keyword stuffing, complete sentences
- **Description:** 500 characters, explain functionality clearly, avoid excessive marketing language
- **Features:** ≤80 characters each, focus on merchant benefits not technical details
- **Feature images:** Solid backgrounds, 4.5:1 contrast ratio, always include alt text
- **No PII, pricing, or outcome guarantees** in images/descriptions
- Use Shopify's app listing preview tool before submission
- Get design help for screenshots (Polaris-style mockups)
- Read entire [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) documentation

**Detection:**
- Compare listing to requirements checklist before submission
- Ask colleague to review listing: "Is this clear?"
- Test app name in TOML vs. Partner Dashboard (must match)
- Verify all images are exact required dimensions
- Run descriptions through readability checker (avoid jargon)

**Phase to address:** App Store Submission Preparation (final phase before submission)

**Sources:**
- [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Checklist of requirements for apps in the Shopify App Store](https://shopify.dev/docs/apps/launch/app-requirements-checklist)
- [Listing your app on Shopify App Store — Points to Keep in Mind](https://onlyoneaman.medium.com/listing-your-app-on-shopify-app-store-points-to-keep-in-mind-3e7f09d9b80b)

---

### Pitfall 10: Inadequate Accessibility for Option Groups

**What goes wrong:** Option group dropdowns lack proper ARIA labels, keyboard navigation is broken (tab order skips inputs), screen readers announce wrong information, or color contrast fails WCAG 2.1 AA standards. App store review rejects for accessibility violations.

**Why it happens:** Developers test with mouse only, don't use screen readers or keyboard-only navigation. Copy-paste dropdown code without accessibility attributes. Assume Polaris components are automatically accessible (they need proper props). Color contrast not verified against WCAG standards.

**Consequences:**
- App store rejection for accessibility violations
- Cannot earn "Built for Shopify" badge
- Legal risk: ADA compliance issues
- Excludes disabled merchants and their customers
- Poor user experience for keyboard-only users
- Screen reader users can't complete checkout

**Prevention:**
- **Keyboard navigation:** All dropdowns operable with Tab, Arrow keys, Enter, Escape
- **ARIA labels:** Each option group has `aria-label` or associated `<label>` element
- **Focus management:** Visible focus indicators (not `outline: none`), logical tab order
- **Screen reader testing:** Test with VoiceOver (Mac) or NVDA (Windows)
- **Color contrast:** WCAG 1.4.3 (Level AA) requires 4.5:1 for text, verify with tools
- **Error messages:** Announce validation errors with `aria-live="polite"`
- **Mobile tap targets:** Minimum 48x48px for dropdown triggers
- **Semantic HTML:** Use native `<select>` or properly implemented custom dropdown with `role="listbox"`
- Polaris components: Pass required accessibility props (`label`, `labelHidden` if needed)
- Test with Shopify's accessibility best practices: [Accessibility best practices for Shopify apps](https://shopify.dev/docs/apps/build/accessibility)

**Detection:**
- Keyboard-only testing: unplug mouse, navigate entire widget
- Screen reader testing: VoiceOver on Mac or NVDA on Windows
- axe DevTools browser extension: automated accessibility audit
- Lighthouse accessibility score: must be 90+
- Color contrast checker: verify all text meets WCAG AA
- Tab order verification: focus moves logically through inputs

**Phase to address:** Widget UX Enhancement & Pre-submission Audit (before App Store submission)

**Sources:**
- [Accessibility best practices for Shopify apps](https://shopify.dev/docs/apps/build/accessibility)
- [Dropdown UI Design: Anatomy, UX, and Use Cases](https://www.setproduct.com/blog/dropdown-ui-design)
- [Shopify Accessibility Conformance Report WCAG Edition](https://www.shopify.com/accessibility/vpat-checkout)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-code max 5 option groups per product | Simple validation, no complex UI | Cannot support merchants with 6+ legitimate options, requires code change to adjust | Only for MVP if documented as temporary limit |
| Calculate prices client-side only (no server verification) | Instant UI updates, no API latency | Security risk: users can manipulate prices, no single source of truth | Never - always verify server-side |
| Store option selections in Draft Order metadata as JSON | Easy to implement, flexible structure | Cannot query by option selections, hard to report, data format drifts | Never - use proper relational tables |
| Skip API versioning "we'll handle it later" | Faster initial development | Breaking changes later require emergency hotfixes, no migration path | Never - versioning must be in initial design |
| Use `toFixed(2)` everywhere for currency | Simple rounding solution | Floating-point errors remain, just hidden at display level | Never - use integer (cents) arithmetic |
| Inline all option group logic in widget | No backend dependencies, works offline | Duplicate logic in server/client, hard to maintain, inconsistencies | Never for price calculations (security risk) |
| No database indexes on option group foreign keys | Faster migrations, no index overhead | Slow queries as data grows, poor performance at scale | Only for local development databases |
| Fetch all option groups for store on every API call | Simpler code, no pagination logic | Doesn't scale beyond 50-100 products, high memory usage | Only if documented max products is enforced |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Shopify Draft Orders API | Setting `originalUnitPrice` with `variantId` present (Shopify ignores price) | Use custom line items without `variantId`, set `customAttributes` for dimension data |
| Shopify Product API | Assuming products never deleted, causing orphaned option group assignments | Handle webhook `products/delete`, cascade delete `ProductOptionGroup` records |
| Shopify Webhooks (GDPR) | Implementing stub endpoints that don't actually delete data | Actually delete data from database, test with shop/redact webhook, respond <200ms |
| REST API CORS | Forgetting OPTIONS preflight needs 204 before auth | Handle OPTIONS requests before authentication, return 204 with CORS headers |
| Vercel Serverless Functions | Storing rate limit data in memory (lost between invocations) | Use Redis (Vercel KV) or database for rate limiting state |
| Neon PostgreSQL | Using connection pooling wrong, exhausting connections | Use Prisma with `@prisma/adapter-pg` and proper pool size configuration |
| npm Widget Package | Breaking changes in patch versions (semver violation) | Follow semantic versioning strictly: patches = bugfixes only, minor = new features (backwards compatible), major = breaking changes |
| Shadow DOM Widget | External CSS can't style widget, merchants complain | Design decision: explain in docs, provide CSS custom properties for theming |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 query: fetch option groups for each product individually | Slow product list page, timeouts on matrices index | Use Prisma `include: { optionGroups: true }` in initial query | >10 products with option groups |
| Load all option group choices into widget state at once | High initial load time, large bundle size | Lazy-load option choices on dropdown open | >50 total choices across all groups |
| Recalculate price on every keystroke in dimension inputs | High API request volume, rate limiting kicks in | Debounce price calculations (150ms after last input) | >10 concurrent widget users |
| No pagination on matrices list | Admin UI becomes unusable, timeouts | Implement cursor pagination (Prisma `take`/`skip`), default 20 per page | >50 matrices per store |
| Store full Shopify product data in database | Database bloat, stale data, slow queries | Store only `productId` and `productTitle`, fetch rest from Shopify API as needed | >1000 products per store |
| In-memory rate limiting (current implementation) | Rate limits don't work across Vercel instances, inconsistent enforcement | Migrate to Redis (Vercel KV) for shared rate limit state | >1 Vercel instance (current state) |
| Linear search through option choices to find selection | Slow widget response, janky UI | Use Map/Object for O(1) lookup: `choicesById[id]` | >20 choices per option group |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Accept option selections from client without server validation | Price manipulation: users send fake option IDs to get lower prices | Always recalculate price server-side, validate option IDs exist and belong to product |
| Store API keys in plain text | Credential theft, unauthorized API access | Hash API keys with bcrypt before storing, only show prefix to merchants |
| No rate limiting on `/price` endpoint | DOS attacks, API abuse, Vercel bill explosion | Implement rate limiting (100 requests/minute per API key), consider Redis |
| CORS wildcard `Access-Control-Allow-Origin: *` | API accessible from any origin, credential theft | Restrict to merchant's storefront domains or require API key validation |
| Expose internal option group IDs in URLs | Enumeration attacks, access control bypass | Use UUIDs (cuid) not integers, verify storeId ownership on every query |
| No CSRF protection on admin endpoints | Cross-site request forgery, unauthorized actions | Use Shopify session tokens (App Bridge), verify on every request |
| Log sensitive data (API keys, prices) | Credential exposure, privacy violation | Sanitize logs, only log non-sensitive fields (storeId, action type) |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback when option selected | Users unsure if click registered, click again, confusion | Highlight selected option, show checkmark, announce to screen readers |
| Price updates without showing what changed | Users don't understand why price increased | Show price breakdown: "Base: $100, Glass: +$20, Total: $120" |
| Generic error messages: "Price calculation failed" | Users don't know what to do, abandon cart | Specific errors: "Please select a glass type to see price" |
| Option groups load after dimension inputs | Layout shift, users already entering dimensions when dropdowns appear | Load all inputs together or show skeleton loaders |
| No default option selections | Users must click every dropdown, decision fatigue | Smart defaults: pre-select most common choices, users can change |
| Dropdown labels unclear: "Type", "Finish" | Users don't understand what to choose | Descriptive labels: "Glass Type", "Edge Finish", with help text |
| No mobile optimization | Tiny dropdowns, hard to tap, zooming required | Minimum 48x48px tap targets, native `<select>` on mobile |
| No way to reset configuration | Users stuck after wrong selection, must refresh page | "Reset to defaults" button, clear all selections action |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Option Groups Feature:** Often missing server-side price validation — verify API recalculates price, client can't manipulate
- [ ] **Price Calculation:** Often missing integer (cents) arithmetic — verify no floating-point math in critical paths
- [ ] **API Versioning:** Often missing actual version logic — verify v1 and v2 both work, migration path documented
- [ ] **Database Migration:** Often missing data for existing products — verify old products work without option groups
- [ ] **Widget Integration:** Often missing error states — verify what happens if API down, network timeout, invalid response
- [ ] **Accessibility:** Often missing keyboard navigation — verify tab order, arrow keys, Enter/Escape work
- [ ] **Performance:** Often missing load testing — verify 100 concurrent users, slow network conditions
- [ ] **GDPR Webhooks:** Often missing actual data deletion — verify shop/redact deletes option groups, not just acknowledges
- [ ] **App Store Listing:** Often missing required alt text on images — verify all screenshots have accessibility text
- [ ] **Draft Orders:** Often missing dimension metadata — verify width/height stored as line item properties for merchant reference

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Floating-point price errors in production | MEDIUM | 1. Hotfix: wrap calculations in `Math.round(cents)` 2. Database audit: find incorrect Draft Orders 3. Refund affected customers 4. Full rewrite to integer arithmetic in next release |
| Orphaned option groups after migration | LOW | 1. Write cleanup script: `DELETE FROM option_groups WHERE id NOT IN (...)` 2. Add foreign key constraints 3. Deploy background job for periodic cleanup |
| API breaking changes deployed | HIGH | 1. Emergency rollback 2. Deploy v1/v2 versioning 3. Contact affected merchants 4. Offer migration support 5. Extended deprecation timeline (60 days) |
| App store rejection for performance | MEDIUM | 1. Profile slow queries with Prisma query logging 2. Add database indexes 3. Implement caching layer 4. Resubmit with performance metrics 5. Timeline: 1-2 weeks |
| Price flicker reported by users | LOW | 1. Implement optimistic UI updates 2. Deploy as minor version 3. Announce improvement to merchants 4. Timeline: 2-3 days |
| Accessibility violations found | MEDIUM | 1. Audit with axe DevTools 2. Fix ARIA labels, keyboard nav 3. Screen reader testing 4. Resubmit app store review 5. Timeline: 1 week |
| GDPR complaint: data not deleted | HIGH | 1. Investigate: was webhook received? Did deletion fail? 2. Manually delete data 3. Fix deletion logic 4. Verify with end-to-end test 5. Document incident 6. Timeline: immediate |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Floating Point Rounding Errors | Phase 1: Option Groups Data Model & Price Calculation | Unit tests with currency edge cases, spreadsheet comparison |
| Incorrect Modifier Order | Phase 1: Option Groups Data Model & Price Calculation | Unit test: base $100 + two 10% options = $120 not $121 |
| Orphaned Option Groups | Phase 1: Option Groups Data Model | Database integrity checks, cascade delete tests |
| Missing Data Migration | Phase 1: Option Groups Data Model | Test on production data copy, verify old products work |
| API Breaking Changes | Phase 2: REST API Enhancement | Integration tests for v1 and v2, semantic versioning |
| Cognitive Overload | Phase 3: Widget UX Enhancement | User testing with 5+ options, mobile testing |
| Price Flicker | Phase 3: Widget UX Enhancement | Network throttling test, measure time to price update |
| Performance Issues | Phase 4: Pre-submission Performance Audit | Lighthouse score, load testing, response time monitoring |
| Incomplete Listing Metadata | Phase 5: App Store Submission Preparation | Checklist review, screenshot dimensions, description length |
| Accessibility Violations | Phase 3: Widget UX Enhancement + Phase 4: Pre-submission Audit | Keyboard-only testing, screen reader testing, axe audit |

---

## Phase-Specific Research Flags

Phases likely to need deeper investigation during implementation.

| Phase | Research Needed | Reason |
|-------|-----------------|--------|
| Option Groups Data Model | Schema design patterns for many-to-many with metadata | Complex relationship: products ↔ option groups ↔ choices, need efficient query patterns |
| Price Calculation Logic | Currency arithmetic libraries comparison | Need to evaluate currency.js vs dinero.js vs big.js vs native integers |
| REST API Versioning | Remix API versioning patterns | Remix doesn't have built-in versioning, need custom solution |
| Widget State Management | Optimistic UI patterns for React 18 | May need Zustand or Jotai for complex state with option groups |
| Performance Optimization | Vercel KV (Redis) setup for rate limiting | Current in-memory rate limiting doesn't work with serverless |
| App Store Submission | Shopify's latest 2026 review criteria | Requirements change frequently, verify current checklist |

---

## Sources

### Shopify App Store & Submission
- [Common app rejections](https://shopify.dev/docs/apps/store/common-rejections)
- [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Checklist of requirements for apps in the Shopify App Store](https://shopify.dev/docs/apps/launch/app-requirements-checklist)
- [How to pass the Shopify app store review the first time](https://gadget.dev/blog/how-to-pass-the-shopify-app-store-review-the-first-time-part-1-the-technical-bit)
- [Shopify App Store Approval: Complete Guide](https://eseospace.com/blog/shopify-app-store-approval/)

### Currency & Price Calculations
- [JavaScript Rounding Errors (in Financial Applications)](https://www.robinwieruch.de/javascript-rounding-errors/)
- [Handle Money in JavaScript: Financial Precision Without Losing a Cent](https://dev.to/benjamin_renoux/financial-precision-in-javascript-handle-money-without-losing-a-cent-1chc)
- [Currency Calculations in JavaScript](https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/)
- [How to Handle Monetary Values in JavaScript](https://frontstuff.io/how-to-handle-monetary-values-in-javascript)

### Database Migrations & Schema Changes
- [Data migration challenges: Common issues and fixes](https://www.rudderstack.com/blog/data-migration-challenges/)
- [Safely making database schema changes](https://planetscale.com/blog/safely-making-database-schema-changes)
- [Schema migrations: pitfalls and risks](https://quesma.com/blog-detail/schema-migrations)
- [Database Migrations: Safe, Downtime-Free Strategies](https://vadimkravcenko.com/shorts/database-migrations/)

### API Versioning & Backward Compatibility
- [API Versioning Best Practices for Backward Compatibility](https://endgrate.com/blog/api-versioning-best-practices-for-backward-compatibility)
- [How to handle versioning and backwards compatibility of APIs](https://www.theplatformpm.com/articles/how-to-handle-versioning-and-backwards-compatibility-of-apis)

### UX & Accessibility
- [Accessibility best practices for Shopify apps](https://shopify.dev/docs/apps/build/accessibility)
- [Dropdown UI Design: Anatomy, UX, and Use Cases](https://www.setproduct.com/blog/dropdown-ui-design)
- [Best Practices for Designing Drop-Down Menu](https://vareweb.com/blog/best-practices-for-designing-drop-down-menu/)
- [Understanding optimistic UI and React's useOptimistic Hook](https://blog.logrocket.com/understanding-optimistic-ui-react-useoptimistic-hook/)

### Performance
- [About performance optimization](https://shopify.dev/docs/apps/build/performance)
- [Shopify App Development: Building High-Performance Extensions](https://speedboostr.com/shopify-app-development-building-high-performance-extensions-in-2025/)
- [Improve admin performance FAQ](https://community.shopify.dev/t/improve-admin-performance-faq/1100)

### Shopify APIs
- [DraftOrder REST API](https://shopify.dev/docs/api/admin-rest/latest/resources/draftorder)
- [Draft Order line item limit increase](https://shopify.dev/changelog/draft-order-line-item-limit)
- [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)

---

*Pitfalls research for: QuoteFlow v1.2 (Option Groups & App Store Submission)*
*Researched: 2026-02-09*
*Confidence: HIGH*
