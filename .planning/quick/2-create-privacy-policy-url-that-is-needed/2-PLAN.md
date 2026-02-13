---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/routes/privacy.tsx
autonomous: true
must_haves:
  truths:
    - "Visiting https://quote-flow-one.vercel.app/privacy shows the privacy policy"
    - "Privacy policy covers all Shopify App Store requirements"
    - "Page is publicly accessible without Shopify authentication"
  artifacts:
    - path: "app/routes/privacy.tsx"
      provides: "Privacy policy page at /privacy"
      min_lines: 80
  key_links:
    - from: "app/routes/privacy.tsx"
      to: "/privacy"
      via: "Remix file-based routing"
      pattern: "export default function"
---

<objective>
Create a privacy policy page at /privacy that satisfies Shopify App Store submission requirements.

Purpose: Shopify requires a publicly accessible privacy policy URL for App Store listing. The URL https://quote-flow-one.vercel.app/privacy is already documented in the submission materials (description.md line 109, submission-checklist.md line 137).
Output: A working /privacy route with complete privacy policy content.
</objective>

<execution_context>
@/Users/robinkonijnendijk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/robinkonijnendijk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/app-store/description.md
@.planning/app-store/submission-checklist.md
@app/root.tsx
@app/routes/_index.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create privacy policy route at /privacy</name>
  <files>app/routes/privacy.tsx</files>
  <action>
Create `app/routes/privacy.tsx` as a standalone public page. This route does NOT use Shopify authentication (no `authenticate.admin` call) -- it is a public-facing page accessible by anyone.

The page must use inline styles (not Polaris) since this is a public legal page, not part of the Shopify admin. The root layout loads Polaris CSS and App Bridge script -- these will still load but the privacy page itself should render its own clean layout with inline styles for the legal content.

Add a `meta` export for SEO: title "Privacy Policy - Price Matrix", description about privacy practices.

Add a `headers` export to set `Cache-Control: public, max-age=86400` (cache for 1 day since this changes rarely).

Privacy policy content must cover these Shopify-required sections:

**App identity:**
- App name: Price Matrix
- Developer: Robin Konijnendijk
- Contact: robinkonijnendijk@gmail.com

**Data collected from merchants:**
- Shopify store domain and session tokens (for authentication)
- Pricing matrix configurations (breakpoints, prices)
- Option group configurations (choices, modifiers)
- Product assignment data
- API keys (generated per store for REST API access)

**Data collected from customers (via merchant's storefront):**
- Product dimensions entered for pricing calculations (not stored permanently)
- Option selections for pricing calculations (not stored permanently)
- Draft order data passed to Shopify (stored in Shopify, not in our database beyond order reference)

**How data is used:**
- Merchant data: To provide pricing matrix and option group functionality
- Customer data: To calculate prices and create Shopify draft orders
- No data is sold to third parties
- No advertising or tracking

**Third-party services:**
- Vercel (hosting, serverless functions) - processes requests
- Neon (PostgreSQL database) - stores merchant configuration data
- Shopify (platform) - draft order creation, product data

**Data retention:**
- Merchant data retained while app is installed
- On app uninstall: Data deleted via Shopify SHOP_REDACT webhook (GDPR compliant, implemented in Phase 15)
- Customer data request handling via CUSTOMERS_DATA_REQUEST webhook
- Customer data deletion via CUSTOMERS_REDACT webhook

**GDPR/CCPA rights:**
- Right to access your data
- Right to request deletion
- Right to data portability
- Contact robinkonijnendijk@gmail.com for any data requests

**Effective date:** Use February 2026

Style the page with a clean, readable layout: max-width 800px centered, comfortable line-height (1.7), proper heading hierarchy (h1 for title, h2 for sections), system font stack. Light background (#fafafa or similar), dark text. Simple and professional -- this is a legal document.
  </action>
  <verify>
Run `npx remix vite:build` to confirm the route compiles without errors. Verify the file exports a default component and a meta function.
  </verify>
  <done>
`app/routes/privacy.tsx` exists, compiles successfully, and contains a complete privacy policy covering: data collected, data usage, third-party services, data retention, GDPR rights, and contact information. The route is public (no Shopify auth).
  </done>
</task>

</tasks>

<verification>
1. `npx remix vite:build` succeeds without errors
2. Route file exports default function component and meta function
3. No `authenticate.admin` import in privacy.tsx (public page)
4. Privacy policy text covers all Shopify-required sections
</verification>

<success_criteria>
- /privacy route compiles and builds successfully
- Privacy policy contains all required legal sections for Shopify App Store submission
- Page is publicly accessible (no Shopify authentication required)
- After deploy, https://quote-flow-one.vercel.app/privacy will serve the privacy policy
</success_criteria>

<output>
After completion, create `.planning/quick/2-create-privacy-policy-url-that-is-needed/2-SUMMARY.md`
</output>
