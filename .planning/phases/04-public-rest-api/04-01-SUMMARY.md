---
phase: 04-public-rest-api
plan: 01
subsystem: api
tags: [zod, authentication, rate-limiting, rest-api, security]

# Dependency graph
requires:
  - phase: 01-foundation-authentication
    provides: API key generation and hashing utilities (api-key.server.ts)
  - phase: 01-foundation-authentication
    provides: Prisma database client with Store model
provides:
  - Zod validation schemas for API input (PriceQuerySchema, ProductIdSchema)
  - API key authentication middleware (authenticateApiKey)
  - In-memory rate limiting per store (checkRateLimit, getRateLimitHeaders)
  - RFC 7807 error response format for all API errors
affects: [04-public-rest-api, 05-react-widget]

# Tech tracking
tech-stack:
  added: [zod@4.3.6]
  patterns:
    - RFC 7807 Problem Details for HTTP APIs error format
    - Timing-safe API key comparison
    - In-memory rate limiting with Map-based storage
    - Zod coercion for query parameter validation

key-files:
  created:
    - app/validators/api.validators.ts
    - app/utils/api-auth.server.ts
    - app/utils/rate-limit.server.ts
  modified:
    - package.json (added zod dependency)

key-decisions:
  - "Zod for API input validation with automatic string-to-number coercion for query params"
  - "RFC 7807 format for all API error responses (type, title, status, detail)"
  - "In-memory rate limiting (100 req/15min per store) - single-instance only, Redis migration needed for multi-instance"
  - "Product ID normalization to GID format (gid://shopify/Product/{id}) for consistency"
  - "Same error message for missing store and invalid API key (prevents enumeration attacks)"

patterns-established:
  - "API authentication: Extract X-API-Key header → lookup by prefix → timing-safe verify → return store object"
  - "Rate limiting: Per-store tracking with 15-minute windows, periodic cleanup to prevent memory leaks"
  - "Validation: Zod schemas with .coerce for type conversion, custom refinements for complex validation"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase 4 Plan 1: API Authentication & Validation Foundation

**Zod validation, API key authentication middleware, and in-memory rate limiting (100 req/15min per store) with RFC 7807 error format**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T17:16:26Z
- **Completed:** 2026-02-05T17:17:53Z
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments

- Zod validation schemas coerce string query params to validated numbers with clear error messages
- API key authentication middleware performs timing-safe comparison and returns store object or throws 401
- In-memory rate limiting enforces 100 requests per 15-minute window per store with Retry-After headers
- All error responses follow RFC 7807 Problem Details format (type, title, status, detail)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Zod and create Zod validation schemas** - `b38cff6` (feat)
   - Installed zod@4.3.6 dependency
   - Created PriceQuerySchema for query parameter validation (width, height, quantity)
   - Created ProductIdSchema accepting both numeric and GID formats
   - Added normalizeProductId helper to convert numeric IDs to GID format

2. **Task 2: Create API authentication middleware** - `faf1987` (feat)
   - Created authenticateApiKey function for X-API-Key header verification
   - Uses timing-safe comparison via existing verifyApiKey utility
   - Returns store object (id, shop, unitPreference) on success
   - Throws 401 RFC 7807 response with same message for missing/invalid key (prevents enumeration)

3. **Task 3: Create in-memory rate limiting utility** - `7d82fe6` (feat)
   - Implemented Map-based rate limiter with 100 requests per 15-minute window
   - Throws 429 RFC 7807 response with Retry-After header when limit exceeded
   - Provides getRateLimitHeaders for X-RateLimit-* headers
   - Periodic cleanup every 5 minutes prevents memory leaks

**Plan metadata:** (pending final docs commit)

## Files Created/Modified

- `app/validators/api.validators.ts` - Zod schemas for API input validation (PriceQuerySchema, ProductIdSchema) with coercion and normalization
- `app/utils/api-auth.server.ts` - API key authentication middleware with timing-safe comparison and RFC 7807 error responses
- `app/utils/rate-limit.server.ts` - In-memory per-store rate limiting with 15-minute windows and periodic cleanup
- `package.json` - Added zod@4.3.6 dependency

## Decisions Made

**1. Zod for API input validation**
- Rationale: Industry standard with excellent TypeScript integration and automatic coercion for query params
- Pattern: `z.coerce.number().positive()` automatically converts string "123" to number 123

**2. RFC 7807 Problem Details format for all API errors**
- Rationale: IETF standard (RFC 7807) provides consistent machine-readable error format
- Format: `{ type, title, status, detail }` with appropriate HTTP status codes

**3. In-memory rate limiting (single-instance only)**
- Rationale: Simplest approach for v1, avoids Redis dependency
- Limitation: Only works for single-instance deployments (documented in code)
- Migration path: Replace Map with Redis client for multi-instance

**4. Product ID normalization to GID format**
- Rationale: Shopify ProductMatrix table stores GID format, normalize early to avoid mismatches
- Pattern: `normalizeProductId("12345")` → `"gid://shopify/Product/12345"`

**5. Same error message for missing store and invalid API key**
- Rationale: Security best practice to prevent API key enumeration attacks
- Both cases return: "Invalid API key" with 401 status

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all utilities created successfully with expected behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 04-02 (REST endpoint implementation):**
- Authentication middleware ready to compose into resource routes
- Validation schemas ready for query parameter parsing
- Rate limiting ready for request throttling
- RFC 7807 error format established for consistent API responses

**What Plan 04-02 will do:**
- Create GET /api/prices/:productId endpoint
- Compose authenticateApiKey + checkRateLimit + price calculation
- Use PriceQuerySchema to validate width/height/quantity
- Return price response with rate limit headers

**No blockers** - all foundation utilities tested and ready for composition.

---
*Phase: 04-public-rest-api*
*Completed: 2026-02-05*
