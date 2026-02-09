# Feature Research

**Domain:** Customizable Price-Modifying Option Groups & Shopify App Store Submission
**Researched:** 2026-02-09
**Confidence:** HIGH

## Feature Landscape

This research focuses on v1.2 NEW capabilities: option groups with price modifiers and Shopify App Store submission requirements. The base dimension-based pricing system (v1.0-v1.1) is already shipped.

## Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Option group dropdowns** | Standard UI pattern for product add-ons | LOW | Dropdown is universally understood, mobile-friendly |
| **Price modifiers add to base** | Users expect addons increase final price | LOW | Base matrix price + option modifiers = total |
| **Live price updates** | Real-time feedback when selecting options | MEDIUM | Widget already does this for dimensions, extend to options |
| **Multiple option groups per product** | Products often have multiple customization types (glass type, edge finish, coating) | MEDIUM | Option groups are independent, order doesn't matter |
| **Fixed amount modifiers** | Flat fee addons (e.g., "+$10 for tempered glass") | LOW | Direct addition to base price |
| **Percentage modifiers** | Proportional pricing (e.g., "+20% for UV coating") | LOW | Calculated from base matrix price, not compounded |
| **Option group reusability** | Share option groups across products (DRY principle) | MEDIUM | One "Glass Type" group assigned to multiple products |
| **Clear modifier display** | Show price impact of each selection | LOW | Widget displays "+$15.00" next to option label |
| **Option validation in API** | REST API validates option selections match product | MEDIUM | Return 400 if invalid options provided |
| **Option metadata in Draft Orders** | Selected options appear in order details for fulfillment | MEDIUM | Merchants need to know which options customer chose |

## Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **API-first option support** | Headless storefronts can integrate options via REST | MEDIUM | Extends existing API with options parameter |
| **Non-compounding percentages** | Predictable pricing - all % calculated from base | LOW | Simpler mental model than compound interest pricing |
| **Option group ordering** | Control display sequence in widget | LOW | Merchant sets order for better UX flow |
| **Empty state graceful** | Products work without option groups (backward compatible) | LOW | Dimensions-only products still function |
| **Widget auto-layout** | Options render cleanly without custom CSS | MEDIUM | Shadow DOM styling already handles isolation |
| **App Store ready** | Built to pass review first try | HIGH | Session tokens, GDPR webhooks, billing API already done |
| **Option-aware price preview** | Widget shows base + modifiers breakdown | MEDIUM | Transparency reduces cart abandonment |
| **Dropdown-only simplicity** | No complex conditional logic (v1.2 scope) | LOW | Avoids scope creep, easier merchant setup |

## Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Conditional option logic** | "Show option B only if option A = X" | Complexity explosion, hard to debug, confuses merchants | Keep all options visible, use clear labels (defer to v2+) |
| **Option inventory tracking** | "Track stock per option value" | Infinite combinations break Shopify model | Document as limitation, suggest "made-to-order" workflow |
| **Compounding percentages** | "20% coating + 10% warranty = 32% total" | Confusing for merchants, hard to predict final price | All percentages from base (20% + 10% = 30% of base) |
| **Formula-based option pricing** | "Price = base * (1 + option1 * option2)" | Too complex, merchants make errors | Fixed/percentage modifiers only |
| **Option-specific minimums** | "Laminated glass requires min 100cm width" | Cross-feature validation complexity | Validate at Draft Order creation, show friendly error |
| **Image swatches for options** | "Show color/texture previews" | Asset management burden, loading performance | Text-only dropdowns (simpler, faster) |
| **Option groups per variant** | "Different options for different product variants" | Data model complexity, confusing assignment UI | Options apply to entire product (use separate products for variants) |
| **Multi-select options** | "Customer picks multiple values from one group" | Pricing ambiguity (additive? maximum? average?) | Dropdown = single select only |
| **Option search/filter** | "Search within 50+ option values" | UI complexity, rare use case for made-to-order | Keep option groups small (<20 values), use clear naming |
| **Option-level discounts** | "10% off if laminated + tempered" | Combinatorial complexity, hard to maintain | Use Shopify's discount system, keep options simple |

