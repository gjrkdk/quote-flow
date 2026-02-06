---
phase: 06-polish-app-store-preparation
plan: 03
title: "Accessibility & Responsive UI"
subsystem: "UI/UX"
tags:
  - accessibility
  - WCAG 2.1 AA
  - ARIA
  - keyboard navigation
  - responsive design
  - Polaris Grid
dependencies:
  requires:
    - "02-admin-matrix-management (MatrixGrid component)"
    - "02-admin-matrix-management (Dashboard and matrix list routes)"
  provides:
    - "WCAG 2.1 AA compliant matrix grid editor"
    - "Full keyboard navigation for matrix grid (ARIA grid pattern)"
    - "Responsive dashboard layout (2-col desktop, 1-col tablet)"
    - "Responsive matrix list with tablet support"
  affects:
    - "06-04 (App Store submission requirements)"
tech-stack:
  added: []
  patterns:
    - "W3C ARIA grid pattern with roving tabindex"
    - "Polaris Grid responsive layout system"
key-files:
  created: []
  modified:
    - "app/components/MatrixGrid.tsx"
    - "app/routes/app._index.tsx"
    - "app/routes/app.matrices._index.tsx"
decisions:
  - id: "06-03-01"
    choice: "W3C ARIA grid pattern with roving tabindex"
    reasoning: "App Store requires WCAG 2.1 AA compliance. ARIA grid pattern provides full keyboard navigation for the matrix editor, which is the most complex interactive component."
    alternatives: "Individual tabindex on each input (would make Tab navigation slow), focus trap (doesn't match spreadsheet UX)"
  - id: "06-03-02"
    choice: "Polaris Grid for responsive dashboard layout"
    reasoning: "Built-in Shopify component with consistent breakpoints (xs/sm/md/lg/xl). Provides 2-column desktop, 1-column tablet/mobile without custom CSS."
    alternatives: "CSS Grid (more code, no Polaris consistency), Layout.Section with responsive props (less control)"
  - id: "06-03-03"
    choice: "Preserve horizontal scroll on matrix grid"
    reasoning: "Existing decision from Phase 2 (CONTEXT.md). Large grids (10+ breakpoints) need horizontal scroll on small screens. ARIA pattern doesn't conflict with scrolling."
metrics:
  duration: "2min"
  completed: "2026-02-06"
---

# Phase [06] Plan [03]: Accessibility & Responsive UI Summary

**One-liner:** WCAG 2.1 AA compliant matrix grid with full keyboard navigation (ARIA grid pattern) and responsive dashboard/matrix list (Polaris Grid)

## What Was Built

Added WCAG 2.1 AA accessibility and responsive layouts to the admin UI:

**Accessibility (MatrixGrid):**
- ARIA grid structure: `role="grid"` on table, `role="row"` on all rows, `role="columnheader"` on width breakpoints, `role="rowheader"` on height breakpoints, `role="gridcell"` on price cells
- Roving tabindex keyboard navigation: Only one cell focusable at a time (`tabIndex={0}`), all others `tabIndex={-1}`
- Full keyboard support:
  - Arrow keys: Navigate between cells (prevents default scrolling)
  - Tab/Shift+Tab: Move to next/previous cell with row wrapping
  - Enter: Enter edit mode on focused cell (focuses the input)
  - Escape: Exit edit mode (blur input, return focus to cell)
  - Home/End: Jump to first/last cell in current row
- Screen reader labels: `aria-label` on each input describing the price dimension (e.g., "Price for 300 mm width by 600 mm height")
- Focus visual indicator: 2px blue outline on focused cell (`outline: 2px solid #2c6ecb; outline-offset: -2px`)
- Focus management: Clamps focus coordinates when breakpoints removed

**Responsive Design (Dashboard & Matrix List):**
- Dashboard: Polaris Grid with 2-column desktop (md+), 1-column tablet/mobile (xs/sm)
- Matrix list: Responsive padding via Box component (`paddingInline={{ xs: "200", md: "400" }}`), condensed IndexTable for smaller screens
- Horizontal scroll preserved on matrix grid for large grids on small screens

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add ARIA grid keyboard navigation to MatrixGrid | f3eaace | app/components/MatrixGrid.tsx |
| 2 | Make dashboard and matrix list responsive | fa01f7b | app/routes/app._index.tsx, app/routes/app.matrices._index.tsx |

## Deviations from Plan

None - plan executed exactly as written.

## Key Technical Details

**ARIA Grid Pattern Implementation:**

1. **Roving tabindex state:**
   ```tsx
   const [focusedRow, setFocusedRow] = useState(0);
   const [focusedCol, setFocusedCol] = useState(0);
   ```

2. **Cell ref tracking:**
   ```tsx
   const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
   ```

3. **Programmatic focus on coordinate change:**
   ```tsx
   useEffect(() => {
     const key = `${focusedCol},${focusedRow}`;
     const cell = cellRefs.current.get(key);
     if (cell) cell.focus();
   }, [focusedRow, focusedCol]);
   ```

4. **Tab wrapping behavior:**
   - Tab at last column: Wrap to first cell of next row
   - Tab at last cell: Exit grid (allow default Tab)
   - Shift+Tab at first column: Wrap to last cell of previous row
   - Shift+Tab at first cell: Exit grid (allow default Tab)

