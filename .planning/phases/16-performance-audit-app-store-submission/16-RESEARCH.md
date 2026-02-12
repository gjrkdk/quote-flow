# Phase 16: Performance Audit & App Store Submission - Research

**Researched:** 2026-02-12
**Domain:** Performance Testing, App Store Submission, Database Optimization
**Confidence:** HIGH

## Summary

Phase 16 prepares the QuoteFlow app for Shopify App Store submission by ensuring performance standards are met, database indexes are optimized, and all submission requirements are completed. This phase involves three primary domains: (1) Lighthouse performance auditing with automated CI/CD monitoring, (2) Shopify App Store submission process with listing requirements, and (3) PostgreSQL database index optimization for foreign keys.

The Shopify App Store has strict requirements: apps must not reduce Lighthouse performance scores by more than 10 points, must provide complete app listings with specific media assets (1200x1200px icon, 1600x900px screenshots), must include test credentials for reviewers, and must subscribe to compliance webhooks. Performance testing should use Lighthouse CI with GitHub Actions for automated monitoring. Database indexes on foreign key columns (`storeId`, `productId`, `optionGroupId`) improve both query performance and data modification operations.

**Primary recommendation:** Use Lighthouse CI with GitHub Actions for automated performance monitoring, create app listing assets before submission, add missing database indexes in a single migration, and submit through Partner Dashboard with a properly configured test store.

## Standard Stack

### Core Tools

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @lhci/cli | 0.15.x | Lighthouse CI automation | Official Google tool for CI/CD Lighthouse testing |
| Lighthouse | Latest (bundled) | Performance auditing | Shopify's required benchmark tool for app performance |
| Puppeteer / Playwright | Latest | Screenshot automation | Industry standard for browser automation and screenshot capture |
| Prisma | 5.8.0 (current) | Database migrations | Already in use; handles index creation via migrations |

### Supporting Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| pg_stat_statements | Query performance monitoring | Verify index usage and query optimization |
| EXPLAIN ANALYZE | Query plan analysis | Validate that indexes are being used correctly |
| Vercel CLI | Preview deployment testing | Test performance before production deployment |

### Installation

```bash
# Lighthouse CI for performance testing
npm install --save-dev @lhci/cli

# Screenshot automation (choose one)
npm install --save-dev puppeteer
# OR
npm install --save-dev playwright
```

## Architecture Patterns

### Recommended Project Structure

```
.planning/
├── app-store/               # App Store submission materials
│   ├── icon.png            # 1200x1200px app icon
│   ├── screenshots/        # 1600x900px screenshots (min 3)
│   ├── description.md      # App listing copy
│   └── demo-store.md       # Test credentials and setup instructions
├── performance/
│   └── lighthouse/         # Lighthouse CI configuration and reports
└── phases/16-*/            # Phase planning documents
.lighthouserc.js            # Lighthouse CI configuration
.github/
└── workflows/
    └── lighthouse-ci.yml   # Automated performance testing
```

### Pattern 1: Lighthouse CI Automation

**What:** Automated Lighthouse audits on every commit/PR to prevent performance regressions
**When to use:** For apps with Shopify App Store submission requirements

**Example:**

```javascript
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/app',
        'http://localhost:3000/app/matrices'
      ],
      numberOfRuns: 3, // Run multiple times to reduce variance
      startServerCommand: 'npm run start',
      settings: {
        preset: 'desktop'
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
```

```yaml
# .github/workflows/lighthouse-ci.yml
name: Lighthouse CI
on: [push, pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm install -g @lhci/cli@0.15.x
      - run: npm run build
      - run: lhci autorun
```

### Pattern 2: Database Index Migration

**What:** Add indexes to foreign key columns for improved query and deletion performance
**When to use:** When foreign keys exist without indexes, especially on high-traffic tables

**Example:**

