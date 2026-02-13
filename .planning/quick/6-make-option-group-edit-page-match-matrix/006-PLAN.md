---
phase: quick-006
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/routes/app.option-groups.$id.edit.tsx
autonomous: true
must_haves:
  truths:
    - "Option group edit page has Save button in the top-right page header (primaryAction), not at the bottom"
    - "Option group name is displayed as large text with an Edit button, clicking it reveals an inline text field with Save/Cancel"
    - "Renaming submits via a dedicated fetcher with intent=rename, shows auto-dismiss success banner"
    - "Page layout uses BlockStack directly (like matrix edit page), not Layout/Layout.Section wrappers"
  artifacts:
    - path: "app/routes/app.option-groups.$id.edit.tsx"
      provides: "Redesigned option group edit page matching matrix edit page patterns"
  key_links:
    - from: "app/routes/app.option-groups.$id.edit.tsx"
      to: "Page primaryAction"
      via: "primaryAction prop on Page component"
      pattern: "primaryAction.*Button.*Save"
---

<objective>
Make the option group edit page match the matrix edit page in layout, card styling, save button placement, and inline title editing.

Purpose: Visual and UX consistency between the two main entity edit pages in the app.
Output: Updated `app/routes/app.option-groups.$id.edit.tsx` matching matrix edit page patterns.
</objective>

<execution_context>
@/Users/robinkonijnendijk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/robinkonijnendijk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/routes/app.matrices.$id.edit.tsx (reference implementation — inline title editing, save at top, card layout, BlockStack structure)
@app/routes/app.option-groups.$id.edit.tsx (file to modify)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Move save button to page header and restructure layout</name>
  <files>app/routes/app.option-groups.$id.edit.tsx</files>
  <action>
Restructure the option group edit page to match the matrix edit page layout:

1. **Move Save button to primaryAction:** Replace the bottom action buttons section (lines 501-516, the Layout.Section with Cancel and Save buttons) with a `primaryAction` prop on the `Page` component, matching the matrix edit page pattern:
   ```tsx
   primaryAction={
     <Button
       variant="primary"
       onClick={handleSubmit}
       loading={isSubmitting}
       disabled={!name.trim() || choices.length === 0 || isSubmitting}
     >
       Save
     </Button>
   }
   ```
   Remove the Cancel button entirely (back arrow in page header serves this purpose).

2. **Remove Layout/Layout.Section wrappers:** Replace the `<Layout>` + `<Layout.Section>` structure with a single `<BlockStack gap="400">` directly inside the `<Page>` component, exactly like the matrix edit page does. Remove `Layout` from the Polaris imports since it will no longer be used.

3. **Move banners inside the BlockStack:** Success and error banners should be direct children of the BlockStack (not wrapped in Layout.Section), matching the matrix edit page pattern. Add auto-dismiss behavior for the success banner:
   - Add `showSaveBanner` state (boolean, default false) and `showSaveError` state (string | null, default null)
   - In a useEffect watching `fetcher.data`: on success set `showSaveBanner = true` with `setTimeout(() => setShowSaveBanner(false), 4000)`, on error set `showSaveError` to the error message
   - Replace the current inline `actionData` banner checks with these state-driven banners (with `onDismiss` handlers like the matrix page)

4. **Remove the "Used by N products" text** that sits between banners and the first card — this info is not prominent on the matrix page and clutters the layout. (The product assignment section at the bottom already shows this context.)
  </action>
  <verify>Run `npx tsc --noEmit` — no TypeScript errors. Visually: save button should appear in the page header bar (top right), no Layout.Section wrappers remain, banners auto-dismiss after 4 seconds.</verify>
  <done>Save button is in the page header via primaryAction prop. Page uses BlockStack layout (no Layout/Layout.Section). Success banners auto-dismiss after 4 seconds.</done>
</task>

<task type="auto">
  <name>Task 2: Add inline title editing matching the matrix edit page</name>
  <files>app/routes/app.option-groups.$id.edit.tsx</files>
  <action>
Add inline click-to-edit title functionality, following the exact pattern from the matrix edit page (lines 568-571, 887-939, 991-1029):

1. **Add EditIcon import:** Add `import { EditIcon } from "@shopify/polaris-icons";`

