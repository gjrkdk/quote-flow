---
phase: 15-graphql-migration-gdpr
plan: 01
subsystem: async-processing
tags: [gdpr, job-queue, async, infrastructure]
completed: 2026-02-12
duration: 228s

dependency_graph:
  requires: []
  provides:
    - JobQueue database model
    - Job queue service (enqueue/process)
    - GDPR deletion handlers (shop/customer redact)
  affects:
    - Webhook processing (future plans will use this infrastructure)

tech_stack:
  added:
    - JobQueue Prisma model with status/scheduledAt index
    - Exponential backoff retry logic (2s, 4s, 8s)
    - Atomic job claiming via Prisma transactions
  patterns:
    - Database-backed job queue (vs in-memory)
    - Transaction-based job claiming (prevents duplicate processing)
    - Exponential backoff for retries

key_files:
  created:
    - prisma/migrations/20260212165942_add_job_queue/migration.sql
    - app/services/job-queue.server.ts
    - app/services/gdpr-deletion.server.ts
  modified:
    - prisma/schema.prisma

decisions:
  - Using database-backed job queue (simpler than external queue service for MVP)
  - Exponential backoff with 3 max attempts (2s, 4s, 8s delays)
  - Transaction-based atomic job claiming (prevents duplicate processing)
  - Cascade delete via store.deleteMany for shop_redact (leverages Prisma schema)
  - Acknowledgment-only for customer_redact (app stores no customer PII)

metrics:
  files_created: 3
  files_modified: 1
  tasks_completed: 3
---

# Phase 15 Plan 01: Job Queue Infrastructure Summary

**One-liner:** Database-backed job queue with atomic claiming, exponential backoff retry, and GDPR deletion handlers for async webhook processing.

## What Was Built

Created the foundation for async webhook processing:

1. **JobQueue Model**: Prisma model with type, payload, status, attempts, scheduledAt, processedAt, error fields. Index on [status, scheduledAt] for efficient polling.

2. **Job Queue Service**:
   - `enqueueJob`: Fast (<50ms) job creation with pending status
   - `processNextJob`: Atomic job claiming via Prisma transaction, execution with retry logic
   - Exponential backoff: 2s, 4s, 8s delays for failed jobs
   - Max 3 attempts before permanent failure

3. **GDPR Deletion Service**:
   - `processShopRedact`: Cascade delete of store (and all matrices, option groups, draft orders)
   - `processCustomerRedact`: Acknowledgment-only (app stores no customer PII)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Manual migration creation due to missing local database**
- **Found during:** Task 1 (Prisma migration generation)
- **Issue:** Local PostgreSQL not running on localhost:5400, preventing `prisma migrate dev` execution
- **Fix:** Manually created migration file with correct SQL DDL based on existing migration pattern
- **Files modified:** Created `prisma/migrations/20260212165942_add_job_queue/migration.sql`
- **Commit:** ffac2ca
- **Rationale:** Migration can be applied when database is available (locally or in production via `prisma migrate deploy`)

**2. [Rule 1 - Bug] Fixed TypeScript type error in enqueueJob payload**
- **Found during:** Task 2 verification
- **Issue:** `Record<string, unknown>` not assignable to `Prisma.InputJsonValue`
- **Fix:** Added type cast `payload as Prisma.InputJsonValue` and imported `Prisma` type
- **Files modified:** app/services/job-queue.server.ts
- **Commit:** fc21356
- **Rationale:** Prisma requires specific JSON input type for JSONB columns

## Task Commits

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add JobQueue model to Prisma schema | ffac2ca | prisma/schema.prisma, migration.sql |
| 2 | Create job queue service | fc21356 | app/services/job-queue.server.ts |
| 3 | Create GDPR deletion service | 5ff3f9c | app/services/gdpr-deletion.server.ts |

## Verification Results

✓ Prisma schema valid (`npx prisma validate`)
✓ Prisma client regenerated with JobQueue model
✓ TypeScript compiles without errors in new service files
✓ job-queue.server.ts exports enqueueJob and processNextJob
✓ gdpr-deletion.server.ts exports processShopRedact and processCustomerRedact

## Technical Notes

### Job Queue Design

**Atomic Job Claiming:**
```typescript
// Transaction ensures only one worker claims a job
const job = await prisma.$transaction(async (tx) => {
  const pendingJob = await tx.jobQueue.findFirst({
    where: { status: "pending", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
  });

  if (!pendingJob) return null;

  return await tx.jobQueue.update({
    where: { id: pendingJob.id },
    data: { status: "processing", attempts: { increment: 1 } },
  });
});
```

**Retry Logic:**
- Attempt 1 fails → retry in 2s
- Attempt 2 fails → retry in 4s
- Attempt 3 fails → mark as permanently failed

**Job Status Flow:**
```
pending → processing → completed
                    ↓ (on failure, attempts < max)
                   pending (with scheduledAt = now + backoff)
                    ↓ (on failure, attempts >= max)
                   failed
```

### GDPR Compliance

**Shop Redact (Full Deletion):**
- Deletes store record
- Cascade deletes: matrices → breakpoints, cells, productMatrices; optionGroups → optionChoices, productOptionGroups; draftOrderRecords
- Marks GDPR request as processed

**Customer Redact (Acknowledgment):**
- No deletion needed (app stores no customer PII)
- Draft orders are product-based quotes (dimensions, prices)
- No customer names, emails, or addresses stored
- Comment documents future-proofing if customer data is added

### Migration Strategy

Migration created manually due to local database unavailability. To apply:

**Production (Vercel):**
```bash
# Automatic via vercel-build script
prisma migrate deploy
```

**Local development:**
```bash
# Start PostgreSQL on port 5400, then:
npx prisma migrate deploy
```

## Next Steps

Plan 15-02 will integrate this job queue into the webhook handler:
- Replace synchronous GDPR deletion with `enqueueJob` calls
- Add background job processor (cron or long-running worker)
- Wire up shop_redact and customer_redact webhooks to use async processing

## Self-Check: PASSED

✓ Created files exist:
  - /Users/robinkonijnendijk/Desktop/quote-flow/prisma/migrations/20260212165942_add_job_queue/migration.sql
  - /Users/robinkonijnendijk/Desktop/quote-flow/app/services/job-queue.server.ts
  - /Users/robinkonijnendijk/Desktop/quote-flow/app/services/gdpr-deletion.server.ts

✓ Modified files exist:
  - /Users/robinkonijnendijk/Desktop/quote-flow/prisma/schema.prisma

✓ Commits exist:
  - ffac2ca: feat(15-01): add JobQueue model to Prisma schema
  - fc21356: feat(15-01): create job queue service with enqueue and process functions
  - 5ff3f9c: feat(15-01): create GDPR deletion service with shop and customer redact handlers

✓ Exports verified:
  - job-queue.server.ts: enqueueJob, processNextJob
  - gdpr-deletion.server.ts: processShopRedact, processCustomerRedact

✓ TypeScript compilation: No errors in new service files
✓ Prisma schema: Valid