```typescript
// prisma/schema.prisma
model PriceMatrix {
  id                String             @id @default(cuid())
  storeId           String             @map("store_id")
  // ... other fields
  store             Store              @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([storeId])  // Index on foreign key for performance
  @@map("price_matrices")
}

model ProductMatrix {
  id           Int                   @id @default(autoincrement())
  matrixId     String                @map("matrix_id")
  productId    String                @map("product_id")
  // ... other fields
  matrix       PriceMatrix           @relation(fields: [matrixId], references: [id], onDelete: Cascade)

  @@unique([productId])
  @@index([matrixId])    // Index on foreign key
  @@index([productId])   // Index for product lookups
  @@map("product_matrices")
}
```

```bash
# Create migration for new indexes
npx prisma migrate dev --name add_foreign_key_indexes
```

### Pattern 3: Shopify App Store Submission Process

**What:** Complete Partner Dashboard submission with all required materials
**When to use:** When app is ready for public distribution

**Process:**

1. **Pre-submission preparation:**
   - Create test/development store with app installed
   - Prepare test credentials document
   - Run Lighthouse audits to verify <10 point reduction
   - Create app icon (1200x1200px, PNG/JPEG, bold colors, no text)
   - Create 3-6 screenshots (1600x900px, clear, focused on functionality)
   - Write app description (100 char intro, 500 char details)
   - Prepare 2-3 minute screencast (optional but recommended)

2. **Partner Dashboard configuration:**
   - Navigate to Apps section → Select app → Distribution
   - Choose "Public distribution" → "Manage submission"
   - Complete automated checks (URLs, compliance webhooks, icon, contact email)
   - Ensure compliance webhooks are configured (GDPR endpoints)
   - Verify app icon is identical in Dev Dashboard and listing

3. **Create app listing:**
   - Set primary language
   - Upload icon, screenshots, feature media
   - Write compelling description and search terms (max 5)
   - Add privacy policy (required), support links (recommended)
   - Provide test store URL and credentials
   - Include setup instructions and expected test scenarios

4. **Submit for review:**
   - Run automated checks
   - Submit application
   - Review typically takes 4-7 business days
   - Full process (submission to publication): 2-4 weeks

### Pattern 4: Screenshot Automation with Playwright

**What:** Automated screenshot capture for app listing consistency and repeatability
**When to use:** When creating app store screenshots or documentation

**Example:**

```typescript
// scripts/generate-screenshots.ts
import { chromium } from 'playwright';

async function generateScreenshots() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 }
  });
  const page = await context.newPage();

  // Screenshot 1: Dashboard overview
  await page.goto('http://localhost:3000/app');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: '.planning/app-store/screenshots/01-dashboard.png'
  });

  // Screenshot 2: Matrix editor
  await page.goto('http://localhost:3000/app/matrices/new');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: '.planning/app-store/screenshots/02-matrix-editor.png'
  });

  // Screenshot 3: Option groups
  await page.goto('http://localhost:3000/app/option-groups');
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: '.planning/app-store/screenshots/03-option-groups.png'
  });

  await browser.close();
}

generateScreenshots();
```

### Anti-Patterns to Avoid

- **Manual performance testing only:** Shopify's 10-point rule requires consistent monitoring. Manual testing misses regressions between releases. Use CI/CD automation.
- **Missing indexes on foreign keys:** PostgreSQL does not auto-index foreign keys. Without indexes, DELETE operations on parent tables trigger full table scans on child tables.
- **Screenshot inconsistency:** Using different screen sizes, browsers, or manual crops creates unprofessional listings. Automate with fixed viewport sizes.
- **Submitting without test store:** Reviewers need working credentials. Apps submitted without proper test setup are rejected.
- **Including "Shopify" in URLs or emails:** Violates Partner Program Agreement. Automated checks will flag this.
- **Beta/incomplete submissions:** Delays approval. Only submit production-ready apps.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Performance monitoring | Custom Lighthouse scripts | @lhci/cli with GitHub Actions | Handles variance reduction (multiple runs), assertions, CI integration, and public report hosting |
| Screenshot capture | Manual screenshots | Playwright/Puppeteer automation | Ensures consistent dimensions (1600x900), repeatable process, and professional quality |
| Query performance analysis | Custom logging | PostgreSQL EXPLAIN ANALYZE + pg_stat_statements | Standard tools provide detailed execution plans, actual vs estimated rows, index usage stats |
| Database migrations | Raw SQL for indexes | Prisma Migrate | Type-safe schema definitions, automatic migration generation, rollback support |

