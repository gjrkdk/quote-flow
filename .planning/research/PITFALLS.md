# Domain Pitfalls

**Domain:** Public Shopify App (Draft Orders + REST API + Vercel Deployment)
**Researched:** 2026-02-03
**Confidence:** HIGH (verified with official Shopify docs and multiple sources)

---

## Critical Pitfalls

Mistakes that cause rewrites, app store rejection, or major security/compliance issues.

### Pitfall 1: Theme Code Not Removed on Uninstall

**What goes wrong:** Apps that inject code into merchant themes (Liquid snippets, script tags) leave "ghost code" after uninstallation. Scripts try loading when files no longer exist, slowing down sites and breaking functionality.

**Why it happens:** Developers use legacy Script Tag API or direct theme modifications instead of Theme App Extensions. Uninstall webhooks aren't sufficient to clean theme files.

**Consequences:**
- Automatic app store rejection
- Merchant complaints about broken themes
- Poor reviews citing performance degradation
- Manual cleanup burden on merchants

**Prevention:**
- Use Theme App Extensions (App Blocks/App Embeds) instead of Script Tags
- Theme App Extensions are automatically removed by Shopify on uninstall
- For headless React widgets: Ship as npm package, not theme injection
- Never write directly to theme Liquid files

**Detection:**
- App store review tests uninstall process
- Monitor for support tickets mentioning "leftover code" or "scripts not loading"

**Phase mapping:** Must be in App Foundation/Embedded UI phase. Don't defer to later.

