# App Store Submission Checklist

**Date:** 2026-02-12
**Phase:** 16-performance-audit-app-store-submission
**Plan:** 03

---

## Technical Requirements

### GDPR Compliance
- [x] **PASS:** CUSTOMERS_DATA_REQUEST webhook configured (shopify.server.ts:51)
- [x] **PASS:** CUSTOMERS_REDACT webhook configured (shopify.server.ts:55)
- [x] **PASS:** SHOP_REDACT webhook configured (shopify.server.ts:59)
- [x] **PASS:** Async job queue for GDPR processing (job-queue.server.ts, api.cron.process-jobs.ts, Phase 15-02)

### Billing & OAuth
- [x] **PASS:** Billing API configured (shopify.server.ts:37-43, BillingInterval.Every30Days)
- [x] **PASS:** OAuth flow implemented (app/routes/auth.$.tsx exists)

### App Integration
- [x] **PASS:** App Bridge script loaded (root.tsx:25, CDN: https://cdn.shopify.com/shopifycloud/app-bridge.js)
- [x] **PASS:** Shopify API key meta tag present (root.tsx:21-24)
- [x] **PASS:** Scopes defined in shopify.app.toml (write_draft_orders, read_products, write_products)

### Performance & Database
- [x] **PASS:** Database indexes verified (prisma/INDEXES_VERIFICATION.md, all 11 FK columns indexed, Phase 16-01)
- [x] **PASS:** Lighthouse CI configured (.lighthouserc.cjs exists, Phase 16-01)
- [x] **PASS:** Lighthouse CI installed (@lhci/cli@^0.15.1 in package.json:45)
- [x] **PASS:** GitHub Actions workflow ready (.github/workflows/lighthouse-ci.yml, Phase 16-01)

### API Compatibility
- [x] **PASS:** GraphQL Admin API migration complete (Phase 15: GraphQL used in draft-order.server.ts, api.v1.draft-orders.ts)
- [x] **PASS:** No deprecated REST Admin API usage for product/order mutations (verified via grep, REST only used for custom app API endpoints)

---

## App Listing Requirements

### Content
- [x] **PASS:** App introduction ready (68/100 characters, description.md:17)
  - Text: "Dimension-based pricing with option groups for custom product businesses"
- [x] **PASS:** App details ready (492/500 characters, description.md:25-27)
  - Includes v1.2 option groups feature
- [x] **PASS:** Search terms defined (5 terms max, description.md:48-52)
  - Terms: custom pricing, dimension pricing, option groups, price modifiers, made to order
- [x] **PASS:** Categories selected (description.md:60-61)
  - Primary: Product Customization, Secondary: Pricing & Merchandising

### Test Credentials
- [x] **PASS:** Test credentials template ready (.planning/app-store/demo-store.md exists, Phase 16-02)
- [x] **PASS:** Test store documented (dynamic-pricing-demo.myshopify.com, demo-store.md:11)
- [x] **PASS:** Test scenarios documented (5 comprehensive scenarios, demo-store.md:49-202)
- [x] **WARN:** Credentials placeholders present ([FILL_IN] markers in demo-store.md:14-15)
  - **Action required:** Fill in actual admin email and password before submission

### Media Assets
- [x] **PASS:** Screenshot automation script ready (scripts/generate-screenshots.ts, Phase 16-02)
- [x] **PASS:** Screenshot dimensions correct (1600x900px viewport in generate-screenshots.ts)
- [x] **PASS:** Playwright installed (playwright@^1.58.2 in package.json devDependencies)
- [ ] **TODO:** App icon created (1200x1200px PNG required)
  - **Action required:** Create app icon before submission (see Manual Steps below)
- [ ] **TODO:** Screenshots generated
  - **Action required:** Run `npm run screenshots` after populating demo data

---

## Manual Steps Required

### Before Submission

1. **Create App Icon (1200x1200px PNG)**
   - Design requirements: Bold colors, no text, represents pricing grid concept
   - Tools: Figma, Canva, or hire a designer
   - Save to: `.planning/app-store/icon.png`

2. **Generate Screenshots**
   - Prerequisites:
     - Install Playwright browsers: `npx playwright install chromium`
     - Start local dev server: `npm run dev`
     - Populate demo data: Create 2-3 matrices, 2-3 option groups, assign to products
   - Run: `npm run screenshots`
   - Verify output: `.planning/app-store/screenshots/` should contain 3 PNG files
   - Expected files:
     - `01-dashboard.png` (Dashboard overview with matrix/option group summary)
     - `02-matrices.png` (Matrix list page)
     - `03-option-groups.png` (Option groups management page)

3. **Fill in Test Credentials**
   - File: `.planning/app-store/demo-store.md`
   - Replace `[FILL_IN]` placeholders (lines 14-15) with actual credentials
   - Ensure test store is accessible: https://dynamic-pricing-demo.myshopify.com/admin
   - Verify app is installed and functional on test store

4. **Verify Test Store Data**
   - Log into dynamic-pricing-demo.myshopify.com
   - Confirm Price Matrix app is installed
   - Verify test data exists:
     - At least 2 price matrices with populated grids
     - At least 2 option groups with choices
     - Products assigned to matrices and option groups
     - API key accessible in Settings page

### Shopify Partner Dashboard Submission

5. **Navigate to Partner Dashboard**
   - URL: https://partners.shopify.com
   - Go to: Apps → Price Matrix → Distribution

6. **Start Submission**
   - Click "Manage submission" or "Submit app"
   - Run automated checks (fix any flagged issues)

7. **Upload Media Assets**
   - App icon: Upload `.planning/app-store/icon.png` (1200x1200px)
   - Screenshots: Upload all 3 PNG files from `.planning/app-store/screenshots/`
     - Must be 1600x900px
     - Minimum 3 screenshots required

8. **Enter App Listing Information**
   - Source file: `.planning/app-store/description.md`
   - App name: "Price Matrix" (30 chars max)
   - Introduction: Copy from description.md line 17 (68/100 chars)
   - Details: Copy from description.md lines 25-27 (492/500 chars)
   - Search terms: Copy 5 terms from description.md lines 48-52
   - Categories:
     - Primary: Product Customization
     - Secondary: Pricing & Merchandising

9. **Enter Test Credentials**
   - Source file: `.planning/app-store/demo-store.md` (with [FILL_IN] replaced)
   - Store URL: https://dynamic-pricing-demo.myshopify.com
   - Admin email: [from demo-store.md line 14]
   - Admin password: [from demo-store.md line 15]

10. **Additional Information**
    - Privacy policy URL: https://quote-flow-one.vercel.app/privacy
      - **Note:** Privacy policy page must be created and deployed before submission
    - Support email: robinkonijnendijk@gmail.com
      - **Note:** Consider using a dedicated support email (not containing "shopify")

11. **Submit for Review**
    - Review all entered information
    - Click "Submit for review"
    - Expected: Submission confirmation message
    - Review timeline: Typically 4-7 business days

---

## Pre-Submission Verification

### Automated Checks Status
- ✅ All 15 automated technical requirements passed
- ✅ All 8 automated app listing requirements passed
- ⚠️ 1 warning: Test credentials contain placeholders (manual action required)
- ❌ 2 manual tasks incomplete: App icon not created, screenshots not generated

### Readiness Assessment

**Technical foundation: COMPLETE**
- GDPR compliance implemented (Phase 15)
- Database optimization complete (Phase 16-01)
- Performance monitoring configured (Phase 16-01)
- GraphQL migration complete (Phase 15)

**App listing materials: READY**
- Description finalized with v1.2 features (Phase 16-02)
- Test credentials template complete (Phase 16-02)
- Screenshot automation ready (Phase 16-02)

**Remaining work: 3 manual tasks**
1. Create app icon (estimated time: 1-2 hours if using designer; 15 minutes if using templates)
2. Generate screenshots (estimated time: 10 minutes)
3. Fill in test credentials (estimated time: 2 minutes)

**Total estimated time to submission readiness: 1-3 hours**

---

## Success Criteria

- [x] All automated technical checks pass
- [x] All automated app listing checks pass
- [ ] App icon created (1200x1200px PNG)
- [ ] Screenshots generated (3+ files at 1600x900px)
- [ ] Test credentials filled in (no [FILL_IN] placeholders)
- [ ] App submitted to Shopify App Store for review

**Status:** Pre-submission verification complete. Ready for manual asset creation and submission.

---

## Next Steps

1. **Human action:** Create app icon (1200x1200px)
2. **Human action:** Generate screenshots with `npm run screenshots`
3. **Human action:** Fill in test credentials in demo-store.md
4. **Human action:** Submit app via Shopify Partner Dashboard following steps above

**Expected outcome:** App submitted for Shopify App Store review with 4-7 business day turnaround.

---

*Checklist generated by Phase 16 Plan 03 automated verification (Task 1)*