**Key insight:** Performance testing and app store submission have well-established tooling and processes. Custom solutions miss edge cases (Lighthouse variance, screenshot sizing, index selection) that official tools handle automatically. Use standard tools unless they genuinely cannot meet requirements.

## Common Pitfalls

### Pitfall 1: Lighthouse Score Variance Not Accounted For

**What goes wrong:** Single Lighthouse run shows passing score, but subsequent runs fail submission
**Why it happens:** Lighthouse scores vary ±5 points between runs due to network conditions, CPU load, and browser state
**How to avoid:** Configure Lighthouse CI with `numberOfRuns: 3` minimum, use median or mean scores, test on CI environment (not just local), and establish baseline before making changes
**Warning signs:** Inconsistent scores between local runs, scores that differ significantly from PR to PR

### Pitfall 2: Missing Foreign Key Indexes Discovered During Load Testing

**What goes wrong:** App performs well in development but slows down under realistic data volumes or concurrent users
**Why it happens:** Small development datasets don't expose missing indexes. Foreign key constraints check for orphaned records on DELETE/UPDATE, requiring full table scans without indexes
**How to avoid:**
- Add indexes to ALL foreign key columns (`storeId`, `matrixId`, `productId`, `optionGroupId`)
- Use `EXPLAIN ANALYZE` to verify index usage
- Test with realistic data volumes (1000+ records per table)
- Monitor `pg_stat_user_indexes` to confirm index usage
**Warning signs:** Slow DELETE operations, sequential scans in EXPLAIN output, high pg_stat_all_tables.seq_scan counts

### Pitfall 3: App Icon/Screenshot Specification Mismatch

