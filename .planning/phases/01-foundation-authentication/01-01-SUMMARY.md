---
phase: 01-foundation-authentication
plan: 01
subsystem: infra
tags: [shopify, remix, prisma, postgresql, oauth, webhooks, gdpr, vercel]

# Dependency graph
requires:
  - phase: none
    provides: empty project structure
provides:
  - Shopify Remix app scaffold with TypeScript, Vite, Remix configuration
  - Prisma schema with Store and GdprRequest models
  - PostgreSQL connection with pg adapter and pooling for Vercel deployment
  - Shopify OAuth with session token support via PostgreSQLSessionStorage
  - GDPR webhook handlers (APP_UNINSTALLED, CUSTOMERS_DATA_REQUEST, CUSTOMERS_REDACT, SHOP_REDACT)
  - Auth routes (auth.$.tsx, auth.login) for OAuth flow
affects: [02-api-key-generation, 03-admin-ui, all-phases]

# Tech tracking
tech-stack:
  added:
    - "@shopify/shopify-app-remix@2.7.0"
    - "@shopify/shopify-app-session-storage-postgresql@3.0.0"
    - "prisma@5.8.0"
    - "@prisma/adapter-pg@5.8.0"
    - "pg@8.11.3"
    - "@remix-run/dev@2.5.0"
    - "@shopify/polaris@12.0.0"
  patterns:
    - "Global Prisma singleton with pg adapter for connection pooling"
    - "PostgreSQL session storage for Shopify OAuth"
    - "GDPR webhook handlers storing audit trail in GdprRequest table"
    - "Shopify embedded app with session token auth (unstable_newEmbeddedAuthStrategy)"

key-files:
  created:
    - "app/shopify.server.ts"
    - "app/db.server.ts"
    - "prisma/schema.prisma"
    - "app/routes/webhooks.tsx"
    - "app/routes/auth.$.tsx"
    - "app/routes/auth.login/route.tsx"
    - "package.json"
    - "vite.config.ts"
    - "tsconfig.json"
    - "shopify.app.toml"
  modified: []

key-decisions:
  - "Use @shopify/shopify-app-session-storage-postgresql instead of Prisma storage for session management"
  - "Enable unstable_newEmbeddedAuthStrategy for session token support (third-party cookie fix)"
  - "Store GDPR requests in database for audit trail (GdprRequest model)"
  - "Use pg Pool adapter with max connection limit for Vercel serverless deployment"
  - "Set scopes to write_products, read_customers, write_draft_orders in shopify.app.toml"

patterns-established:
  - "Global Prisma singleton: Prevents connection exhaustion in dev with global.__db pattern"
  - "GDPR webhook audit: Store all GDPR requests in database before processing"
  - "SHOP_REDACT handling: Delete store record from database when shop requests data deletion"

# Metrics
duration: 5min
completed: 2026-02-04
---

# Phase 1 Plan 1: Shopify Remix Scaffold Summary

**Shopify Remix app with OAuth, PostgreSQL session storage, Prisma models (Store, GdprRequest), GDPR webhooks, and Vercel connection pooling**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-04T08:16:40Z
- **Completed:** 2026-02-04T08:21:17Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Shopify Remix app scaffolded with all dependencies (Shopify, Remix, Prisma, Polaris, pg adapter)
- Prisma schema with Store model (shop, accessToken, apiKeyHash, onboardingCompleted) and GdprRequest model
- Shopify OAuth configured with PostgreSQL session storage and session token support
- All 4 GDPR webhooks registered and handled (APP_UNINSTALLED, CUSTOMERS_DATA_REQUEST, CUSTOMERS_REDACT, SHOP_REDACT)
- Database connection with pg Pool adapter and connection limit for Vercel serverless

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Shopify Remix app and configure database** - `bc8e216` (chore)
2. **Task 2: Configure Shopify OAuth, session storage, and webhook handlers** - `c013c4f` (feat)

## Files Created/Modified