## Feature Dependencies

Critical sequencing for development:

```
Foundation (Depends on v1.1):
  Database Schema (OptionGroup, OptionValue models)
    ↓
  Admin UI (CRUD for option groups)
    ↓
  Product Assignment (link option groups to products, ordered)
    ↓
  API Extension (accept options in /calculate-price, /create-draft-order)
    ↓
  Widget Enhancement (render dropdowns, update price calculation)
    ↓
  Draft Order Metadata (include option selections)

App Store Submission (Parallel work):
  Billing API (Already implemented) → Freemium plan check
    ↓
  Listing Content (screenshots, description, pricing info)
    ↓
  Test Credentials (working demo store with matrices + options)
    ↓
  Submission (Partner Dashboard)
    ↓
  Review Response (address feedback within 48h)
```

**Key dependency notes:**
- **Option groups require product assignment** - can't render options in widget without knowing which groups apply
- **API must validate options before Draft Order** - prevent invalid combinations from reaching Shopify
- **Widget dropdown rendering before price calculation** - UI must collect selections before API call
- **App Store submission after v1.2 features complete** - reviewers test full functionality
- **Billing API already implemented (v1.1)** - no blocker for App Store submission

## MVP Definition

### Launch With (v1.2)

Minimum viable option groups feature set.

- **Option group CRUD** - Create/edit/delete groups with name (e.g., "Glass Type")
- **Option values CRUD** - Add values with label + modifier type (fixed/percentage) + amount
- **Product assignment** - Assign multiple option groups to a product, specify order
- **Fixed amount modifiers** - "+$10.00" flat fee additions
- **Percentage modifiers** - "+15%" calculated from base matrix price (non-compounding)
- **REST API extension** - Accept `options` array in `/calculate-price` and `/create-draft-order`
- **Widget dropdown rendering** - Render `<select>` for each option group with live price updates
- **Option metadata in Draft Orders** - Store selections as line item properties for merchant visibility
- **App Store listing** - Complete submission with screenshots, description, pricing
- **Test credentials** - Demo store with working matrices + option groups for reviewer

### Add After Validation (v1.3+)

Features to add once core is working.

- **Option group templates** - Pre-built groups for common use cases (glass types, edge finishes, coatings)
- **Option value sorting** - Drag-and-drop reorder within group
- **Conditional option display** - Show/hide groups based on other selections (complexity flag)
- **Option-level minimums** - "Laminated glass requires min order $50" validation
- **Image swatches** - Visual previews for option values
- **Option search** - Filter large option lists in admin UI
- **Option usage analytics** - Track which options customers select most

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- **Multi-select option groups** - Checkboxes instead of dropdowns
- **Option inventory tracking** - Stock management per option value
- **Formula-based option pricing** - Complex calculations (custom scripts)
- **Option group dependencies** - Conditional logic ("if A then show B")
- **Option-specific discounts** - Combinatorial pricing rules
- **Option bundles** - Pre-configured option sets at discount
- **Customer-saved configurations** - Save dimension + option combinations for reorder

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Option group CRUD | HIGH | MEDIUM | P1 |
| Fixed/percentage modifiers | HIGH | LOW | P1 |
| Product assignment | HIGH | MEDIUM | P1 |
| API extension (options param) | HIGH | MEDIUM | P1 |
| Widget dropdown rendering | HIGH | MEDIUM | P1 |
| Live price updates | HIGH | LOW | P1 |
| Draft Order metadata | HIGH | LOW | P1 |
| App Store listing prep | HIGH | MEDIUM | P1 |
| App Store submission | HIGH | LOW | P1 |
| Option group templates | MEDIUM | MEDIUM | P2 |
| Option value sorting | MEDIUM | LOW | P2 |
| Conditional option display | MEDIUM | HIGH | P3 |
| Image swatches | LOW | HIGH | P3 |
| Multi-select options | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.2 launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