5. **Focus clamping on breakpoint removal:**
   ```tsx
   useEffect(() => {
     const maxRow = heightBreakpoints.length - 1;
     const maxCol = widthBreakpoints.length - 1;
     if (focusedRow > maxRow) setFocusedRow(Math.max(0, maxRow));
     if (focusedCol > maxCol) setFocusedCol(Math.max(0, maxCol));
   }, [widthBreakpoints.length, heightBreakpoints.length]);
   ```

**Responsive Grid Pattern:**

Dashboard uses Polaris Grid with responsive column configuration:
```tsx
<Grid columns={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }} gap="400">
  <Grid.Cell>{/* API Key card */}</Grid.Cell>
  <Grid.Cell>{/* Draft Orders card (conditional) */}</Grid.Cell>
  <Grid.Cell>{/* Pricing Matrices card */}</Grid.Cell>
</Grid>
```

Matrix list uses Box for responsive padding and IndexTable condensed mode:
```tsx
<Box paddingInline={{ xs: "200", md: "400" }}>
  <IndexTable condensed>
    {/* ... */}
  </IndexTable>
</Box>
```

## Verification Results

**Must-Haves Verification:**

All 8 must-haves verified by code inspection:

1. ✅ Arrow keys move focus between matrix grid cells (`handleCellKeyDown` with ArrowRight/Left/Down/Up)
2. ✅ Tab key moves focus to next cell in grid with row wrapping (`Tab` case in `handleCellKeyDown`)
3. ✅ Enter key enters edit mode on focused cell (`Enter` case focuses input)
4. ✅ Escape key exits edit mode (`Escape` case blurs input, refocuses cell)
5. ✅ Screen readers announce row and column headers (`aria-label` on each input)
6. ✅ Dashboard stacks to single column on tablet-width screens (`Grid columns={{ xs: 1 }}`)
7. ✅ Matrix list goes full-width on tablet screens (`Box paddingInline` responsive)
8. ✅ Matrix grid scrolls horizontally on small screens (`overflowX: "auto"` preserved)

**Artifact Verification:**

- ✅ `app/components/MatrixGrid.tsx` contains `role="grid"`
- ✅ `app/routes/app._index.tsx` contains `Grid` component
- ✅ `app/routes/app.matrices._index.tsx` modified with responsive padding
- ✅ Key link: ARIA grid pattern to keyboard handlers (`onKeyDown.*ArrowRight|ArrowLeft|ArrowDown|ArrowUp`)

## Decisions Made

**Decision 06-03-01: W3C ARIA grid pattern with roving tabindex**

App Store requires WCAG 2.1 AA compliance. The matrix grid is the most complex interactive component and needs full keyboard navigation per W3C ARIA grid pattern. Roving tabindex ensures only one cell is tabbable at a time (faster Tab navigation than tabbing through all 100+ cells in a large grid). Matches spreadsheet UX expectations from CONTEXT.md.

**Decision 06-03-02: Polaris Grid for responsive dashboard layout**

Using Shopify's built-in Grid component provides consistent breakpoints and responsive behavior without custom CSS. The xs/sm/md/lg/xl breakpoint system is standard across Shopify admin and provides 2-column desktop, 1-column tablet/mobile automatically.

**Decision 06-03-03: Preserve horizontal scroll on matrix grid**

Existing decision from Phase 2 (CONTEXT.md). Large grids (10+ breakpoints) need horizontal scroll on small screens. ARIA grid pattern doesn't conflict with scrolling - arrow keys navigate cells, horizontal scroll remains available when keyboard focus is outside grid.

## Next Phase Readiness

**Blockers:** None

**Dependencies satisfied for Phase 6 Plan 4:**
- ✅ WCAG 2.1 AA accessibility implemented (required for App Store submission)
- ✅ Responsive UI for desktop and tablet (App Store submission requirement)

**Concerns:** None

## Files Modified

### app/components/MatrixGrid.tsx
- Added React imports: `useState`, `useEffect`, `useRef`
- Added roving tabindex state: `focusedRow`, `focusedCol`, `cellRefs`
- Added focus clamping effect on breakpoint changes
- Added programmatic focus effect on coordinate changes
- Added `handleCellKeyDown` handler with Arrow/Tab/Enter/Escape/Home/End support
- Added ARIA attributes: `role="grid"`, `aria-label`, `role="row"`, `role="columnheader"`, `role="rowheader"`, `role="gridcell"`
- Added roving tabindex to cells: `tabIndex={isFocused ? 0 : -1}`
- Added cell ref tracking
- Added focus outline styling on focused cell
- Added `aria-label` to each price input
- Removed inline focus/blur handlers on inputs (replaced with cell-level focus management)

### app/routes/app._index.tsx
- Added `Grid` import from @shopify/polaris
- Wrapped cards in `Grid` with `columns={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}` and `gap="400"`
- Wrapped API Key card in `Grid.Cell`
- Wrapped Draft Orders card (conditional) in `Grid.Cell`
- Wrapped Pricing Matrices card in `Grid.Cell`

### app/routes/app.matrices._index.tsx
- Added `Box` import from @shopify/polaris
- Wrapped IndexTable in `Box` with `paddingInline={{ xs: "200", md: "400" }}`
- Added `condensed` prop to IndexTable

## Self-Check: PASSED

All files created as documented:
- No new files created (modification-only plan)

All commits exist:
- ✅ f3eaace (Task 1 - ARIA grid navigation)
- ✅ fa01f7b (Task 2 - Responsive layouts)