Created:
- `package.json` - Project dependencies with Shopify Remix, Prisma, pg adapter, Vercel functions
- `tsconfig.json` - TypeScript configuration with Remix types
- `vite.config.ts` - Vite config with Remix plugin and tsconfigPaths
- `remix.config.js` - Remix configuration
- `shopify.app.toml` - Shopify app configuration with OAuth scopes and webhook subscriptions
- `.env.example` - Environment variable template (SHOPIFY_API_KEY, SHOPIFY_API_SECRET, DATABASE_URL)
- `.gitignore` - Git ignore patterns for node_modules, build, .env
- `prisma/schema.prisma` - Prisma schema with Store and GdprRequest models
- `app/db.server.ts` - Prisma client singleton with pg Pool adapter
- `app/root.tsx` - Remix root component with App Bridge script tag
- `app/entry.server.tsx` - Remix server entry with document response headers
- `app/entry.client.tsx` - Remix client entry with hydration
- `app/shopify.server.ts` - Shopify app configuration with OAuth, session storage, 4 webhooks
- `app/routes/auth.$.tsx` - OAuth catch-all route
- `app/routes/auth.login/route.tsx` - OAuth login route with shop parameter
- `app/routes/webhooks.tsx` - Webhook handler for GDPR and app lifecycle events

Modified:
- `app/db.server.ts` - Fixed pooling pattern to remove non-existent attachDatabasePool import

## Decisions Made

1. **PostgreSQL session storage:** Used @shopify/shopify-app-session-storage-postgresql instead of Prisma-based storage to leverage official Shopify package with built-in session management
2. **Session token strategy:** Enabled unstable_newEmbeddedAuthStrategy to support session tokens (fixes third-party cookie issues in embedded apps)
3. **GDPR audit trail:** Store all GDPR requests in GdprRequest model before processing for compliance audit trail
4. **Connection pooling:** Use pg Pool adapter with connection limit instead of direct Prisma connection for Vercel serverless compatibility
5. **OAuth scopes:** Set to write_products, read_customers, write_draft_orders in shopify.app.toml (required for draft orders feature in Phase 3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Vercel pooling import error**
- **Found during:** Task 1 (TypeScript compilation)
- **Issue:** Initial implementation used `attachDatabasePool` from `@vercel/functions` which doesn't exist in that package
- **Fix:** Removed incorrect import and simplified to use pg Pool directly with connection limit configuration
- **Files modified:** app/db.server.ts
- **Verification:** TypeScript compilation passes, no import errors
- **Committed in:** c013c4f (Task 2 commit)

**2. [Rule 3 - Blocking] Created .env file for development**
- **Found during:** Task 1 (prisma validate)
- **Issue:** Prisma validation failed because DATABASE_URL environment variable wasn't set
- **Fix:** Created .env file with placeholder values for local development (already in .gitignore)
- **Files modified:** .env (not committed, already in .gitignore)
- **Verification:** prisma validate and prisma generate succeed
- **Committed in:** N/A (dev-only file, not committed)

---

**Total deviations:** 2 auto-fixed (2 blocking issues)
**Impact on plan:** Both fixes were necessary to unblock task execution. First fix corrected incorrect API usage. Second fix enabled Prisma tooling to run. No scope creep.

## Issues Encountered

None - plan executed smoothly after fixing blocking issues.

## User Setup Required

**External services require manual configuration.** Before the app can be used:

1. **Shopify Partners Dashboard:**
   - Create app in Shopify Partners Dashboard (partners.shopify.com)
   - Get SHOPIFY_API_KEY and SHOPIFY_API_SECRET from Client credentials
   - Set App URL and Allowed redirection URLs in App setup

2. **PostgreSQL Database:**
   - Provision PostgreSQL database (Vercel Postgres, Neon, Supabase, or local)
   - Get DATABASE_URL connection string
   - Ensure connection string uses pgbouncer with connection_limit=1 for Vercel deployment

3. **Environment Variables:**
   - Copy .env.example to .env
   - Fill in SHOPIFY_API_KEY, SHOPIFY_API_SECRET, DATABASE_URL, SHOPIFY_APP_URL

4. **Database Migration:**
   - Run `npx prisma migrate dev` to create Store and GdprRequest tables

See plan frontmatter user_setup section for detailed steps.

## Next Phase Readiness

**Ready for next phase:**
- Shopify app foundation complete with OAuth and session persistence
- Database models ready for API key storage (Store.apiKeyHash, Store.apiKeyPrefix)
- GDPR webhooks registered and handling compliance requirements
- TypeScript compilation passes, no build errors

**No blockers.**

**What's next:**
- Phase 1 Plan 2: API key generation and storage (Store model ready with apiKeyHash field)
- Phase 1 Plan 3: Admin UI for onboarding flow

---
*Phase: 01-foundation-authentication*
*Completed: 2026-02-04*