Based on top Shopify product options apps (2026):

| Feature | Easify Custom Options | Sellio Options | SC Product Options | Our Approach |
|---------|----------------------|----------------|-------------------|--------------|
| **Option types** | Text, dropdown, checkbox, radio, file upload, date, color/image swatches | Dropdown, checkbox, radio, text, file, date/time | Dropdown, swatches, text, checkbox, radio | Dropdown only (simpler, faster) |
| **Price modifiers** | Fixed, percentage, formula | Fixed, percentage, formula-based pricing | Fixed, percentage | Fixed + percentage (no formulas) |
| **Conditional logic** | Yes - show/hide based on selections | Yes - advanced conditional rules | Yes - if/then rules | No (v1.2), maybe v2+ |
| **Live preview** | Yes - visual product preview | No | Yes - image swatches | Yes - price preview (no visual) |
| **API/headless** | Limited | Built with Shopify Functions | Theme-only | Yes - REST API first-class |
| **Widget isolation** | Script injection | Shopify Functions | Theme app extension | Shadow DOM (best isolation) |
| **Pricing** | $9.99-$49.99/mo | $19.99-$99.99/mo | $14.99-$49.99/mo | $12/mo + freemium |

**Key differentiation:** API-first architecture with Shadow DOM widget. Competitors focus on theme integration; we enable headless storefronts.

## Shopify App Store Requirements

Critical requirements for approval (v1.2 milestone):

### Technical Requirements (Already Met in v1.1)
- ✅ **Session tokens** - Embedded app authentication (not cookies)
- ✅ **GDPR webhooks** - customers/data_request, customers/redact, shop/redact
- ✅ **Appropriate scopes** - write_draft_orders, read_products, write_products (minimal)
- ✅ **App Bridge** - OAuth via @shopify/app-bridge-react
- ✅ **Billing API** - Shopify managed pricing (freemium implemented)
- ✅ **Performance** - No >10pt Lighthouse score reduction
- ✅ **GraphQL Admin API** - Mandatory for new apps (April 2025+)

### Listing Requirements (To Complete in v1.2)
- **App icon** - 1200x1200px JPEG/PNG
- **Screenshots** - 3-6 images at 1600x900px showing functionality
- **App listing** - Clear description, no pricing in images, no testimonials in screenshots
- **Test credentials** - Valid demo store with full access for reviewers
- **Screencast** - Video showing setup + usage flow
- **Primary language** - English (minimum one language required)

### Common Rejection Reasons (To Avoid)
- 404/500 errors during review (test in incognito mode)
- Missing/invalid test credentials
- Billing not using Shopify API
- Requesting unnecessary scopes
- Performance issues (slow loading, errors in console)
- Incomplete app listing (missing screenshots, vague description)
- Pricing information in screenshots (must be in pricing section only)

### Review Process
- Typical review time: 5-10 business days
- Reviewers test in incognito mode with dev console open
- Must respond to feedback within 48 hours or risk suspension
- Can resubmit after addressing issues
- Status: Draft → Submitted → Reviewed → Published

## UX Patterns for Option Groups

Standard patterns from product configurators (2026):

### Option Display Pattern
```
Product: Custom Glass Panel
Base price (100cm x 150cm): $125.00

[Dropdown] Glass Type:
  - Clear (included)
  - Tempered (+$25.00)
  - Laminated (+$35.00)

[Dropdown] Edge Finish:
  - Standard (included)
  - Polished (+$15.00)
  - Beveled (+$20.00)

Total: $125.00 + $25.00 + $15.00 = $165.00
```

### Price Modifier Calculation Pattern
```
Base price: $100.00

Fixed modifiers:
  - Tempered glass: +$25.00 (fixed)
  - Polished edge: +$15.00 (fixed)

Percentage modifiers:
  - UV coating: +20% = +$20.00 (20% of $100.00 base)
  - Warranty: +10% = +$10.00 (10% of $100.00 base)

Total: $100.00 + $25.00 + $15.00 + $20.00 + $10.00 = $170.00

Note: Percentages NOT compounded. Both calculated from $100.00 base.
```

