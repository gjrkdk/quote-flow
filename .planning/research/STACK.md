# Stack Additions for Option Groups & App Store Submission

**Project:** QuoteFlow (Shopify Price Matrix App)
**Milestone:** v1.2 - Option Groups + App Store Submission
**Researched:** 2026-02-09
**Confidence:** HIGH

## Executive Summary

This milestone adds customizable option groups (dropdown price modifiers like "Material: Wood (+$5)" or "Finish: Matte") and prepares for Shopify App Store submission. The existing v1.1 stack (Remix 2.5, Polaris 12, Prisma 5.8, PostgreSQL) is sufficient with NO framework upgrades required. Additions focus on:

1. **Data model** for option groups and selected values
2. **Native HTML `<select>` dropdowns** in widget (accessibility best practice)
3. **App Store compliance** (mandatory GDPR webhooks, billing, privacy policy, GraphQL migration)

**Critical App Store Requirement:** As of April 1, 2025, new public apps MUST use GraphQL Admin API exclusively. REST Admin API is legacy. Your current app must migrate from REST to GraphQL before submission.

## NO Stack Changes Required

The existing validated stack is production-ready. DO NOT upgrade:

| Already Validated | Current Version | Keep As-Is |
|-------------------|-----------------|------------|
| Remix | 2.5.0 | Sufficient for admin CRUD and API routes |
| React | 18.2.0 | Widget already works, no need for React 19 |
| Polaris | 12.0.0 | Admin UI component library sufficient |
| Prisma | 5.8.0 | Schema extension for option groups works |
| PostgreSQL | Latest (Neon) | JSON fields for option values supported |
| Vite | 5.0.11 | Widget bundling works |
| TypeScript | 5.3.3 | Type safety sufficient |

**Rationale:** v1.1 is deployed and working. Feature additions don't require framework upgrades. Minimize risk, ship faster.

---

## Stack Additions for Option Groups

### 1. Data Model (Prisma Schema Extension)

**Purpose:** Store option groups per matrix, selected values in draft orders.

**Required Changes:**
```prisma
// Add to existing schema.prisma

model OptionGroup {
  id          Int               @id @default(autoincrement())
  matrixId    String            @map("matrix_id")
  label       String            // "Material", "Finish"
  position    Int               // Display order
  required    Boolean           @default(false)
  createdAt   DateTime          @default(now()) @map("created_at")
  matrix      PriceMatrix       @relation(fields: [matrixId], references: [id], onDelete: Cascade)
  options     OptionValue[]

  @@unique([matrixId, position])
  @@index([matrixId])
  @@map("option_groups")
}

model OptionValue {
  id            Int          @id @default(autoincrement())
  optionGroupId Int          @map("option_group_id")
  label         String       // "Wood", "Matte"
  priceModifier Float        @map("price_modifier")  // +5.00, -2.50, or 0
  position      Int          // Display order within group
  optionGroup   OptionGroup  @relation(fields: [optionGroupId], references: [id], onDelete: Cascade)

  @@unique([optionGroupId, position])
  @@index([optionGroupId])
  @@map("option_values")
}

// Extend DraftOrderRecord to store selected options
model DraftOrderRecord {
  // ... existing fields ...
  selectedOptions Json?        @map("selected_options")  // { "Material": "Wood (+$5)", "Finish": "Matte" }
  // Store as JSON for flexibility: [{ groupLabel: "Material", valueLabel: "Wood", modifier: 5.00 }]
}
```

**Why Prisma JSON field:**
- PostgreSQL supports JSON natively with efficient indexing
- Selected options vary per order, not normalized relations
- Prisma JSON querying: `where: { selectedOptions: { path: ['Material'], equals: 'Wood' } }`
- Validated with Zod at runtime before insert

**Migration:**
```bash
npx prisma migrate dev --name add_option_groups
npx prisma generate
```

**Confidence:** HIGH (Prisma 5.8 supports JSON fields, PostgreSQL native JSON proven)

**Sources:**
- [Prisma JSON Fields Documentation](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)

---

### 2. Widget Dropdown Rendering

**Component:** Native HTML `<select>` (NOT custom React dropdown)

**Why native `<select>`:**
- Screen reader accessible by default (WCAG compliance)
- Keyboard navigation built-in (Tab, Space, Arrow keys)
- Mobile-optimized pickers (iOS wheel, Android native UI)
- Zero JavaScript required for accessibility
- New CSS `appearance: base-select;` allows full styling (Chrome 115+, Safari TP, Firefox review)

