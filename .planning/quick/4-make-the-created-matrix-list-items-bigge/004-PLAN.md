---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/routes/app.matrices._index.tsx
autonomous: true

must_haves:
  truths:
    - "Matrix list items are visually larger and more prominent than before"
    - "All existing functionality preserved: row click navigates to edit, delete modal works, duplicate works, empty state works"
    - "Matrix metadata (grid size, product count, last edited) still visible"
  artifacts:
    - path: "app/routes/app.matrices._index.tsx"
      provides: "Matrices list page with larger list items"
  key_links:
    - from: "app/routes/app.matrices._index.tsx"
      to: "/app/matrices/$id/edit"
      via: "row click navigation"
      pattern: "navigate.*matrices.*edit"
---

<objective>
Make the matrix list items on the matrices index page bigger and more visually prominent.

Purpose: The current IndexTable with `condensed` prop renders very compact rows that feel too small. Switching to a ResourceList/ResourceItem layout gives each matrix a larger, card-like presentation with better visual hierarchy.

Output: Updated matrices index page with larger list items.
</objective>

<execution_context>
@/Users/robinkonijnendijk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/robinkonijnendijk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/routes/app.matrices._index.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace IndexTable with ResourceList for larger matrix items</name>
  <files>app/routes/app.matrices._index.tsx</files>
  <action>
Replace the IndexTable-based layout with a ResourceList/ResourceItem layout for larger, more prominent list items. The current IndexTable with `condensed` renders tiny rows.

Implementation:
1. Replace Polaris imports: swap `IndexTable` for `ResourceList` and `ResourceItem`. Keep `Page`, `Box`, `Card`, `EmptyState`, `Text`, `Modal`, `BlockStack`, `InlineStack`, `Button`, and also add `Badge` for metadata display.

2. Replace the `rowMarkup` and `IndexTable` section with a `ResourceList` that renders `ResourceItem` components. Each ResourceItem should:
   - Use `onClick` to navigate to the matrix edit page (same `handleRowClick` logic)
   - Use `shortcutActions` for the Duplicate and Delete buttons (this puts action buttons on the right side of each item, visible on hover/focus)
   - Display the matrix name as a `Text` with `variant="headingSm"` and `fontWeight="bold"`
   - Show metadata below the name using an `InlineStack` with `Badge` components or `Text` elements showing: grid size (e.g. "3 x 4 grid"), product count (e.g. "2 products"), and last edited date

3. Structure each ResourceItem like this:
   ```tsx
   <ResourceItem
     id={matrix.id}
     onClick={() => handleRowClick(matrix.id)}
     shortcutActions={[
       {
         content: "Duplicate",
         onAction: () => handleDuplicateClick(matrix.id),
       },
       {
         content: "Delete",
         destructive: true,
         onAction: () => handleDeleteClick(matrix),
       },
     ]}
   >
     <Text as="h3" variant="headingSm" fontWeight="bold">
       {matrix.name}
     </Text>
     <Box paddingBlockStart="100">
       <InlineStack gap="400">
         <Text as="span" variant="bodySm" tone="subdued">
           {matrix.widthCount} x {matrix.heightCount} grid
         </Text>
         <Text as="span" variant="bodySm" tone="subdued">
           {matrix.productCount} {matrix.productCount === 1 ? "product" : "products"}
         </Text>
         <Text as="span" variant="bodySm" tone="subdued">
           Edited {new Date(matrix.updatedAt).toLocaleDateString()}
         </Text>
       </InlineStack>
     </Box>
   </ResourceItem>
   ```

4. Wrap the ResourceList in a Card (keep existing Card wrapper). Remove the `padding="0"` from Card since ResourceList handles its own padding.

5. Keep the `Box paddingInline` wrapper as-is for consistent page margins.

6. Remove focus management refs (`rowRefs`) and the related useEffect since ResourceList handles its own focus management. Keep the focus-to-empty-state logic for after delete (the `deletedMatrixId` + focus on `create-matrix-btn`). Simplify the useEffect: after delete, if `matrices.length === 0`, focus on the empty state button; otherwise just clear `deletedMatrixId` (ResourceList manages row focus natively).

7. The delete modal and all its logic stays exactly the same.

8. The empty state stays exactly the same.

9. The loading state for duplicate: the `shortcutActions` approach does not support a `loading` prop directly. That is acceptable since the duplicate action redirects to the new matrix edit page quickly. Remove the fetcher loading check for duplicate.

10. Remove unused imports: `IndexTable`, and `useRef`. Keep all other imports. Add `ResourceList`, `ResourceItem` imports from `@shopify/polaris`.
  </action>
  <verify>
Run `cd /Users/robinkonijnendijk/Desktop/quote-flow && npx tsc --noEmit` to confirm no TypeScript errors. Run `cd /Users/robinkonijnendijk/Desktop/quote-flow && npx vite build` to confirm the build succeeds.
  </verify>
  <done>
Matrix list page renders each matrix as a ResourceItem with: bold name as heading, metadata line below (grid size, product count, last edited), and shortcut actions for Duplicate/Delete. Items are visually larger than the old condensed IndexTable rows. All existing functionality (navigate on click, delete with modal, duplicate, empty state) works.
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors
- Build succeeds without errors
- Page still renders matrix list with all metadata
- Row click navigates to edit page
- Delete button opens confirmation modal
- Duplicate action works
- Empty state renders when no matrices exist
</verification>

<success_criteria>
Matrix list items are visually larger and more prominent, using Polaris ResourceList/ResourceItem instead of condensed IndexTable rows. All existing functionality preserved.
</success_criteria>

<output>
After completion, create `.planning/quick/4-make-the-created-matrix-list-items-bigge/004-SUMMARY.md`
</output>