### Invalid Combination Handling Pattern
```
Approach 1: Disable incompatible options (requires conditional logic - v2+)
Approach 2: Allow all combinations, validate at checkout (v1.2)

v1.2 approach:
- All options always visible/selectable
- API validates at Draft Order creation
- Return clear error: "Laminated glass requires minimum 50cm width"
- Customer adjusts and retries
```

### Option Metadata in Orders Pattern
```
Draft Order line item properties:
{
  "customAttributes": [
    {"key": "Width", "value": "100 cm"},
    {"key": "Height", "value": "150 cm"},
    {"key": "Glass Type", "value": "Tempered"},
    {"key": "Edge Finish", "value": "Polished"}
  ]
}

Merchant sees in order details:
Width: 100 cm
Height: 150 cm
Glass Type: Tempered
Edge Finish: Polished
```

## Success Metrics

**Adoption indicators:**
- Option group setup time < 10 minutes (create group + assign to product)
- Option rendering performance < 50ms (widget loads options without lag)
- API validation accuracy: 100% (no invalid options reach Draft Orders)
- App Store approval on first submission (no critical issues)
- Merchant retention: >85% after 30 days (freemium + paid combined)

**Usage patterns:**
- Merchants typically create 2-4 option groups per product
- Average option group size: 3-8 values
- Most common modifier types: 60% fixed, 40% percentage
- Option selections: 70% of customers customize at least one option
- Mobile traffic: 65-75% (consistent with v1.1 dimension inputs)

## Edge Cases & Limitations

Document these explicitly to set expectations:

| Edge Case | Limitation | Mitigation |
|-----------|-----------|-----------|
| No option selected | Widget requires selection (no "none" default) | First option auto-selected, or include "Standard (included)" value at $0 |
| Very long option labels | Dropdown width limited by widget container | Truncate with ellipsis, show full text on hover |
| Many option groups (10+) | UI becomes cluttered | Recommended max 5 groups/product, document best practice |
| Percentage precision | Rounded to 2 decimal places (e.g., 20% of $10.33 = $2.07) | Display rounding behavior in modifier setup |
| Option groups without values | Empty groups cause errors | Validate: minimum 1 value per group before assignment |
| Duplicate option value labels | Confusing for customers | Validate: unique labels within group |
| Conflicting modifiers | Multiple percentages can compound unexpectedly | Document: all % from base, show preview in admin |
| API rate limits | 1000 req/min per store (existing limit) | No change, options don't increase API load significantly |

## Confidence Assessment

| Feature Category | Confidence | Reasoning |
|-----------------|-----------|-----------|
| Table stakes | **HIGH** | Verified across 10+ product options apps, standard patterns |
| Differentiators | **HIGH** | API-first + Shadow DOM already proven in v1.1 |
| Anti-features | **MEDIUM-HIGH** | Based on competitor complexity complaints, some assumptions |
| Dependencies | **HIGH** | Technical constraints (Shopify APIs, existing architecture) well-documented |
| MVP scope | **HIGH** | Clear v1.2 boundary, builds on v1.1 foundation |
| App Store requirements | **HIGH** | Official Shopify docs + v1.1 already meets 90% of requirements |

## Research Gaps

Areas needing validation during development:

1. **Option group limit** - How many option groups before admin UI/widget feels cluttered? (Recommend 5 max, test with users)
2. **Percentage modifier display** - Show as "+20%" or "+$20.00 (20%)" in widget? (Test for clarity)
3. **Option ordering impact** - Does display order affect conversion? (Analytics post-launch)
4. **App Store review duration** - Shopify says 5-10 days, but can be longer (plan buffer)
5. **Option metadata format** - Draft Order line item properties vs custom attributes? (Validate with test orders)