**Implementation:**
```tsx
// packages/widget/src/components/OptionGroupSelector.tsx
interface OptionGroupSelectorProps {
  label: string;
  required: boolean;
  options: Array<{ id: number; label: string; priceModifier: number }>;
  value: number | null;
  onChange: (optionValueId: number) => void;
}

export function OptionGroupSelector({
  label,
  required,
  options,
  value,
  onChange,
}: OptionGroupSelectorProps) {
  return (
    <div className="pm-option-group">
      <label htmlFor={`option-${label}`} className="pm-option-label">
        {label} {required && <span className="pm-required">*</span>}
      </label>
      <select
        id={`option-${label}`}
        className="pm-option-select"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        required={required}
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
            {opt.priceModifier !== 0 &&
              ` (${opt.priceModifier > 0 ? '+' : ''}$${opt.priceModifier.toFixed(2)})`}
          </option>
        ))}
      </select>
    </div>
  );
}
```

**NO new dependencies:** Native HTML element, React event handling only.

**Alternative Considered:** Headless UI `<Listbox>` or custom React dropdown.

**Why NOT:**
- Accessibility complexity (ARIA roles, focus management, keyboard nav)
- Mobile incompatibility (custom dropdowns break iOS/Android native pickers)
- Zero benefit for simple price modifier selection
- "Precisely 0 good reasons to redesign the select popup options" (24 Accessibility, 2019)

**Styling:** CSS within Shadow DOM (existing `widgetStyles`), optional `appearance: base-select;` for modern browsers.

**Confidence:** HIGH (Native `<select>` accessibility best practice, no external dependencies)

