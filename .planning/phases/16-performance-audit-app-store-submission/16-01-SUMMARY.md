---
phase: 16-performance-audit-app-store-submission
plan: 01
subsystem: infra
tags: [lighthouse, performance, ci, github-actions, database-indexes, postgresql, prisma]

# Dependency graph
requires:
  - phase: 15-graphql-gdpr
    provides: GraphQL migration complete, GDPR compliance implemented
provides:
  - Database index verification document confirming all 11 foreign keys indexed
  - Lighthouse CI configuration with performance thresholds (0.8 perf, 0.9 a11y)
  - GitHub Actions workflow for automated performance regression testing
  - Baseline infrastructure for App Store submission performance requirements
affects: [16-02, 16-03, app-store-submission]

# Tech tracking
tech-stack:
  added: ["@lhci/cli@0.15.1"]
  patterns: ["Performance regression testing in CI", "Database index documentation", "Automated Lighthouse audits"]

key-files:
  created:
    - prisma/INDEXES_VERIFICATION.md
    - .lighthouserc.cjs
    - .github/workflows/lighthouse-ci.yml
  modified:
    - package.json

key-decisions:
  - "SEO checks disabled for Lighthouse CI (embedded Shopify app, not public-facing)"
  - "Desktop preset with minimal throttling (realistic admin environment testing)"
  - "3-run averaging for consistent performance baselines"
  - "Performance threshold 0.8, accessibility 0.9, best-practices 0.8 (accounts for Shopify 10-point degradation rule)"

patterns-established:
  - "Index verification: Document all foreign key indexes with explicit coverage table"
  - "Lighthouse config: Use .cjs extension when package.json has 'type: module'"
  - "CI workflow: Provide placeholder env vars for build validation without actual API calls"

# Metrics
duration: 132s
completed: 2026-02-12
---

# Phase 16 Plan 01: Database Indexes & Lighthouse CI Summary

**All 11 foreign keys verified indexed (8 explicit, 3 via unique constraints), Lighthouse CI configured with Shopify-compliant thresholds, automated performance regression testing via GitHub Actions**

## Performance

- **Duration:** 2 min 12 sec
- **Started:** 2026-02-12T20:46:10Z
- **Completed:** 2026-02-12T20:48:22Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Verified all 11 foreign key columns have database indexes (explicit or implicit via unique constraints)
- Set up Lighthouse CI with 3-run averaging on 3 key admin pages
- Configured GitHub Actions workflow for automated performance testing on push/PR
- Established performance thresholds: 0.8 performance, 0.9 accessibility, 0.8 best-practices
- Created comprehensive index verification document for App Store submission evidence

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify database indexes and add migration if needed** - `362d8cf` (docs)
2. **Task 2: Set up Lighthouse CI with GitHub Actions workflow** - `ad7bb75` (feat)

## Files Created/Modified
- `prisma/INDEXES_VERIFICATION.md` - Comprehensive audit of all 11 foreign keys with index coverage table, documents that @@unique creates indexes in PostgreSQL
- `.lighthouserc.cjs` - Lighthouse CI config with desktop preset, 3-run averaging, performance thresholds matching Shopify requirements
- `.github/workflows/lighthouse-ci.yml` - GitHub Actions workflow running Lighthouse on push/PR with test database env vars for build
- `package.json` - Added @lhci/cli dev dependency and 'lighthouse' convenience script

## Decisions Made

**1. SEO checks disabled**
- Rationale: Embedded Shopify admin app, not public-facing pages, SEO not applicable

**2. Desktop preset with minimal throttling**
- Rationale: Admin users typically on desktop with good connections, realistic testing environment

**3. Performance threshold 0.8 (not 0.9)**
- Rationale: Shopify App Bridge introduces ~10-point performance degradation (documented in App Store guidelines), 0.8 accounts for this while maintaining quality

**4. 3-run averaging**
- Rationale: Lighthouse scores vary between runs, averaging provides stable baseline for regression detection

**5. Placeholder env vars in CI**
- Rationale: Lighthouse audits frontend only, actual API connections not needed, but build step requires env vars to compile without errors

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all verifications passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 16 Plan 02 (Baseline Performance Audit):**
- Database indexes verified and documented
- Lighthouse CI configured and ready for baseline collection
- GitHub Actions workflow ready to run (though will fail until baseline established)
- Infrastructure complete for ongoing performance monitoring

**Blockers:** None

**Notes:**
- Lighthouse CI workflow will not pass until baseline performance scores meet thresholds
- Next plan should collect baseline metrics and identify any performance issues before App Store submission

## Self-Check: PASSED

All claimed files and commits verified to exist:
- ✓ prisma/INDEXES_VERIFICATION.md
- ✓ .lighthouserc.cjs
- ✓ .github/workflows/lighthouse-ci.yml
- ✓ package.json
- ✓ Commit 362d8cf
- ✓ Commit ad7bb75

---
*Phase: 16-performance-audit-app-store-submission*
*Completed: 2026-02-12*