**What goes wrong:** Assets rejected during submission for wrong dimensions, format, or content
**Why it happens:** Requirements are specific but easy to overlook: 1200x1200px icon, 1600x900px screenshots, no Shopify trademarks, square corners (auto-rounded)
**How to avoid:**
- Use exact dimensions: icon 1200x1200, screenshots 1600x900
- PNG or JPEG format only
- No text in icon, no Shopify logos anywhere
- Crop out browser chrome and desktop backgrounds
- Leave padding in icon (logo shouldn't touch edges)
- Verify icon is identical in Dev Dashboard and listing
**Warning signs:** Automated checks fail, screenshots appear distorted in preview, icon has visible text

### Pitfall 4: Incomplete Test Credentials Documentation

**What goes wrong:** App submission delayed or rejected because reviewers cannot test functionality
**Why it happens:** Developers provide partial credentials (email without password, store URL without third-party API keys, unclear setup steps)
**How to avoid:**
- Document complete test credentials: store URL, admin email, admin password
- Include third-party integration credentials if applicable (payment gateways, external APIs)
- Write step-by-step test scenarios with expected outcomes
- Test credential access from incognito browser
- Include test data setup instructions (products to use, test scenarios to try)
- Keep credentials up-to-date (don't expire before review)
**Warning signs:** Unclear onboarding flow, complex setup requiring tribal knowledge, third-party dependencies not documented

### Pitfall 5: Compliance Webhooks Not Configured

**What goes wrong:** Automated checks fail before submission, blocking app from review
**Why it happens:** GDPR webhooks (customers/data_request, customers/redact, shop/redact) are mandatory for App Store distribution but optional for custom apps
**How to avoid:**
- Ensure webhooks are configured in `shopify.app.toml` or Partner Dashboard
- Verify webhook endpoints return 200 OK within 200ms
- Implement actual data deletion (not just logging)
- Test webhooks using Partner Dashboard webhook simulator
- Queue long-running operations (use JobQueue pattern from Phase 15)
**Warning signs:** Automated checks report missing webhooks, "Compliance Webhooks" section incomplete

## Code Examples

Verified patterns from official sources:

### Verifying Index Usage

```sql
-- Check if foreign key indexes are being used
EXPLAIN ANALYZE
SELECT * FROM price_matrices WHERE "store_id" = 'some-store-id';

-- Expected output should show "Index Scan" not "Seq Scan"
-- Example good output:
-- Index Scan using price_matrices_store_id_idx on price_matrices
-- (cost=0.29..8.30 rows=1 width=...)

-- Monitor index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Low idx_scan count indicates unused index
-- High seq_scan in pg_stat_user_tables indicates missing index
```

### Lighthouse CI Configuration for Remix/Vercel Apps

```javascript
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      // Test key admin pages
      url: [
        'http://localhost:3000/app',
        'http://localhost:3000/app/matrices',
        'http://localhost:3000/app/option-groups'
      ],
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      settings: {
        preset: 'desktop',
        // Shopify tests weighted: Home 17%, Product 40%, Collection 43%
        // For embedded admin apps, test main views similarly weighted
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Shopify requirement: no more than 10 point reduction
        // If baseline is 90, minimum should be 80 (0.8 score)
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }]
      }
    },
    upload: {
      target: 'temporary-public-storage',
      // Alternatively, use LHCI server for persistent storage
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN
    }
  }
};
```

### Index Creation Migration

```typescript
// prisma/migrations/XXX_add_foreign_key_indexes/migration.sql
-- CreateIndex
CREATE INDEX IF NOT EXISTS "price_matrices_store_id_idx" ON "price_matrices"("store_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_matrices_product_id_idx" ON "product_matrices"("product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "option_choices_option_group_id_idx" ON "option_choices"("option_group_id");

-- Note: matrixId and storeId indexes already exist from schema review
-- Only add missing indexes (productId in ProductMatrix, optionGroupId in OptionChoice)
```

### App Listing Description Template

```markdown
# QuoteFlow - Custom Dimension Pricing

## App Introduction (100 characters max)
Create custom pricing matrices based on product dimensions for made-to-order businesses.

## App Details (500 characters max)
QuoteFlow enables merchants to set up dynamic pricing based on custom dimensions (width, height) using spreadsheet-style price matrices. Perfect for businesses selling custom-sized products like prints, frames, or fabricated materials. Features include:

• Visual matrix editor for intuitive price management
• REST API for headless storefronts
• React widget for dimension input and live pricing
• Option groups with percentage/fixed modifiers
• CSV bulk import for large matrices
• Automatic Draft Order creation with locked pricing

## Search Terms (5 max)
- custom pricing
- dimension pricing
- matrix pricing
- made to order
- dynamic pricing

## Test Store Instructions
Store URL: [your-test-store].myshopify.com
Admin Email: test@example.com
Admin Password: [secure-password]

Setup Steps:
1. Install QuoteFlow from Apps section
2. Navigate to QuoteFlow → Matrices → Create Matrix
3. Create 3x3 matrix with sample breakpoints (Width: 10, 20, 30; Height: 10, 20, 30)
4. Assign matrix to product "Test Print" (ID: gid://shopify/Product/123)
5. View product in storefront to see widget

Test Scenarios:
- Select dimensions 15x15 → Price should round up to 20x20 cell
- Select option "Matte Finish (+$10)" → Price should add $10 to base
- Submit quote → Draft Order should appear in Orders section with custom line item
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual Lighthouse testing | Lighthouse CI with GitHub Actions | 2020+ | Automated regression prevention, consistent CI environment, reduced variance |
| Puppeteer-only automation | Playwright for cross-browser testing | 2024+ | Multi-browser support (Chrome, Firefox, Safari), better debugging, CI-optimized |
| REST API migration approach | GraphQL-first for Shopify Admin | 2024+ (Phase 15) | Required for App Store; REST deprecated for many operations |
| Manual index creation | Prisma schema-driven migrations | Current | Type-safe schema, automatic migration SQL generation |
| Floating-point price calculations | Integer (cents) arithmetic | Phase 11 | Eliminates rounding errors in price modifiers |

**Deprecated/outdated:**
- **Lighthouse CLI without CI wrapper:** Use @lhci/cli instead for automated testing, variance reduction, and assertion support
- **REST API for draft orders:** Shopify requires GraphQL `draftOrderCreate` mutation (migrated in Phase 15)
- **Manual GDPR webhook handling:** Must use async job queue pattern to respond within 200ms (implemented in Phase 15)
- **Apps without compliance webhooks:** Mandatory for App Store distribution since 2023

## Current Schema Index Status

Based on schema review (`prisma/schema.prisma`), existing indexes:

**Already indexed:**
- ✅ `GdprRequest.shop` - @@index([shop])
- ✅ `GdprRequest.type` - @@index([type])
- ✅ `JobQueue.status, scheduledAt` - @@index([status, scheduledAt])
- ✅ `PriceMatrix.storeId` - @@index([storeId])
- ✅ `ProductMatrix.matrixId` - @@index([matrixId])
- ✅ `DraftOrderRecord.storeId` - @@index([storeId])
- ✅ `DraftOrderRecord.matrixId` - @@index([matrixId])
- ✅ `DraftOrderRecord.shopifyDraftOrderId` - @@index([shopifyDraftOrderId])
- ✅ `OptionGroup.storeId` - @@index([storeId])
- ✅ `OptionChoice.optionGroupId` - @@index([optionGroupId])
- ✅ `ProductOptionGroup.productId` - @@index([productId])
- ✅ `ProductOptionGroup.optionGroupId` - @@index([optionGroupId])

**Missing (need to add):**
- ❌ `ProductMatrix.productId` - Used for product lookups (has unique constraint but no separate index for performance)

**Note:** The `productId` field in `ProductMatrix` has a `@@unique([productId])` constraint, which creates a unique index automatically in PostgreSQL. However, Success Criterion mentions "proper indexes on foreign keys (storeId, productId, optionGroupId)" - this may be satisfied by the unique constraint index, or may require explicit verification.

## Shopify App Store Requirements Checklist

### Technical Requirements
- [ ] App does not reduce Lighthouse performance scores by more than 10 points
- [ ] Performance tested on weighted pages (for embedded apps: primary admin views)
- [ ] Compliance webhooks configured (customers/data_request, customers/redact, shop/redact)
- [ ] OAuth flow follows Shopify standards (no deviations)
- [ ] Billing via Shopify Billing API (if monetized)
- [ ] No APIs deprecating within 90 days

### App Listing Requirements
- [ ] App icon: 1200x1200px, PNG/JPEG, bold colors, simple pattern, no text
- [ ] Icon identical in Dev Dashboard and app listing
- [ ] 3-6 screenshots: 1600x900px, clear, focused on functionality
- [ ] No Shopify trademarks in icon, banner, or screenshots
- [ ] No pricing info in images
- [ ] App name: unique, starts with brand name, max 30 characters
- [ ] App introduction: 100 characters, highlights merchant benefits
- [ ] App details: 500 characters, describes functionality
- [ ] 5 search terms (complete words only)
- [ ] Privacy policy (required)
- [ ] Support links (recommended)

### Test Credentials
- [ ] Development/test store URL provided
- [ ] Admin credentials (email + password)
- [ ] Third-party integration credentials (if applicable)
- [ ] Step-by-step setup instructions
- [ ] Test scenarios with expected outcomes
- [ ] Screencast: 2-3 minutes, English or subtitled (optional but recommended)

### Submission Process
- [ ] Automated checks passed (URLs, webhooks, icon, contact)
- [ ] App name matches between Dev Dashboard and submission form
- [ ] No "Shopify" in application URLs or contact emails
- [ ] Primary language specified
- [ ] Emergency developer contact information current

## Open Questions

1. **Baseline Lighthouse Score Unknown**
   - What we know: Shopify requires <10 point reduction; current score not established
   - What's unclear: Current performance baseline for the app's admin pages
   - Recommendation: Run initial Lighthouse CI audit on main pages to establish baseline before any optimization; target maintaining 80+ performance score

2. **App Icon and Screenshots Not Created**
   - What we know: Dimensions are 1200x1200 (icon) and 1600x900 (screenshots); need 3-6 screenshots
   - What's unclear: Design direction, whether to hire designer or use automation
   - Recommendation: Use Playwright automation for screenshots (ensures consistency); create simple icon with bold colors representing matrix/grid concept; consider design tools like Figma or Canva for icon if budget allows

3. **Test Store Data Setup**
   - What we know: Need working demo store with test data
   - What's unclear: Optimal test data setup (how many matrices, products, option groups)
   - Recommendation: Create representative test data: 2-3 matrices with different dimensions, 5-10 products with varying option groups, complete onboarding flow; document exact setup steps for reproducibility

4. **Review Timeline Impact on Milestone**
   - What we know: Initial review takes 4-7 business days; full process 2-4 weeks
   - What's unclear: Whether "submission" completes Phase 16 or if "approval" is required
   - Recommendation: Success Criterion 4 states "App submitted to Shopify App Store for review" (not "approved"), so phase completes at submission, not approval

## Sources

### Primary (HIGH confidence)
- [Shopify App Store Requirements Checklist](https://shopify.dev/docs/apps/launch/app-requirements-checklist) - Complete submission requirements
- [Shopify App Store Requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements) - App listing specifications
- [Submit Your App for Review](https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review) - Submission process
- [Shopify Storefront Performance](https://shopify.dev/docs/apps/build/performance/storefront) - 10-point Lighthouse requirement
- [Lighthouse CI GitHub Repository](https://github.com/GoogleChrome/lighthouse-ci) - Official Lighthouse CI setup and configuration
- [PostgreSQL Foreign Key Indexing](https://www.cybertec-postgresql.com/en/index-your-foreign-key/) - Foreign key index best practices
- [Prisma Index Documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes) - Schema-level index configuration
- [PostgreSQL EXPLAIN Documentation](https://www.postgresql.org/docs/current/using-explain.html) - Query plan analysis

### Secondary (MEDIUM confidence)
- [Gadget.dev: Pass Shopify App Store Review Part 1](https://gadget.dev/blog/how-to-pass-the-shopify-app-store-review-the-first-time-part-1-the-technical-bit) - Technical requirements and common issues
- [Gadget.dev: Pass Shopify App Store Review Part 2](https://gadget.dev/blog/how-to-pass-the-shopify-app-store-review-the-first-time-part-2-the-app-listing) - App listing best practices
- [Playwright vs Puppeteer 2026 (BrowserStack)](https://www.browserstack.com/guide/playwright-vs-puppeteer) - Screenshot automation comparison
- [Neon Performance Tips](https://neon.com/blog/performance-tips-for-neon-postgres) - PostgreSQL performance on Neon platform
- [Remix Vite Code Splitting](https://v2.remix.run/docs/guides/vite/) - Remix performance optimization

### Tertiary (LOW confidence)
- [Core Web Vitals 2026 Strategy](https://nitropack.io/blog/core-web-vitals-strategy/) - General performance trends (not Shopify-specific)
- [App Store Screenshot Generators](https://theapplaunchpad.com/blog/top-7-app-store-screenshot-generators-in-2026) - Commercial tools overview

## Metadata

**Confidence breakdown:**
- Shopify App Store requirements: HIGH - Official Shopify documentation, verified with multiple sources
- Lighthouse CI setup: HIGH - Official Google repository with clear examples
- Database indexing: HIGH - PostgreSQL official documentation + Prisma documentation + performance articles
- Screenshot automation: MEDIUM - Multiple sources agree on Playwright/Puppeteer but no Shopify-specific guidance
- Performance optimization: MEDIUM - General web performance principles, not Remix-specific for some areas

**Research date:** 2026-02-12
**Valid until:** 2026-03-14 (30 days - stable domain with established tools and processes)
