# Phase 1: Foundation & Authentication - Context

**Gathered:** 2026-02-04
**Status:** Ready for planning

<domain>
## Phase Boundary

App installs securely into Shopify stores via OAuth, persists merchant sessions using session tokens, auto-generates an API key per store, and responds to GDPR webhooks. This phase delivers the infrastructure shell — no matrix management or pricing logic.

</domain>

<decisions>
## Implementation Decisions

### API key experience
- Display, masking, and regeneration behavior: Claude's discretion (follow conventions like Stripe/Shopify)
- Single key per store vs multiple: Claude's discretion (simplest approach for v1)
- Placement in dashboard: Claude's discretion (fits overall layout)

### Install & onboarding flow
- After OAuth install, show a dismissible welcome card with 2-3 steps (e.g., "Create your first matrix", "Copy your API key", "Add the widget")
- Welcome card dismissed manually by merchant (no auto-dismiss on step completion)
- Tone: friendly and encouraging — warm language like "You're all set! Here's how to get started"
- Include a link to documentation in the welcome card

### Dashboard shell
- Navigation structure: Claude's discretion (follow Shopify embedded app conventions)
- Styling: Claude's discretion (Polaris-native approach preferred)
- Empty state (no matrices): simple text explanation with a "Create" CTA button — no illustration
- At-a-glance metrics: Claude's discretion

### Error & edge cases
- Failed OAuth install: show a friendly error page with a "Try installing again" button
- Uninstall/reinstall data handling: Claude's discretion (follow Shopify conventions)
- Expired sessions: silent re-authentication in the background — merchant should not notice
- Use Polaris Toast notifications for action confirmations and errors (e.g., "API key copied", "Settings saved")

### Claude's Discretion
- API key display format (visible vs masked), regeneration flow, single vs multiple keys
- Navigation structure (tabs vs sidebar vs single page)
- Branding (pure Polaris vs accent color)
- Dashboard metrics presence
- Reinstall data preservation strategy

</decisions>

<specifics>
## Specific Ideas

- Welcome card tone should feel approachable — "You're all set!" not "Configuration required"
- Docs link in welcome card suggests external documentation will exist (can be a placeholder URL in v1)
- Toast notifications are the standard feedback mechanism — use for all user actions

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-authentication*
*Context gathered: 2026-02-04*