**Sources:**
- [Select Dropdown Accessibility Checklist](https://www.atomica11y.com/accessible-design/select/)
- [Customizable Native Selects (CSS)](https://medium.com/@karstenbiedermann/customizable-native-selects-a-css-game-changer-for-development-design-c3bbec014f44)
- [WebAXE: Accessible Custom Select Dropdowns](https://www.webaxe.org/accessible-custom-select-dropdowns/)

---

### 3. Price Calculation Enhancement

**Logic:** Sum base matrix price + selected option modifiers.

**Implementation:**
```typescript
// app/routes/api.v1.price.tsx (existing endpoint, extend)
export async function loader({ request }: LoaderFunctionArgs) {
  // ... existing width/height validation ...

  // Parse selected options from query params
  // ?width=100&height=50&options[Material]=1&options[Finish]=2
  const url = new URL(request.url);
  const selectedOptionIds = Object.values(
    Object.fromEntries(
      [...url.searchParams.entries()].filter(([key]) => key.startsWith('options['))
    )
  ).map(Number);

  // Fetch base price from matrix
  const basePrice = calculateMatrixPrice(width, height, matrix);

  // Fetch option values and sum modifiers
  const optionValues = await prisma.optionValue.findMany({
    where: { id: { in: selectedOptionIds } },
    include: { optionGroup: true },
  });

  const totalModifier = optionValues.reduce((sum, opt) => sum + opt.priceModifier, 0);
  const finalPrice = basePrice + totalModifier;

  return json({
    basePrice,
    optionModifier: totalModifier,
    finalPrice,
    currency: store.currency,
    unit: store.unitPreference,
  });
}
```

**Validation (Zod):**
```typescript
import { z } from 'zod';

const OptionSelectionSchema = z.object({
  width: z.coerce.number().positive(),
  height: z.coerce.number().positive(),
  quantity: z.coerce.number().int().positive().default(1),
  selectedOptions: z.record(z.string(), z.coerce.number().int()).optional(),
});
```

**Widget Price Fetching:**
- Extend `usePriceFetch` hook to include `selectedOptions` state
- Debounce API calls when options change (existing `use-debounce@10.0.0` works)
- Display: "Base: $50 + Options: $5 = Total: $55"

**NO new dependencies:** Logic uses existing Zod (already in package.json), Prisma queries.

**Confidence:** HIGH (Extension of existing price calculation, no new APIs)

---

## Stack Additions for App Store Submission

### 4. GraphQL Admin API Migration (MANDATORY)

**Current State:** App uses REST Admin API for Draft Orders, Products.

**Required Change:** Migrate to GraphQL Admin API.

**Why Mandatory:**
- REST Admin API marked legacy (October 2024)
- As of April 1, 2025, new public apps MUST use GraphQL exclusively
- App Store submission rejected if REST API detected

**Implementation:**

Use existing `@shopify/shopify-app-remix@2.7.0` GraphQL client:

```typescript
// app/shopify.server.ts (existing file, ensure GraphQL client configured)
import { shopifyApp } from '@shopify/shopify-app-remix/server';
import { restResources } from '@shopify/shopify-api/rest/admin/2024-01';

export const shopify = shopifyApp({
  // ... existing OAuth config ...
  restResources,  // REMOVE this line after migration
});

// app/routes/app.draft-order.tsx (migrate from REST to GraphQL)
export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  // OLD (REST): admin.rest.resources.DraftOrder.create(...)
  // NEW (GraphQL):
  const response = await admin.graphql(
    `#graphql
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            invoiceUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        input: {
          lineItems: [
            {
              title: productTitle,
              quantity: quantity,
              originalUnitPrice: calculatedPrice,
              customAttributes: [
                { key: 'width', value: String(width) },
                { key: 'height', value: String(height) },
                // Add selected options as custom attributes
                ...Object.entries(selectedOptions).map(([key, val]) => ({
                  key: `option_${key}`,
                  value: val,
                })),
              ],
            },
          ],
        },
      },
    }
  );

  const data = await response.json();
  if (data.data.draftOrderCreate.userErrors.length > 0) {
    throw new Error(data.data.draftOrderCreate.userErrors[0].message);
  }

  return json({ checkoutUrl: data.data.draftOrderCreate.draftOrder.invoiceUrl });
}
```

**Migration Scope:**
- Draft Order creation (REST → `draftOrderCreate` mutation)
- Product fetching for ProductPicker (REST → `products` query)
- Webhook registration (if using REST, migrate to GraphQL)

**NO new dependencies:** `@shopify/shopify-app-remix@2.7.0` includes GraphQL client.

**Confidence:** HIGH (Shopify's official client, mandatory requirement, well-documented)

**Sources:**
- [Shopify GraphQL Admin API Changelog (April 2025 requirement)](https://shopify.dev/changelog/starting-april-2025-new-public-apps-submitted-to-shopify-app-store-must-use-graphql)
- [Draft Order GraphQL Mutation](https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate)
- [GraphQL vs REST Migration Guide](https://shopify.dev/docs/apps/build/graphql/migrate)

---

### 5. Mandatory GDPR Webhooks

**Requirement:** All App Store apps MUST implement 3 GDPR compliance webhooks.

**Current State:** Check `app/routes/webhooks.tsx` for existing webhook handlers.

**Required Webhooks:**

1. **`customers/data_request`** — Merchant requests customer data
2. **`customers/redact`** — Delete customer data (48 hours to comply)
3. **`shop/redact`** — Delete shop data after uninstall (48 hours)

**Implementation:**
```typescript
// app/routes/webhooks.tsx (extend existing file)
import { authenticate } from '~/shopify.server';
import type { ActionFunctionArgs } from '@remix-run/node';

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  switch (topic) {
    case 'CUSTOMERS_DATA_REQUEST':
      // Query database for customer data
      const customerData = await prisma.draftOrderRecord.findMany({
        where: {
          storeId: shop,
          // Match customer ID from payload
        },
      });
      // Send data to merchant via email or Shopify API
      console.log('Customer data request:', customerData);
      break;

    case 'CUSTOMERS_REDACT':
      // Delete or anonymize customer data
      await prisma.draftOrderRecord.updateMany({
        where: {
          storeId: shop,
          // Match customer ID from payload
        },
        data: {
          // Anonymize or delete PII
          // Store GdprRequest record for audit trail
        },
      });
      break;

    case 'SHOP_REDACT':
      // Delete all shop data (uninstall cleanup)
      await prisma.store.delete({ where: { shop } });
      await prisma.priceMatrix.deleteMany({ where: { storeId: shop } });
      await prisma.draftOrderRecord.deleteMany({ where: { storeId: shop } });
      break;

    case 'APP_UNINSTALLED':
      // Cleanup session, mark for shop/redact
      await prisma.store.update({
        where: { shop },
        data: { uninstalledAt: new Date() },
      });
      break;

    default:
      throw new Response('Unhandled webhook topic', { status: 404 });
  }

  return new Response('Webhook processed', { status: 200 });
};
```

**Extend Prisma Schema:**
```prisma
model GdprRequest {
  id          Int              @id @default(autoincrement())
  shop        String
  type        GdprRequestType  // enum: DATA_REQUEST, CUSTOMERS_REDACT, SHOP_REDACT
  payload     Json
  processedAt DateTime?        @map("processed_at")
  createdAt   DateTime         @default(now()) @map("created_at")

  @@index([shop])
  @@index([type])
  @@map("gdpr_requests")
}