**Sources:**
- [How to pass Shopify app store review (Gadget)](https://gadget.dev/blog/how-to-pass-the-shopify-app-store-review-the-first-time-part-1-the-technical-bit)
- [Common app rejections](https://shopify.dev/docs/apps/store/review/common-rejections)
- [About Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)

---

### Pitfall 2: Third-Party Cookies for Embedded App Sessions

**What goes wrong:** Embedded apps that use third-party cookies for session management fail in Safari, Firefox, and Chrome Incognito. Users get stuck in redirect loops or can't authenticate.

**Why it happens:** Browsers block third-party cookies by default. Developers assume traditional cookie-based sessions will work in iframes.

**Consequences:**
- App store rejection (mandatory check since late 2025)
- App completely broken for 30%+ of merchants
- "Built for Shopify" badge denied
- Cannot function as embedded app

**Prevention:**
- Use Shopify session tokens (JWT) with App Bridge
- Session tokens are short-lived (1 minute) and signed by shared secret
- Use `authenticatedFetch` from App Bridge (handles tokens automatically)
- For server-side: Verify session token signature, extract shop info
- Never store session in cookies for embedded context

**Detection:**
- Test in Safari and Firefox immediately
- Check Network tab for blocked cookies
- App store review runs automated embedded app checks

**Phase mapping:** Must be in Authentication phase. Breaks entire app if wrong.

**Sources:**
- [About session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens)
- [Set up session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens/set-up-session-tokens)
- [Session token authentication issue](https://community.shopify.com/t/session-token-authentication-issue-for-built-for-shopify-badge/416552)

---

### Pitfall 3: Missing GDPR Compliance Webhooks

**What goes wrong:** Public apps without GDPR webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) are automatically rejected at app store review.

**Why it happens:** Developers focus on functional features first, assume compliance can be added later. GDPR webhooks are mandatory but not enforced during development.

**Consequences:**
- Instant app store rejection
- Cannot list app publicly
- 30-day deadline to fulfill data requests (legal requirement)
- Potential GDPR violations if merchant requests data deletion

**Prevention:**
- Register all three webhooks before app submission:
  - `customers/data_request` - Log request, return customer data within 30 days
  - `customers/redact` - Delete customer data from your database
  - `shop/redact` - Delete all shop data 48 hours after uninstall
- Respond with 200 status code immediately (process async)
- Implement actual data deletion logic (not just stub endpoints)
- Test with Shopify's webhook testing tool

**Detection:**
- App store review checks for webhook registration
- Check Partner Dashboard → App → Configuration → Webhooks
- Missing URLs = automatic rejection

**Phase mapping:** Add in Data Model phase when Prisma schema is defined. Need to know what data to delete.

**Sources:**
- [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [How to configure GDPR webhooks](https://medium.com/@muhammadehsanullah123/how-to-configure-gdpr-compliance-webhooks-in-shopify-public-apps-b2107721a58f)
- [GDPR webhook setup guide](https://community.shopify.com/t/how-to-configure-and-test-gdpr-mandatory-webhooks/105168)

---

### Pitfall 4: Prisma Connection Exhaustion on Vercel

**What goes wrong:** Each Vercel serverless function invocation opens new database connections. Database quickly hits connection limit (Postgres default: 100), causing "too many connections" errors and app downtime.

**Why it happens:** Serverless functions don't maintain persistent connections. Prisma creates connection pools per invocation. Cold starts multiply the problem.

**Consequences:**
- Production app crashes under moderate load
- Database refuses new connections
- Merchants unable to create orders
- Emergency migration to different architecture

**Prevention:**
- **Option 1 (Recommended):** Use Prisma Accelerate (managed connection pooler)
- **Option 2:** Use Vercel Fluid Compute with `attachDatabasePool`
- **Option 3:** Use Prisma Postgres (built-in pooling, serverless optimized)
- **Option 4:** Use PgBouncer or Supabase pooler in front of database
- Set small connection pool size in Prisma (e.g., `connection_limit=1`)
- Use serverless-friendly DB like Neon, PlanetScale, Supabase

**Detection:**
- Load test with 50+ concurrent requests
- Monitor database connection count
- Watch for "remaining connection slots reserved" errors
- Check CloudWatch/Vercel logs for connection errors

**Phase mapping:** Must be decided in Infrastructure Setup phase. Cannot retrofit easily.

**Sources:**
- [Deploy to Vercel (Prisma)](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)
- [Connection pooling with Vercel Functions](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Prisma connection pooling discussion](https://github.com/prisma/prisma/discussions/24497)

---

### Pitfall 5: Draft Orders API Rate Limits Not Handled

**What goes wrong:** Apps hit Draft Orders rate limit (5 per minute on dev/trial stores, 2 requests/sec on production) without backoff logic. Requests fail with 429 errors, merchants can't create orders.

**Why it happens:** Developers test with low volume, don't implement retry logic. Rate limits are much stricter on development stores.

**Consequences:**
- App unusable for merchants with bulk pricing updates
- Data loss when Draft Order creation silently fails
- Negative reviews citing "doesn't work"
- Cannot handle multiple customers simultaneously

**Prevention:**
- Implement exponential backoff with jitter for 429 responses
- Check `Retry-After` header and wait specified seconds
- Queue Draft Order requests (e.g., BullMQ, Vercel Queue)
- Show loading states, don't make merchants wait synchronously
- Test with production-level volume (50+ draft orders)
- Consider Bulk Operations API for large batches

**Detection:**
- Check response headers for `X-Shopify-Shop-Api-Call-Limit`
- Monitor 429 error rates in production logs
- Load test: Create 10 draft orders simultaneously

**Phase mapping:** Add in Draft Orders API Integration phase. Don't wait for production.

**Sources:**
- [Shopify API rate limits](https://shopify.dev/docs/api/usage/limits)
- [REST Admin API rate limits](https://shopify.dev/docs/api/admin-rest/usage/rate-limits)
- [4 strategies for rate limits](https://kirillplatonov.com/posts/shopify-api-rate-limits/)

---

### Pitfall 6: REST API Without HMAC Verification

**What goes wrong:** Your public REST API for headless storefronts has API key authentication but no request signature verification. Attackers replay captured requests, modify prices, or flood your API.

**Why it happens:** Developers implement simple API key auth (bearer tokens) without understanding replay attack vectors. HMAC signatures seem like overkill for "internal" API.

**Consequences:**
- Price manipulation (attacker modifies request body)
- Replay attacks (reuse captured requests)
- API key leaks = full compromise
- Cannot detect tampered requests
- Fail PCI/SOC2 audits

**Prevention:**
- Use HMAC-SHA256 request signing (Shopify-style):
  - Client: `HMAC(secret, timestamp + method + path + body)` → signature in header
  - Server: Recompute signature, compare with header
  - Reject if timestamp > 5 minutes old (prevent replay)
- Store API keys hashed (bcrypt/argon2), not plaintext
- Rotate keys regularly, support multiple active keys
- Rate limit per API key (prevent brute force)
- Use HTTPS only (enforce in middleware)
- Log all API requests for audit trail

**Detection:**
- Security audit flags "no request signing"
- Pen test shows replay attack vulnerability
- Try replaying captured request 10 minutes later (should fail)

**Phase mapping:** Must be in REST API phase. Retrofitting auth is painful.

**Sources:**
- [REST API security best practices (2026)](https://www.levo.ai/resources/blogs/rest-api-security-best-practices)
- [Shopify app security practices](https://shinedezigninfonet.com/blog/shopify-app-security-ensuring-safe-customer-experience/)
- [Best Shopify API security practices](https://ecomxagency.com/blogs/shopify/shopify-rest-api)

---

### Pitfall 7: Using Shopify Billing API Wrong (or Not At All)

**What goes wrong:** App uses Stripe/PayPal for subscription charges instead of Shopify Billing API. App store rejects it, or charges fail because merchants don't have payment method on file.

**Why it happens:** Developers assume they can use their own payment processing. Shopify Billing API seems more restrictive than familiar payment gateways.

**Consequences:**
- App store rejection (Billing API is mandatory)
- Cannot charge merchants through Shopify admin
- No automatic billing integration
- Higher churn (separate payment flow)
- Violates Shopify terms of service

**Prevention:**
- All app charges MUST use Shopify Billing API (RecurringApplicationCharge, UsageCharge)
- Only exception: Cost of goods sold (physical products) can use external PCI-compliant gateway
- Use AppSubscriptionCreate mutation (GraphQL) or RecurringApplicationCharge (REST, legacy)
- Test return URL flow (merchant approves charge → redirect back to app)
- Handle declined charges gracefully
- Don't ask for credit card in your app UI

**Detection:**
- App store review checks for Billing API usage
- Search code for "stripe", "paypal" in subscription context
- Verify all charges show in Shopify admin billing

**Phase mapping:** Add in Subscription Management phase. Required for paid app.

**Sources:**
- [About billing for your app](https://shopify.dev/docs/apps/launch/billing)
- [App Store requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Billing API mandatory discussion](https://community.shopify.com/t/using-shopify-billing-api-mandatory-for-apps-on-app-store/257393)

---

### Pitfall 8: Draft Orders Inventory Confusion

**What goes wrong:** Developers expect creating a Draft Order to reduce inventory. It doesn't. Inventory only adjusts when draft order converts to real order, causing overselling or inventory sync issues.

**Why it happens:** Draft Order API name implies it's a "real order" that should affect inventory. Documentation is easy to miss.

**Consequences:**
- Inventory overselling (merchant thinks stock is reserved)
- Inventory sync errors with ERP systems
- Customer complaints about out-of-stock items
- Manual inventory adjustments required

**Prevention:**
- Understand: Draft Orders DO NOT affect inventory until completed
- Use `reserve_inventory_until` field to reserve stock (but only from default location)
- Warning: "Currently draft orders cannot have a location set via GraphQL" (uses default location only)
- Implement inventory checks BEFORE creating Draft Order
- Show accurate "available" inventory in UI (query InventoryLevel)
- Document this behavior for merchants

**Detection:**
- Create draft order → Check inventory count (should be unchanged)
- Complete draft order → Check again (now reduced)
- Test with multi-location setup (reveals location limitation)

**Phase mapping:** Must understand in Draft Orders Integration phase. Core feature behavior.

**Sources:**
- [DraftOrder REST API](https://shopify.dev/docs/api/admin-rest/latest/resources/draftorder)
- [Draft Orders API limitations](https://community.shopify.dev/t/draft-orders-api-limitations/19710)
- [Mastering Draft Orders API](https://www.hulkapps.com/blogs/shopify-hub/mastering-shopifys-api-for-draft-orders-a-comprehensive-guide)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or poor merchant experience.

### Pitfall 9: Webhook Delivery Assumptions

**What goes wrong:** Developers rely solely on webhooks for data sync. Webhooks occasionally fail to deliver (network issues, service downtime), causing data inconsistencies.

**Why it happens:** Webhook documentation makes delivery seem guaranteed. Shopify retries for 4 hours but then gives up.

**Consequences:**
- Missing orders/products in app database
- Out-of-sync price matrices
- Merchants report "app doesn't show my products"
- Manual data fixes required

**Prevention:**
- Webhooks are "best effort", not guaranteed
- Implement reconciliation jobs (background tasks that poll API):
  - Every 15 minutes: Fetch products/orders with `updated_at > last_sync_time`
  - Use GraphQL `updatedAt` filter for efficiency
- Make webhook handlers idempotent (safe to process twice)
- Log webhook deliveries, alert on missing sequences
- Use Amazon EventBridge or Google Pub/Sub for high-volume apps
- Respond to webhooks within 5 seconds (defer processing)

**Detection:**
- Turn off app server for 5 hours → Check for missed data
- Compare webhook log count vs actual Shopify changes
- Monitor webhook subscription status (deleted after repeated failures)

**Phase mapping:** Add reconciliation in Webhook System phase. Don't wait for bugs.

**Sources:**
- [Webhook best practices](https://shopify.dev/docs/apps/build/webhooks/best-practices)
- [Shopify webhooks reliability guide (Hookdeck)](https://hookdeck.com/webhooks/platforms/shopify-webhooks-best-practices-revised-and-extended)
- [Troubleshooting webhooks](https://shopify.dev/docs/apps/build/webhooks/troubleshooting-webhooks)

---

### Pitfall 10: API Version Drift

**What goes wrong:** App ships using GraphQL API version `2024-10`. Shopify releases `2026-01` with breaking changes. Nine months later, `2024-10` is deprecated and app breaks in production.

**Why it happens:** Developers hard-code API version and never update. No monitoring for deprecation warnings.

**Consequences:**
- Production app breaks without warning
- Emergency migration under time pressure
- Breaking changes require code rewrites
- Merchant downtime and churn

**Prevention:**
- Stable API versions supported for 12 months (9-month overlap)
- Update to latest stable version every quarter
- Monitor `X-Shopify-API-Deprecated-Reason` response header
- Use Partner Dashboard "API Health" report (shows deprecated endpoints)
- Set calendar reminder to check for new versions
- Test against unstable API versions before they stabilize
- Important 2026 deadlines:
  - Custom apps in admin disabled Jan 1, 2026
  - Shopify Scripts end-of-life June 30, 2026
  - Idempotency mandatory for mutations April 2026

**Detection:**
- Check current API version in code
- Compare against latest stable (currently 2026-01)
- Look for deprecation warnings in Vercel logs

**Phase mapping:** Set up monitoring in Infrastructure phase. Schedule quarterly updates.

**Sources:**
- [About API versioning](https://shopify.dev/docs/api/usage/versioning)
- [2025-01 release notes](https://shopify.dev/docs/api/release-notes/2025-01)
- [API deprecations at Shopify](https://www.shopify.com/partners/blog/api-deprecation)

---

### Pitfall 11: Over-Requesting Access Scopes

**What goes wrong:** App requests `read_products`, `write_products`, `read_customers`, `write_customers`, `read_orders`, `write_orders` because "we might need them later". Merchants see scary permission list and don't install.

**Why it happens:** Developers request all potentially useful scopes upfront. Not aware of optional scopes or scope review process.

**Consequences:**
- Lower install conversion rate
- App store review may question excessive scopes
- Higher security risk if API token leaks
- Shopify restricts scopes without legitimate use case

**Prevention:**
- Follow least privilege principle: Only request scopes you need NOW
- For Draft Orders app with custom pricing:
  - Required: `read_products`, `write_draft_orders`, `read_price_rules` (if using)
  - Not needed: `write_customers`, `write_inventory`, `write_orders`
- Use optional scopes for features that aren't core
- Document why each scope is needed (for app review)
- Request additional scopes dynamically when merchant enables feature
- Review scopes before each app submission

**Detection:**
- List scopes in `shopify.app.toml`
- Ask: "What breaks if we remove this scope?"
- Compare against competitor apps (Partner Dashboard → App Store)

**Phase mapping:** Define in App Setup phase. Audit before each submission.

**Sources:**
- [Shopify API access scopes](https://shopify.dev/docs/api/usage/access-scopes)
- [Manage access scopes](https://shopify.dev/docs/apps/build/authentication-authorization/app-installation/manage-access-scopes)
- [Best Shopify app security practices](https://shinedezigninfonet.com/blog/shopify-app-security-ensuring-safe-customer-experience/)

---

### Pitfall 12: Remix Template Not Updated for React Router

**What goes wrong:** Developer uses `shopify app init` and gets Remix template. Builds entire app on Remix. Shopify announces "use React Router instead" in late 2025.

**Why it happens:** Shopify CLI still generates Remix templates. Developers don't check recent announcements.

**Consequences:**
- Building on deprecated framework
- Will need to migrate to React Router eventually
- Community support shifts to React Router
- Examples and tutorials diverge

**Prevention:**
- **Important:** Shopify now recommends React Router for new apps (not Remix)
- Check template before starting: `npm create @shopify/app@latest`
- Follow Shopify's latest app templates documentation
- Monitor Shopify changelog for framework recommendations
- If using Remix:
  - Be aware it's not the recommended path
  - Plan for eventual React Router migration
  - Use stable patterns (less refactoring later)

**Detection:**
- Check `package.json` for `@remix-run/*` dependencies
- Review Shopify's current app template recommendations
- Ask in Shopify dev Discord/forums about current stack

**Phase mapping:** Decide in Project Setup phase (before writing code).

**Sources:**
- [Shopify Remix template GitHub](https://github.com/Shopify/shopify-app-template-remix)
- [Unable to install Remix app discussion](https://community.shopify.com/t/unable-to-install-new-remix-app-on-production-stores-you-dont-have-this-app-installed/389199)
- [@shopify/shopify-app-remix npm](https://www.npmjs.com/package/@shopify/shopify-app-remix)

---

### Pitfall 13: Not Testing Production OAuth Flow

**What goes wrong:** App works perfectly in development. Deploy to production, change app URL, OAuth redirect fails. Merchants get "redirect_uri mismatch" errors during installation.

**Why it happens:** OAuth redirect URLs are environment-specific. Developers test installation once in dev, assume production works the same.

**Consequences:**
- Nobody can install production app
- Launch day emergency
- Manual redirect URL configuration needed
- App store reviewers can't install app (automatic rejection)

**Prevention:**
- Update redirect URLs when deploying to production:
  - Partner Dashboard → App Settings → URLs
  - Set "App URL" to production domain (e.g., `https://pricing-app.vercel.app`)
  - Set "Allowed redirection URL(s)" to callback URL (e.g., `https://pricing-app.vercel.app/api/auth/callback`)
- Test full OAuth flow on production URL:
  - Uninstall app from test store
  - Click "Add app" from App Store
  - Verify redirect works, access token obtained
- Use environment variables for URLs (`.env.production`)
- Don't hard-code `localhost` or dev URLs

**Detection:**
- Deploy to production → Try installing from fresh store
- Check browser network tab for redirect chain
- Verify callback URL matches Partner Dashboard settings

**Phase mapping:** Test in Deployment phase, before app submission.

**Sources:**
- [Common rejections - OAuth flow](https://shopify.dev/docs/apps/store/review/common-rejections)
- [Shopify app deployment issues](https://community.shopify.com/t/shopify-app-deployment-issues/292056)

---

### Pitfall 14: npm Package Without Proper Security Audit

**What goes wrong:** You publish React widget as npm package. Package includes dev dependencies with known vulnerabilities. Supply chain attack surfaces in merchant storefronts.

**Why it happens:** Developers run `npm publish` without security review. Don't understand difference between dependencies and devDependencies in published packages.

**Consequences:**
- Vulnerabilities exposed to all widget users
- CVE-2025-55182 (React RCE) affects your package
- Merchant storefronts compromised
- Package unpublished by npm (breaks all installations)

**Prevention:**
- Run `npm audit --production` before publishing (checks prod dependencies only)
- Fix all high/critical vulnerabilities
- Recent critical: CVE-2025-55182 (React 19.0-19.2.0) - RCE vulnerability
  - Update React to 19.0.1, 19.1.2, or 19.2.1+
- Keep React and React-DOM updated
- Use `.npmignore` to exclude dev files from package
- Set `"files": ["dist"]` in `package.json` (only ship built files)
- Monitor Snyk/GitHub alerts for dependency vulnerabilities
- Consider using `npm provenance` for supply chain security

**Detection:**
- Run `npm audit --production` in CI pipeline
- Check Snyk dashboard for published package
- Download published package: `npm pack` → inspect contents

**Phase mapping:** Add to Widget Development phase CI/CD pipeline.

**Sources:**
- [Critical React vulnerability CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [React npm vulnerabilities (Snyk)](https://security.snyk.io/package/npm/react)
- [npm audit documentation](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities/)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable. Still worth avoiding.

### Pitfall 15: Polaris Accessibility Violations

**What goes wrong:** App UI fails WCAG 2.1 AA standards. Low color contrast, missing keyboard navigation, no ARIA labels. App store review flags accessibility issues.

**Why it happens:** Developers use Polaris components incorrectly or build custom UI without accessibility considerations.

**Consequences:**
- App store review delay
- Inaccessible to users with disabilities
- Legal risk (ADA compliance)
- Poor merchant experience

**Prevention:**
- Use Polaris components correctly (built-in WCAG compliance)
- Required accessibility features:
  - Color contrast ratios (4.5:1 for text, 3:1 for UI)
  - Full keyboard navigation (tab order, focus indicators)
  - Screen reader support (semantic HTML, ARIA labels)
  - Form labels and error messages
- Test with keyboard only (no mouse)
- Run axe DevTools browser extension
- Check Polaris component docs for accessibility guidance

**Detection:**
- Browser DevTools → Lighthouse → Accessibility score (target: 90+)
- Use screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
- Tab through entire UI, verify focus is visible

**Phase mapping:** Include in UI Development phase. Cheaper to build right than fix later.

**Sources:**
- [Polaris accessibility foundation](https://polaris-react.shopify.com/foundations/accessibility)
- [Shopify Polaris accessibility wins](https://a11ywins.tumblr.com/post/159988043603/shopify-polaris-design-system)
- [App design guidelines](https://shopify.dev/docs/apps/design)

---

### Pitfall 16: Draft Orders Purged After One Year

**What goes wrong:** App relies on Draft Orders for audit trail or pricing history. Shopify automatically deletes draft orders created after April 1, 2025 that are inactive for one year. Historical data disappears.

**Why it happens:** Developers don't read API change logs. Assume draft orders persist forever.

**Consequences:**
- Lost audit trail for custom pricing
- Cannot reconstruct pricing history
- Compliance issues if retention required
- Merchant complaints about missing data

**Prevention:**
- Draft orders created ≥ April 1, 2025 are purged after 1 year inactivity
- Store pricing history in YOUR database (Prisma models), not just in Shopify
- When creating Draft Order, save:
  - Product IDs, SKUs
  - Custom prices applied
  - Price matrix used
  - Timestamp
- Treat Draft Orders as transient (will eventually be deleted or completed)
- Document data retention policy for merchants

**Detection:**
- Check Draft Order creation dates
- Verify you have backup data in your database
- Test: Can you recreate pricing history without Draft Order data?

**Phase mapping:** Design data model in Database Schema phase to handle this.

**Sources:**
- [DraftOrder REST API](https://shopify.dev/docs/api/admin-rest/latest/resources/draftorder)
- [Draft Orders limitations discussion](https://community.shopify.dev/t/draft-orders-api-limitations/19710)

---

### Pitfall 17: Hard-Coded Shopify Domain

**What goes wrong:** Code contains hard-coded `myshopify.com` domain checks. Custom domain stores fail authentication or webhooks.

**Why it happens:** Examples show `shop.myshopify.com` format. Developers forget merchants can use custom domains.

**Consequences:**
- App breaks for custom domain stores
- Webhook verification fails
- OAuth redirect issues
- Support tickets from subset of merchants

**Prevention:**
- Never check if shop ends with `.myshopify.com`
- Use Shopify-provided shop domain from session/webhook
- Webhook signature verification uses shop from webhook (not hard-coded domain)
- OAuth flow: Use shop parameter from query string
- Store shop domain in database exactly as Shopify provides it

**Detection:**
- Search code for `myshopify.com` string checks
- Test with custom domain store (ask merchant or use test store with custom domain)

**Phase mapping:** Avoid in Authentication phase when writing OAuth/webhook code.

---

### Pitfall 18: Not Handling Async Draft Order Creation

**What goes wrong:** Create Draft Order, immediately query it. Get 404 error because Shopify is still calculating shipping/taxes asynchronously.

**Why it happens:** Draft Order endpoint returns `202 Accepted` (not `200 OK`) when calculations are pending. Developers don't check status code.

**Consequences:**
- Intermittent "Draft Order not found" errors
- Race conditions in order flow
- Poor user experience (order appears then disappears)

**Prevention:**
- Check response status code:
  - `200 OK` → Draft Order ready
  - `202 Accepted` → Still processing, poll later
- If `202`, use `Location` header and `Retry-After` header:
  - Wait `Retry-After` seconds (typically 1-2 seconds)
  - GET the `Location` URL
  - Repeat until `200 OK`
- Show loading state to user during polling
- Set max retry limit (e.g., 10 attempts)

**Detection:**
- Create Draft Order with complex shipping → Check status code
- Create Draft Order with tax calculation → Watch for `202`
- Load test: Create many draft orders quickly (increases async probability)

**Phase mapping:** Handle in Draft Orders Integration phase when writing API calls.

**Sources:**
- [DraftOrder REST API - asynchronous processing note](https://shopify.dev/docs/api/admin-rest/latest/resources/draftorder)

---

### Pitfall 19: Vercel Environment Variables Not Set

**What goes wrong:** Deploy to Vercel, app crashes with "SHOPIFY_API_KEY is not defined". Works locally but not in production.

**Why it happens:** `.env` file is local only (gitignored). Developers forget to configure environment variables in Vercel dashboard.

**Consequences:**
- Production deployment broken
- Cannot authenticate with Shopify
- Cryptic errors for merchants
- Launch delay

**Prevention:**
- Set environment variables in Vercel dashboard:
  - Project Settings → Environment Variables
  - Add for Production, Preview, Development
- Required variables for Shopify app:
  - `SHOPIFY_API_KEY`
  - `SHOPIFY_API_SECRET`
  - `SHOPIFY_API_SCOPES`
  - `DATABASE_URL` (for Prisma)
  - `HOST` (production app URL)
- Use `vercel env pull` to sync locally
- Document required env vars in README
- Consider using Vercel integration for Shopify (auto-configures vars)

**Detection:**
- Deploy to Vercel → Check function logs for "undefined" errors
- Run `vercel env ls` to list configured variables
- Test production deployment before app submission

**Phase mapping:** Configure in Deployment phase, document in Infrastructure Setup.

---

### Pitfall 20: No Idempotency for Duplicate Webhooks

**What goes wrong:** Same webhook delivered twice. App processes order twice, creates duplicate Draft Orders, charges merchant twice.

**Why it happens:** Shopify retries failed webhooks. Network issues can cause duplicate deliveries. Developers don't implement idempotency.

**Consequences:**
- Duplicate orders
- Incorrect inventory counts
- Duplicate charges
- Merchant complaints and refunds

**Prevention:**
- Extract unique identifier from webhook payload (e.g., `order_id`, `product_id`)
- Before processing, check if already processed:
  ```typescript
  const existing = await prisma.webhookLog.findUnique({
    where: { shopifyId: webhook.id }
  });
  if (existing) return; // Already processed
  ```
- Store webhook ID in database with processed timestamp
- Make processing logic idempotent (safe to run twice)
- Shopify mandate: Idempotency required for mutations starting April 2026

**Detection:**
- Manually send same webhook twice → Check for duplicates
- Review database for duplicate records with same Shopify ID
- Monitor webhook logs for same ID processed multiple times

**Phase mapping:** Build into Webhook Handlers from the start (Webhook System phase).

**Sources:**
- [Webhook best practices - handle duplicates](https://shopify.dev/docs/apps/build/webhooks/best-practices)
- [API versioning - idempotency requirement](https://shopify.dev/docs/api/usage/versioning)

---

## Phase-Specific Warnings

Guidance for which phases are high-risk and need extra attention.

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| **App Setup & Authentication** | Third-party cookies (Critical #2), OAuth redirect (Moderate #13) | Use session tokens immediately, test OAuth in production before launch |
| **Database & Infrastructure** | Prisma connection exhaustion (Critical #4) | Choose connection pooling strategy NOW (Accelerate, Fluid, or pgBouncer) |
| **Draft Orders Integration** | Rate limits (Critical #5), inventory confusion (Critical #8), async creation (Minor #18) | Implement retry logic, understand inventory behavior, handle 202 responses |
| **REST API Development** | No HMAC verification (Critical #6), API version drift (Moderate #10) | Design auth with signatures from start, set up version monitoring |
| **Webhook System** | Missing GDPR webhooks (Critical #3), delivery assumptions (Moderate #9), no idempotency (Minor #20) | Register GDPR webhooks early, build reconciliation jobs, check for duplicates |
| **Theme/Storefront Integration** | Ghost code on uninstall (Critical #1) | Use Theme App Extensions or npm widget, never inject Liquid |
| **Billing/Monetization** | Wrong billing API (Critical #7), over-scoped permissions (Moderate #11) | Use Shopify Billing API only, follow least privilege |
| **Deployment** | Environment variables (Minor #19), OAuth testing (Moderate #13), Vercel-Remix issues (Moderate #12) | Configure Vercel env vars, test full flow on production URL |
| **Widget Distribution** | npm package vulnerabilities (Moderate #14) | Run npm audit, fix React CVE-2025-55182, use provenance |
| **UI Development** | Polaris accessibility (Minor #15) | Use Polaris components correctly, test with keyboard and screen reader |

---

## Research Confidence Assessment

| Pitfall Category | Confidence Level | Verification Source |
|------------------|------------------|---------------------|
| App Store Rejections | **HIGH** | Official Shopify docs ([common rejections](https://shopify.dev/docs/apps/store/review/common-rejections)) + recent Gadget article |
| Session Tokens | **HIGH** | Official Shopify docs ([session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens)) + community issues |
| GDPR Webhooks | **HIGH** | Official docs ([privacy compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)) + multiple community guides |
| Draft Orders Behavior | **HIGH** | Official API reference ([DraftOrder](https://shopify.dev/docs/api/admin-rest/latest/resources/draftorder)) + community discussions |
| Vercel Deployment | **MEDIUM** | Prisma official docs + community reports (some issues are environment-specific) |
| Rate Limits | **HIGH** | Official docs ([API limits](https://shopify.dev/docs/api/usage/limits)) + multiple implementation guides |
| Webhook Reliability | **HIGH** | Official best practices docs + Hookdeck deep-dive guides |
| React CVE-2025-55182 | **HIGH** | Official React security advisory (Dec 2025) + security vendor reports |
| Theme App Extensions | **HIGH** | Official docs ([theme extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)) + migration guides |
| Billing API | **HIGH** | Official docs ([billing](https://shopify.dev/docs/apps/launch/billing)) + App Store requirements |
| API Versioning | **HIGH** | Official versioning docs + 2026-01 release notes |
| Polaris Accessibility | **MEDIUM** | Polaris documentation + community accessibility guides (WCAG compliance verified) |

**Overall Confidence: HIGH** — All critical pitfalls verified with official Shopify documentation or authoritative sources (Prisma, React, npm). Moderate pitfalls cross-referenced with community reports.

---

## Sources

### Official Shopify Documentation
- [Common app rejections](https://shopify.dev/docs/apps/store/review/common-rejections)
- [Session tokens](https://shopify.dev/docs/apps/build/authentication-authorization/session-tokens)
- [Privacy law compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [DraftOrder REST API](https://shopify.dev/docs/api/admin-rest/latest/resources/draftorder)
- [Webhook best practices](https://shopify.dev/docs/apps/build/webhooks/best-practices)
- [API rate limits](https://shopify.dev/docs/api/usage/limits)
- [API versioning](https://shopify.dev/docs/api/usage/versioning)
- [Billing for your app](https://shopify.dev/docs/apps/launch/billing)
- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [Access scopes](https://shopify.dev/docs/api/usage/access-scopes)

### Third-Party Technical Sources
- [Gadget: Pass Shopify app review](https://gadget.dev/blog/how-to-pass-the-shopify-app-store-review-the-first-time-part-1-the-technical-bit)
- [Prisma: Deploy to Vercel](https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-vercel)
- [Vercel: Connection pooling](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Hookdeck: Shopify webhooks guide](https://hookdeck.com/webhooks/platforms/shopify-webhooks-best-practices-revised-and-extended)
- [Kirill Platonov: Rate limit strategies](https://kirillplatonov.com/posts/shopify-api-rate-limits/)
- [React Security Advisory: CVE-2025-55182](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [Polaris accessibility](https://polaris-react.shopify.com/foundations/accessibility)

### Community Discussions (Verified)
- [GDPR webhook setup guide](https://medium.com/@muhammadehsanullah123/how-to-configure-gdpr-compliance-webhooks-in-shopify-public-apps-b2107721a58f)
- [Session token authentication issues](https://community.shopify.com/t/session-token-authentication-issue-for-built-for-shopify-badge/416552)
- [Draft Orders limitations](https://community.shopify.dev/t/draft-orders-api-limitations/19710)
- [Unable to install Remix apps](https://community.shopify.com/t/unable-to-install-new-remix-app-on-production-stores-you-dont-have-this-app-installed/389199)

---

## Next Steps

**For Orchestrator/Roadmap Creator:**

1. **Phase 1 (App Foundation)** MUST address:
   - Critical #2: Session tokens (not cookies)
   - Critical #4: Prisma connection pooling strategy

2. **Phase 2 (Data Model)** MUST address:
   - Critical #3: GDPR webhook handlers
   - Critical #8: Draft Orders inventory understanding
   - Minor #16: Data retention for draft order history

3. **Phase 3 (Draft Orders)** MUST address:
   - Critical #5: Rate limit handling with retries
   - Minor #18: Async creation polling

4. **Phase 4 (REST API)** MUST address:
   - Critical #6: HMAC request signing
   - Moderate #11: Minimal scope requests

5. **Before Submission** MUST address:
   - Critical #1: Theme App Extensions (not script injection)
   - Critical #7: Shopify Billing API
   - Moderate #13: Production OAuth testing

**High-risk phases requiring deeper research:**
- Draft Orders Integration (3 critical pitfalls)
- Authentication & Authorization (2 critical pitfalls)
- Infrastructure/Database (connection pooling is make-or-break)
