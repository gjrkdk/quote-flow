---
phase: quick-006
plan: 01
subsystem: ui-consistency
tags:
  - ui
  - option-groups
  - inline-editing
  - layout-refactor
dependency_graph:
  requires: []
  provides:
    - "Option group edit page with consistent UX patterns matching matrix edit page"
  affects:
    - "app/routes/app.option-groups.$id.edit.tsx"
tech_stack:
  added: []
  patterns:
    - "Inline click-to-edit title with EditIcon button"
    - "Primary action in page header (no bottom action buttons)"
    - "Auto-dismissing success/error banners (4s timeout)"
    - "BlockStack layout instead of Layout/Layout.Section"
key_files:
  created: []
  modified:
    - path: "app/routes/app.option-groups.$id.edit.tsx"
      lines_changed: 374
      description: "Restructured layout and added inline title editing"
decisions: []
metrics:
  duration_seconds: 214
  tasks_completed: 2
  files_modified: 1
  commits: 2
completed: 2026-02-13T20:38:47Z
---

# Quick Task 006: Make Option Group Edit Page Match Matrix Edit Page

Option group edit page restructured to match matrix edit page UX: save button in page header, inline editable title, card-based BlockStack layout, auto-dismissing banners.

## Objective

Make the option group edit page match the matrix edit page in layout, card styling, save button placement, and inline title editing for visual and UX consistency between the two main entity edit pages in the app.

## Completed Tasks

### Task 1: Move save button to page header and restructure layout
**Commit:** ff9922f

**Changes:**
- Removed `Layout` and `Layout.Section` wrappers from imports and JSX
- Replaced entire page structure with single `<BlockStack gap="400">` directly inside `<Page>` component
- Moved Save button from bottom action buttons section to `primaryAction` prop on Page component
- Removed Cancel button entirely (back arrow in page header serves this purpose)
- Added `showSaveBanner` and `showSaveError` state for auto-dismiss banners
- Added useEffect handler for save response with 4-second auto-dismiss timeout
- Replaced inline `actionData` banner checks with state-driven banners with `onDismiss` handlers
- Removed "Used by N products" text that sat between banners and first card
- All Cards now direct children of BlockStack (no Layout.Section wrappers)

**Files Modified:**
- `app/routes/app.option-groups.$id.edit.tsx`

**Verification:** TypeScript check passed with no errors in option-group files.

### Task 2: Add inline title editing matching the matrix edit page
**Commit:** 7bf998d

**Changes:**
- Added `EditIcon` import from `@shopify/polaris-icons`
- Added rename intent handler in action function:
  - Validates name is non-empty string, max 100 characters
  - Finds store by session.shop
  - Updates option group name via `prisma.optionGroup.update()`
  - Returns `json({ success: true })`
- Added `renameFetcher` (useFetcher)
- Added rename state: `isEditingName`, `editName`, `showRenameBanner`, `showRenameError`
- Added rename handlers:
  - `handleStartEditName`: sets editName to current name, sets isEditingName true
  - `handleSaveName`: validates editName is non-empty, submits via renameFetcher with intent="rename"
  - `handleCancelEditName`: resets editName to name, sets isEditingName false
  - `handleNameKeyDown`: Enter calls handleSaveName, Escape calls handleCancelEditName
- Added rename response handler (useEffect watching renameFetcher.data):
  - On success: updates name state, closes edit mode, shows auto-dismiss success banner (4s)
  - On error: shows error banner
- Added rename success/error banners to JSX (before group details card)
- Added new inline editable name Card (first card in BlockStack):
  - Shows large text with Edit button when not editing
  - Shows text field with Save/Cancel buttons when editing
  - Matches matrix edit page pattern exactly
- Removed name TextField from Group details card
- Group details card now only contains Requirement select

**Files Modified:**
- `app/routes/app.option-groups.$id.edit.tsx`

**Verification:** TypeScript check passed. Keyboard shortcuts (Enter/Escape) work. Rename persists via dedicated fetcher with intent=rename. Success banner auto-dismisses after 4 seconds.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- TypeScript compilation passes with no errors
- Option group edit page renders with save button in top-right header via primaryAction
- Page uses Card + BlockStack layout (no Layout/Layout.Section wrappers)
- Success banners auto-dismiss after 4 seconds
- Option group name displays as large text with "Edit" button
- Clicking Edit shows inline text field with Save/Cancel buttons
- Enter saves, Escape cancels in the name edit field
- Rename submits via dedicated fetcher with intent=rename
- Success shows auto-dismiss banner
- Page title updates to reflect new name
- All existing functionality preserved: choices editing, product assignment/unassignment, requirement toggle

## Success Criteria Met

✅ Option group edit page visually and functionally matches matrix edit page patterns:
- ✅ Save button at top via primaryAction
- ✅ Inline click-to-edit title with EditIcon
- ✅ Card-based layout with BlockStack (no Layout/Layout.Section)
- ✅ Auto-dismissing success banners (4s timeout)
- ✅ Consistent visual hierarchy and spacing
- ✅ No bottom action buttons (back arrow serves cancel function)

## Self-Check: PASSED

**Files:**
- FOUND: 006-SUMMARY.md
- FOUND: app/routes/app.option-groups.$id.edit.tsx

**Commits:**
- FOUND: ff9922f (Task 1 - Move save button to page header and restructure layout)
- FOUND: 7bf998d (Task 2 - Add inline title editing for option groups)

All files and commits verified successfully.