enum GdprRequestType {
  CUSTOMERS_DATA_REQUEST
  CUSTOMERS_REDACT
  SHOP_REDACT

  @@map("gdpr_request_type")
}
```

**Webhook Registration:**
Configure in `shopify.app.toml`:
```toml
[webhooks]
api_version = "2026-01"

[[webhooks.subscriptions]]
topics = ["customers/data_request", "customers/redact", "shop/redact", "app/uninstalled"]
uri = "/webhooks"
```

**Testing:**
```bash
# Trigger test webhooks via Shopify CLI
shopify app webhook trigger --topic customers/data_request
shopify app webhook trigger --topic customers/redact
shopify app webhook trigger --topic shop/redact
```

**NO new dependencies:** Webhook handling built into `@shopify/shopify-app-remix`.

**Confidence:** HIGH (Mandatory requirement, official Shopify implementation)

**Sources:**
- [Shopify Privacy Law Compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [GDPR Webhook Implementation Guide](https://medium.com/@muhammadehsanullah123/how-to-configure-gdpr-compliance-webhooks-in-shopify-public-apps-b2107721a58f)
- [App Requirements Checklist](https://shopify.dev/docs/apps/launch/app-requirements-checklist)

---

### 6. Billing Implementation (If Charging Merchants)

**Current State:** Free app (no billing).

**If adding paid plans:** MUST use Shopify Billing API or Managed Pricing.

**Two Options:**

#### Option A: Managed Pricing (Recommended for Simple Plans)
- Configure plans in Partner Dashboard
- Shopify hosts plan selection page
- Automatic trial, proration, charge history
- NO code required for billing UI
- Supports: Free, monthly, annual recurring plans
- Does NOT support: Usage-based, one-time charges

**Setup:**
1. Partner Dashboard → Apps → [Your App] → Pricing
2. Add plans: Free, Basic ($9.99/mo), Pro ($29.99/mo)
3. Enable in `shopify.app.toml`:
```toml
[billing]
managed_pricing_enabled = true
```

#### Option B: Billing API (For Custom Plans)
```typescript
// app/routes/app.billing.tsx
export async function action({ request }: ActionFunctionArgs) {
  const { billing, session } = await authenticate.admin(request);

  const billingCheck = await billing.require({
    plans: [BASIC_PLAN, PRO_PLAN],
    onFailure: async () => billing.request({
      plan: BASIC_PLAN,
      isTest: true, // Remove in production
    }),
  });

  if (billingCheck.appSubscriptions.length > 0) {
    return json({ plan: billingCheck.appSubscriptions[0].name });
  }

  return redirect(await billing.request({ plan: BASIC_PLAN }));
}
```

**Decision:**
- **Free app:** No changes required
- **Fixed pricing ($X/month):** Use Managed Pricing
- **Usage-based (price per matrix):** Use Billing API

**NO new dependencies:** Billing built into `@shopify/shopify-app-remix`.

**Confidence:** HIGH (Optional feature, official Shopify implementation)

**Sources:**
- [Managed Pricing Documentation](https://shopify.dev/docs/apps/launch/billing/managed-pricing)
- [Billing API Guide](https://shopify.dev/docs/apps/launch/billing)

---

### 7. Privacy Policy (MANDATORY)

**Requirement:** Public app listing MUST include privacy policy URL.

**Content Requirements:**
- What data collected from merchants/customers
- How data used, stored, shared
- Third-party services (Vercel, Neon, analytics if any)
- Data retention policy
- GDPR/CCPA compliance (rights to access, delete)
- Contact info for data requests

**Implementation Options:**

#### Option A: Use Shopify's Generator (Quickest)
- https://www.shopify.com/tools/policy-generator
- Select "App Developer" category
- Download and host on public URL

#### Option B: Professional Service
- Termly.io, TermsFeed.com (auto-generated)
- Legal review recommended for complex data handling

**Hosting:**
- Option 1: Static page on app domain (`/privacy-policy`)
- Option 2: External site (GitHub Pages, Notion public page)
- Option 3: Partner Dashboard documentation section

**Link in App Listing:**
- Partner Dashboard → Apps → [Your App] → App listing
- Required field: "Privacy policy URL"

**NO code dependencies:** Static HTML or external service.

**Confidence:** HIGH (Required by Shopify, standard templates available)

**Sources:**
- [Shopify Privacy Requirements](https://shopify.dev/docs/apps/launch/privacy-requirements)
- [Shopify Policy Generator](https://www.shopify.com/tools/policy-generator)

---

### 8. Performance Requirements

**Requirement:** App must NOT reduce Lighthouse scores by more than 10 points.

**Testing Criteria:**
- Home page: 17% weight
- Product page: 40% weight
- Collection page: 43% weight

**Implementation:**

#### Admin App (Embedded)
- Already using Polaris 12 (lightweight)
- Lazy load routes with Remix code splitting
- Monitor bundle size: `npm run build` → check `build/` directory

```typescript
// app/routes/app._index.tsx (dashboard, lazy load heavy components)
const MatrixGrid = lazy(() => import('~/components/MatrixGrid'));

