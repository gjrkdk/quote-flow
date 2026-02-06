# Phase 6: Polish & App Store Preparation - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Meet Shopify App Store quality standards: CSV matrix import, responsive UI for desktop and tablet, WCAG 2.1 AA accessibility, security review readiness, and App Store listing preparation. All core features are complete from Phases 1-5.

</domain>

<decisions>
## Implementation Decisions

### CSV Import Experience
- Simple 3-column format: width, height, price — system infers the grid from unique values
- Import option lives on the create matrix page alongside existing template choices (Small, Medium, Custom)
- Preview step before creation: show the parsed grid with row/error counts, merchant confirms or cancels
- Inline row errors: show all valid rows in preview + highlight invalid rows with specific error messages (e.g., "row 5: price is not a number")
- CSV import is a paid-tier feature (freemium gate)

### Responsive Layout
- Priority devices: desktop + tablet (phone is low priority)
- Matrix grid editor: horizontal scroll on small screens — keep grid as-is, allow scrolling
- Dashboard and matrix list: single column stack on tablet — cards and tables go full-width vertically
- Breakpoint management (add/remove) accessible on tablet — merchants may manage matrices on the go

### Accessibility (WCAG 2.1 AA)
- Full spreadsheet keyboard navigation in matrix grid: arrow keys move between cells, Tab moves to next cell, Enter confirms edit
- Screen reader support via proper `<th>` headers — screen readers auto-announce row/column context (standard table a11y)
- Color contrast: audit custom elements only (grid cells, validation highlights) — trust Polaris defaults for standard components
- Focus management: standard a11y patterns — after delete focus moves to next item or empty state, after create focus moves to new matrix editor

### App Store Listing
- App name: "Price Matrix"
- Tone: friendly and accessible — speaks to all merchants, emphasizes ease of use and simple pricing
- Pricing model: freemium
  - Free tier: 1 matrix with full functionality (assign products, widget, draft orders)
  - Paid tier ($9-15/mo): unlimited matrices + CSV import

### Claude's Discretion
- Exact paid tier price point within $9-15/mo range
- App Store description copy and keyword optimization
- Screenshot composition and sequence
- Security review checklist implementation details
- CSV file size limits and parsing library choice

</decisions>

<specifics>
## Specific Ideas

- CSV import as a natural premium feature — power users who need bulk import are likely paying merchants
- "Try everything, pay to scale" freemium philosophy — free tier demonstrates full value, upgrade trigger is needing more matrices

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-polish-app-store-preparation*
*Context gathered: 2026-02-06*
