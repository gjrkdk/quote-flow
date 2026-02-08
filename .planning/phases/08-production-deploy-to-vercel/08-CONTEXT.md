# Phase 08: Production Deploy to Vercel - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy the app to Vercel with a production database and stable URL. Admin UI and REST API must work on the production URL. Does not include Partner Dashboard registration or E2E verification (those are Phases 09 and 10).

</domain>

<decisions>
## Implementation Decisions

### Database provisioning
- Use Neon directly (not Vercel Postgres wrapper) for managed PostgreSQL
- Two environments: local Docker (dev) and Neon (production) — no preview/staging database
- Migrations run as part of Vercel's build step (`prisma migrate deploy` in build command)
- Production database starts empty — no seed data

### Vercel configuration
- Use default Vercel subdomain (*.vercel.app) — no custom domain
- Environment variables managed via Vercel dashboard (DATABASE_URL, SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SCOPES)
- Vercel adapter for Remix needs to be set up (@vercel/remix + vercel.json) — not yet configured
- Vercel account already exists

### Shopify app URL transition
- Production app coexists alongside local dev setup (ngrok stays for local development)
- Same dev store (pricing-app-3.myshopify.com) used for both environments — app data lives in separate databases, no conflict
- Production app needs its own API credentials — include step-by-step Partner Dashboard guide as a manual step in the plan
- Widget keeps current behavior: apiBaseUrl is configurable via prop, no default change

### Deploy workflow
- Auto-deploy on push to main branch (Vercel's default behavior)
- Preview deployments enabled for non-main branches
- No CI/CD gate — direct deploy to production on push
- GitHub repo is public

### Claude's Discretion
- Exact Vercel adapter configuration and vercel.json structure
- Build command composition (prisma generate + migrate + remix build)
- Any necessary Remix/Vite config changes for Vercel compatibility
- Error page handling in production

</decisions>

<specifics>
## Specific Ideas

- Include step-by-step instructions for creating the production app in Shopify Partner Dashboard (user needs guidance)
- Keep the ngrok dev setup working alongside production — no breaking changes to local dev workflow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-production-deploy-to-vercel*
*Context gathered: 2026-02-08*