export default function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <MatrixGrid />
    </Suspense>
  );
}
```

#### Widget (Storefront)
- Current bundle: Already optimized (Shadow DOM, minimal deps)
- Ensure widget bundle < 50KB gzipped
- Check: `npm run build` in `packages/widget/`, inspect `dist/` size

**Monitoring:**
```bash
# Run Lighthouse on test store after installation
lighthouse https://test-store.myshopify.com/products/test-product --view
```

**NO new dependencies:** Use existing Remix code splitting, Vite bundle analysis.

**Confidence:** MEDIUM (Need to test with Shopify's review process, but current stack lightweight)

**Sources:**
- [Shopify App Store Requirements (Performance)](https://shopify.dev/docs/apps/launch/app-requirements-checklist)
- [Lighthouse Performance Guide](https://developer.chrome.com/docs/lighthouse/performance/)

---

## Installation Commands

### Option Groups Schema Migration
```bash
# Add option groups schema to prisma/schema.prisma
npx prisma migrate dev --name add_option_groups
npx prisma generate

# Verify migration
npx prisma studio  # Check OptionGroup, OptionValue tables exist
```

### GDPR Webhooks Setup
```bash
# Update shopify.app.toml with webhook topics
# Deploy to Vercel
vercel --prod

# Test webhooks
shopify app webhook trigger --topic customers/data_request
shopify app webhook trigger --topic customers/redact
shopify app webhook trigger --topic shop/redact

# Verify webhook endpoint responds 200 OK
curl -X POST https://your-app.vercel.app/webhooks \
  -H "X-Shopify-Topic: customers/data_request" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com"
```

### GraphQL Migration Verification
```bash
# Remove REST API usage, test Draft Order creation
npm run dev
# Test in embedded admin: Create matrix → Create draft order
# Check network tab: Only GraphQL requests to /admin/api/2026-01/graphql.json
```

### Privacy Policy Hosting
```bash
# Option 1: Add static route to Remix app
# app/routes/_index.privacy-policy.tsx
export default function PrivacyPolicy() {
  return <div>{/* Privacy policy content */}</div>;
}