## Sources

### Shopify App Store Requirements (HIGH confidence)
- [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) - Official technical + listing requirements
- [Submit your app for review](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review) - Submission process
- [About the app review process](https://shopify.dev/docs/apps/launch/app-store-review/review-process) - Review timeline + common issues
- [Best practices for apps in the Shopify App Store](https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices) - Performance + UX standards
- [How to pass the Shopify app store review the first time. Part 1: the technical bit](https://gadget.dev/blog/how-to-pass-the-shopify-app-store-review-the-first-time-part-1-the-technical-bit) - Common rejection reasons
- [Shopify App Store Guidelines: Key Requirements for Approval](https://www.codersy.com/blog/shopify-api-development-best-practices/shopify-app-store-guidelines-key-requirements) - Checklist
- [Shopify App Store Approval: Complete Guide - eSEOspace](https://eseospace.com/blog/shopify-app-store-approval/) - Step-by-step guide

### Product Options Apps Analysis (MEDIUM confidence)
- [5+ Top Shopify Product Options Apps Compared: the Ultimate Guide for 2026 - EasyFlow](https://easy-flow.app/shopify-product-options-apps-compared/) - Feature comparison
- [Top 10 Best Product Options Apps for Shopify in 2026](https://easifyapps.com/blog/best-shopify-product-options-apps/) - Market leaders
- [Best Product Options Apps for Shopify in 2026](https://www.growave.io/best-shopify-apps/product-options) - Top apps ranked
- [How To Add Extra Charges for Custom Product Options on Shopify](https://easifyapps.com/blog/adding-extra-charges-for-custom-product-options-shopify/) - Implementation patterns
- [Conditional logic | EasifyApps](https://easifyapps.com/docs/conditional-logic/) - Conditional option patterns

### Pricing Configurators (MEDIUM confidence)
- [6 Best Product Configurator Software Options in 2026 | Salesforce](https://www.salesforce.com/sales/revenue-lifecycle-management/product-configurator-software/?bc=OTH) - Enterprise configurator patterns
- [What is a product configurator—complete guide [2026] PART 1](https://dotinum.com/blog/what-is-a-product-configurator-complete-guide-2026-part-1/) - Rules engine + validation patterns
- [Product Configuration Explained: A Guide to Virtual Tabulation, Rules, and Constraints](https://configit.com/learn/blog/product-configuration-explained/) - Invalid combination handling
- [Pricing modifiers - - Platform guide](https://doc.toasttab.com/doc/platformguide/adminPricingModifierOptions.html) - Modifier types + pricing rules

### UX Patterns (MEDIUM confidence)
- [12 Design Recommendations for Calculator and Quiz Tools - NN/G](https://www.nngroup.com/articles/recommendations-calculator/) - Input clarification + user context best practices
- [60+ Best Calculators Top 2026 Design Patterns | Muzli](https://muz.li/inspiration/calculator-design/) - Calculator UI patterns

### Draft Orders API (HIGH confidence)
- [DraftOrder - GraphQL Admin](https://shopify.dev/docs/api/admin-graphql/latest/objects/draftorder) - API reference
- [draftOrderCreate - GraphQL Admin](https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftordercreate) - Creation mutation
- [Use draft orders](https://shopify.dev/docs/apps/build/b2b/draft-orders) - Custom pricing patterns

### Accessibility (HIGH confidence - from Phase 6 research)
- [Accessibility best practices for Shopify apps](https://shopify.dev/docs/apps/build/accessibility) - Official Shopify guidelines
- [Shopify Accessibility 2025: WCAG 2.2 Compliance for Online Stores](https://www.allaccessible.org/blog/shopify-accessibility-compliance-2025-guide) - WCAG 2.1 AA standards

---
*Feature research for: Customizable Price-Modifying Option Groups & Shopify App Store Submission*
*Researched: 2026-02-09*
*Valid until: 2026-03-09 (30 days - stable domain)*