2. **Add rename state and fetcher:**
   ```tsx
   const renameFetcher = useFetcher<typeof action>();
   const [isEditingName, setIsEditingName] = useState(false);
   const [editName, setEditName] = useState(name);
   const [showRenameBanner, setShowRenameBanner] = useState(false);
   const [showRenameError, setShowRenameError] = useState<string | null>(null);
   ```

3. **Add rename handlers** (copy pattern from matrix edit page):
   - `handleStartEditName`: sets `editName` to current `name`, sets `isEditingName` to true
   - `handleSaveName`: validates `editName.trim()` is non-empty, submits via `renameFetcher` with `intent: "rename"` and `name: editName.trim()`
   - `handleCancelEditName`: resets `editName` to `name`, sets `isEditingName` to false
   - `handleNameKeyDown`: Enter calls `handleSaveName`, Escape calls `handleCancelEditName`

4. **Add rename action handler in the `action` function:** Add a new `if (intent === "rename")` block (before the existing save block), matching the matrix page pattern:
   - Validate name is non-empty string, max 100 chars
   - Find store by session.shop
   - Call `updateOptionGroup(id, store.id, { name, requirement: undefined, choices: undefined })` — or more simply, do a direct prisma update: `prisma.optionGroup.update({ where: { id, storeId: store.id }, data: { name } })`
   - Return `json({ success: true })`

5. **Add rename response handler** (useEffect watching renameFetcher.data):
   - On success: update `name` state with `editName`, set `isEditingName` false, show auto-dismiss success banner (4s)
   - On error: show error banner

6. **Replace the "Group details" Card:** Remove the TextField for "Group name" from the first Card. Instead, add a new Card BEFORE the group details card (first child of BlockStack) that contains the inline editable name, matching the matrix page exactly:
   ```tsx
   <Card>
     <BlockStack gap="300">
       <Text as="h2" variant="headingMd">Option group name</Text>
       {isEditingName ? (
         <BlockStack gap="300">
           <div onKeyDown={handleNameKeyDown}>
             <TextField label="" value={editName} onChange={setEditName} autoComplete="off" autoFocus />
           </div>
           <InlineStack gap="200">
             <Button variant="primary" onClick={handleSaveName}
               loading={renameFetcher.state === "submitting"}
               disabled={!editName.trim() || renameFetcher.state === "submitting"}>
               Save
             </Button>
             <Button onClick={handleCancelEditName}>Cancel</Button>
           </InlineStack>
         </BlockStack>
       ) : (
         <InlineStack gap="200" blockAlign="center">
           <Text as="p" variant="headingLg">{name}</Text>
           <Button variant="plain" icon={EditIcon} onClick={handleStartEditName}>Edit</Button>
         </InlineStack>
       )}
     </BlockStack>
   </Card>
   ```

7. **Keep the existing Card** with just the Requirement select (remove the name TextField from it since it moved to the inline edit card).
  </action>
  <verify>Run `npx tsc --noEmit` — no TypeScript errors. Test: option group name displays as large text with "Edit" button. Clicking Edit shows text field with Save/Cancel. Enter saves, Escape cancels. Success shows auto-dismiss banner. Page title updates to reflect new name.</verify>
  <done>Option group name is editable inline via click-to-edit pattern matching the matrix edit page. Rename persists to database via dedicated fetcher with intent=rename. Keyboard shortcuts (Enter/Escape) work. Success/error banners display with auto-dismiss.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- Option group edit page renders with save button in top-right header
- Page uses Card + BlockStack layout (no Layout.Section)
- Clicking option group name's Edit button shows inline text field
- Saving a new name persists and shows auto-dismiss success banner
- Enter/Escape keyboard shortcuts work in the name edit field
- All existing functionality preserved: choices editing, product assignment/unassignment, requirement toggle
</verification>

<success_criteria>
Option group edit page visually and functionally matches the matrix edit page patterns: save button at top via primaryAction, inline click-to-edit title with EditIcon, Card-based layout with BlockStack, auto-dismissing success banners.
</success_criteria>

<output>
After completion, create `.planning/quick/6-make-option-group-edit-page-match-matrix/006-SUMMARY.md`
</output>