# Option 2: Host on external service (Notion, GitHub Pages)
# Copy URL to Partner Dashboard app listing
```

---

## Pre-Submission Checklist

Before submitting to App Store, verify:

- [ ] **GraphQL Migration:** No REST API calls in code (`grep -r "admin.rest" app/`)
- [ ] **GDPR Webhooks:** All 3 webhooks respond 200 OK (test with Shopify CLI)
- [ ] **Privacy Policy:** Public URL accessible, linked in app listing
- [ ] **Billing:** If paid app, Managed Pricing or Billing API configured
- [ ] **Performance:** Lighthouse scores not degraded >10 points on test store
- [ ] **Test Store:** Full E2E flow works (install, create matrix, create draft order, widget rendering)
- [ ] **App Listing:** Screenshots, description, support email, demo video (optional)
- [ ] **OAuth Scopes:** Only request necessary permissions (`read_products`, `write_draft_orders`)
- [ ] **Error Handling:** No 404/500 errors in admin UI, API returns proper status codes
- [ ] **Credentials:** Test store credentials submitted with app review (full access)

**Run Automated Checks:**
```bash
# Shopify CLI pre-submission checks
shopify app deploy
# Partner Dashboard → Apps → [Your App] → App Store listing → "Run checks"
```

---

## What NOT to Add

| Technology | Why Avoid | Instead Use |
|------------|-----------|-------------|
| **Headless UI / Radix UI** | Overkill for simple dropdowns, adds bundle size | Native `<select>` |
| **React 19** | Unnecessary upgrade, potential breaking changes | Keep React 18.2.0 |
| **Custom dropdown libraries** | Accessibility complexity, mobile incompatibility | Native HTML `<select>` |
| **Prisma 6/7 upgrade** | No new features needed, migration risk | Keep Prisma 5.8.0 (stable) |
| **Separate JSON validation library** | Zod already in stack | Extend existing Zod schemas |
| **Shopify REST Admin API** | Deprecated, blocks App Store submission | Migrate to GraphQL |
| **Custom billing UI** | Shopify requires Billing API or Managed Pricing | Use Shopify's billing |
| **Third-party analytics** | Review required, adds complexity | Start without, add post-launch |

---

## Version Compatibility Matrix

| Package | Current | Required | Notes |
|---------|---------|----------|-------|
| `@shopify/shopify-app-remix` | 2.7.0 | 2.7.0+ | Includes GraphQL client, GDPR webhook support |
| `prisma` | 5.8.0 | 5.8.0+ | JSON field support, no upgrade needed |
| `zod` | 4.3.6 | 4.x | Runtime validation for option selections |
| Node.js | 20.x | 20.0.0+ | Vercel default, required for Shopify CLI |

**No version upgrades required.** Existing stack validated in v1.1 production deployment.

---

## Sources

### Shopify App Store Requirements
- [App Store Requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) — Official submission checklist
- [App Requirements Checklist](https://shopify.dev/docs/apps/launch/app-requirements-checklist) — Technical requirements
- [GraphQL Mandatory (April 2025)](https://shopify.dev/changelog/starting-april-2025-new-public-apps-submitted-to-shopify-app-store-must-use-graphql) — REST deprecation

### GDPR Compliance
- [Privacy Law Compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance) — Official GDPR webhook docs
- [How to Configure GDPR Webhooks](https://medium.com/@muhammadehsanullah123/how-to-configure-gdpr-compliance-webhooks-in-shopify-public-apps-b2107721a58f) — Implementation guide

### Billing
- [Managed Pricing Documentation](https://shopify.dev/docs/apps/launch/billing/managed-pricing) — Shopify-hosted billing
- [Billing API Guide](https://shopify.dev/docs/apps/launch/billing) — Custom billing implementation

### Accessibility & Dropdowns
- [Select Dropdown Accessibility](https://www.atomica11y.com/accessible-design/select/) — WCAG best practices
- [Native vs Custom Dropdowns](https://www.webaxe.org/accessible-custom-select-dropdowns/) — Why native `<select>` wins
- [Customizable Native Selects](https://medium.com/@karstenbiedermann/customizable-native-selects-a-css-game-changer-for-development-design-c3bbec014f44) — CSS `appearance: base-select;`

### Data Model & Validation
- [Prisma JSON Fields](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) — JSON querying in PostgreSQL
- [Zod Documentation](https://zod.dev/) — Runtime TypeScript validation

### Privacy Policy
- [Shopify Privacy Requirements](https://shopify.dev/docs/apps/launch/privacy-requirements) — What to include
- [Shopify Policy Generator](https://www.shopify.com/tools/policy-generator) — Free template

### Performance
- [App Store Best Practices](https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices) — Lighthouse requirements
- [Lighthouse Performance](https://developer.chrome.com/docs/lighthouse/performance/) — Testing guide

---

**Researched:** 2026-02-09
**Confidence:** HIGH (All requirements verified with official Shopify documentation)
**Next Step:** Implement option groups schema → Admin CRUD → Widget dropdowns → GraphQL migration → GDPR webhooks → App Store submission
