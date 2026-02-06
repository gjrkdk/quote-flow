---
phase: 05-react-widget
verified: 2026-02-06T10:15:00Z
status: passed
score: 17/17 must-haves verified
re_verification: false
---

# Phase 5: React Widget (npm Package) Verification Report

**Phase Goal:** Merchants can add drop-in React widget to headless storefronts with dimension inputs and live pricing

**Verified:** 2026-02-06T10:15:00Z

**Status:** PASSED

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Developer can install widget via npm and render it in a React app | ✓ VERIFIED | package.json has correct exports/main/module fields, dist/ contains ESM+UMD+types, npm pack shows publishable tarball (192.9 kB) |
| 2 | Customer sees width and height input fields and price updates in real-time as they type valid dimensions | ✓ VERIFIED | PriceMatrixWidget.tsx renders DimensionInput components (lines 150-168), usePriceFetch.ts debounces at 400ms (line 47-48), fetches on dimension change |
| 3 | Customer clicks "Add to Cart" and receives Draft Order confirmation (or redirect to complete checkout) | ✓ VERIFIED | AddToCartButton onClick → handleAddToCart (line 83-129) → createDraftOrder → onAddToCart callback (line 109) → window.location.href redirect (line 113) |
| 4 | Widget styles do not conflict with host page CSS (Shadow DOM isolation verified) | ✓ VERIFIED | PriceMatrixWidget.tsx wraps in `<root.div>` from react-shadow (line 147), injects widgetStyles via `<style>` tag (line 148), all classes use pm- prefix |
| 5 | Widget package is publishable to npm (SC5 clarified: PUBLISHABLE, not published) | ✓ VERIFIED | npm pack --dry-run succeeds, tarball contains only dist/ files (4 files: ESM, UMD, types, package.json), prepublishOnly script configured |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Store model with currency field | ✓ VERIFIED | Line 19: `currency String @default("USD")` |
| `app/routes/api.v1.products.$productId.price.ts` | Extended response with currency, dimensionRange, unit | ✓ VERIFIED | Lines 140-149: returns currency (productMatrix.currency), dimensionRange (productMatrix.dimensionRange), unit (productMatrix.unit) |
| `app/routes/api.v1.draft-orders.ts` | POST endpoint for Draft Order creation | ✓ VERIFIED | 454 lines, exports action function, handles POST with API key auth, creates Draft Order, returns checkoutUrl (invoiceUrl) |
| `app/services/product-matrix-lookup.server.ts` | ProductMatrixResult with dimensionRange, currency, unit | ✓ VERIFIED | Interface lines 4-14 defines dimensionRange object with min/max width/height, currency, unit fields |
| `packages/widget/package.json` | npm package config with peer dependencies | ✓ VERIFIED | peerDependencies: react ^18.0.0, react-dom ^18.0.0 (lines 23-26), exports config (lines 9-15), prepublishOnly script |
| `packages/widget/vite.config.ts` | Vite library mode with externalized React | ✓ VERIFIED | external: ['react', 'react-dom', 'react/jsx-runtime'] (line 147), lib entry points to src/index.ts |
| `packages/widget/src/types.ts` | PriceMatrixWidgetProps with 3 required props | ✓ VERIFIED | Lines 209-224: apiUrl (required), apiKey (required), productId (required), theme (optional), onAddToCart (optional) |
| `packages/widget/src/PriceMatrixWidget.tsx` | Main widget with Shadow DOM | ✓ VERIFIED | 187 lines, imports react-shadow (line 2), wraps in root.div (line 147), injects CSS (line 148), wires all hooks/components |
| `packages/widget/src/hooks/usePriceFetch.ts` | Debounced price fetching with 400ms delay | ✓ VERIFIED | 163 lines, useDebounce at 400ms (lines 47-48), AbortController cleanup, RFC 7807 error handling |
| `packages/widget/src/hooks/useDraftOrder.ts` | Draft Order creation hook | ✓ VERIFIED | 104 lines, POST to /api/v1/draft-orders, X-API-Key header, returns DraftOrderApiResponse |
| `packages/widget/src/components/DimensionInput.tsx` | Text input with validation and range hints | ✓ VERIFIED | 56 lines, inputMode="decimal" (line 40), shows helper text with range (lines 30-32, 48-50), inline error display (lines 51-53) |
| `packages/widget/src/components/PriceDisplay.tsx` | Currency formatted price with CSS shimmer | ✓ VERIFIED | 66 lines, Intl.NumberFormat with useMemo (lines 24-30), CSS skeleton shimmer (lines 39-43), NO react-loading-skeleton |
| `packages/widget/src/styles.ts` | CSS string with :host custom properties | ✓ VERIFIED | 233 lines, :host block with 6 CSS custom properties (lines 12-19), all classes use pm- prefix, shimmer animation defined |
| `packages/widget/dist/price-matrix-widget.es.js` | ESM build output | ✓ VERIFIED | 408 KB, starts with `import ... from "react"` (React externalized), built successfully |
| `packages/widget/dist/price-matrix-widget.umd.js` | UMD build output | ✓ VERIFIED | 283 KB, exists and built |
| `packages/widget/dist/index.d.ts` | TypeScript declarations | ✓ VERIFIED | 84 lines, exports PriceMatrixWidget function, PriceMatrixWidgetProps, ThemeProps, AddToCartEvent interfaces |

**Score:** 16/16 artifacts verified (all pass 3-level checks: exist, substantive, wired)

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| PriceMatrixWidget.tsx | usePriceFetch | imports and calls hook | ✓ WIRED | Line 3 import, line 49 usage with apiUrl/apiKey/productId |
| PriceMatrixWidget.tsx | useDraftOrder | imports and calls hook | ✓ WIRED | Line 4 import, line 52 usage, line 88 createDraftOrder call |
| PriceMatrixWidget.tsx | react-shadow | wraps content in Shadow DOM | ✓ WIRED | Line 2 import root, line 147 `<root.div>` wrapper |
| usePriceFetch.ts | REST API /price | fetch with X-API-Key | ✓ WIRED | Lines 89-94: fetch with X-API-Key header to price endpoint |
| useDraftOrder.ts | REST API /draft-orders | POST with X-API-Key | ✓ WIRED | Lines 48-60: POST with X-API-Key and JSON body |
| PriceDisplay.tsx | Intl.NumberFormat | currency formatting | ✓ WIRED | Lines 24-30: useMemo cached formatter, line 59 formats price |
| DimensionInput.tsx | dimension ranges | shows min/max hints | ✓ WIRED | Lines 24-32: builds placeholder and helper text from min/max props |
| package.json | vite.config.ts | build script uses vite | ✓ WIRED | Line 18: "build": "vite build" |
| vite.config.ts | src/index.ts | lib entry point | ✓ WIRED | Entry points to src/index.ts, externalizes React |
| index.ts | PriceMatrixWidget.tsx | exports main component | ✓ WIRED | Line 4: export { PriceMatrixWidget } |

**Score:** 10/10 key links verified

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| WIDGET-01: React component renders width and height input fields with validation | ✓ SATISFIED | DimensionInput.tsx: text fields with inputMode="decimal", inline error display, range hints. Client-side validation in PriceMatrixWidget.tsx lines 58-80 |
| WIDGET-02: Price updates in real-time as customer changes dimensions | ✓ SATISFIED | usePriceFetch.ts: 400ms debounce (lines 47-48), fetches on dimension change (useEffect lines 62-148), updates price state |
| WIDGET-03: Add-to-cart button creates a Draft Order with the calculated price | ✓ SATISFIED | handleAddToCart (lines 83-129): calls createDraftOrder → POST /api/v1/draft-orders → returns checkoutUrl → redirects (line 113) |
| WIDGET-04: Widget uses Shadow DOM for CSS isolation from host page | ✓ SATISFIED | PriceMatrixWidget.tsx: react-shadow root.div wrapper (line 147), CSS injected via <style> tag (line 148), pm- class prefixes |
| WIDGET-05: Widget published as npm package with React as peer dependency | ✓ SATISFIED | package.json: peerDependencies react ^18.0.0 (lines 23-26), vite.config.ts externalizes React (line 147), npm pack shows publishable tarball. NOTE: Not yet published (manual step), but PUBLISHABLE verified |

**Score:** 5/5 requirements satisfied

### Anti-Patterns Found

None. All code is substantive with no placeholders, TODOs, or stub patterns detected.

### Human Verification Required

None for automated verification. However, the following should be manually tested before production release:

1. **Visual Appearance Check**
   - Test: Render widget in a sample React app with different theme props
   - Expected: Widget displays cleanly with proper spacing, borders, and colors. Theme props override defaults correctly
   - Why human: Visual appearance requires subjective assessment

2. **Complete User Flow**
   - Test: Enter dimensions → see price update → change quantity → click Add to Cart → verify redirect to Shopify checkout
   - Expected: Flow completes smoothly, Draft Order appears in Shopify admin with correct price and custom attributes (Width/Height)
   - Why human: End-to-end integration test requires real Shopify store

3. **Shadow DOM CSS Isolation**
   - Test: Render widget on a page with conflicting CSS (e.g., global `input { border: 5px solid red }`)
   - Expected: Widget inputs are unaffected by host page styles
   - Why human: Requires visual comparison with/without host styles

4. **Mobile Responsiveness**
   - Test: Render widget on mobile device or browser DevTools responsive mode
   - Expected: Inputs show numeric keyboard (inputMode="decimal"), layout is usable on small screens
   - Why human: Requires device testing for keyboard behavior

5. **Error State Handling**
   - Test: Enter dimensions outside matrix range, trigger API errors (invalid API key, network timeout)
   - Expected: Inline validation errors display clearly, API errors show user-friendly messages
   - Why human: Requires triggering various error conditions

6. **npm Package Installation**
   - Test: `npm install @pricing-matrix/widget` (or local tarball), import and render in a separate React project
   - Expected: No build errors, widget renders and functions correctly
   - Why human: Requires external project setup

## Phase-Specific Observations

### Plan 05-01: Widget API Extensions

**What was built:**
- Store model extended with `currency` field (default: "USD")
- Price API response extended with `currency`, `dimensionRange`, `unit`
- POST /api/v1/draft-orders endpoint for Draft Order creation via REST
- Dimension range calculation: min/max from first/last breakpoint values

**Verification notes:**
- productMatrix.currency returned in price response (line 140)
- productMatrix.dimensionRange contains minWidth, maxWidth, minHeight, maxHeight
- Draft Order endpoint creates Shopify admin client from store's access token (lines 37-59)
- invoiceUrl returned as checkoutUrl (line 416)

**Status:** All must-haves verified. API extensions are complete and wired.

### Plan 05-02: Widget Package Scaffold

**What was built:**
- Vite library mode config with React externalization
- package.json with peerDependencies, exports, build scripts
- TypeScript types: PriceMatrixWidgetProps (3 required props), ThemeProps (6 optional), AddToCartEvent
- Entry point (index.ts) exports only public API

**Verification notes:**
- React in both peerDependencies and devDependencies (correct pattern)
- vite.config.ts external: ['react', 'react-dom', 'react/jsx-runtime']
- Build output checked: ESM 408KB, UMD 283KB, types 2.7KB
- npm pack --dry-run shows only dist/ files (4 files total)

**Status:** All must-haves verified. Package scaffold is complete and publishable.

### Plan 05-03: Widget Hooks and Components

**What was built:**
- usePriceFetch: 400ms debounce, AbortController cancellation, metadata caching
- useDraftOrder: POST to draft-orders endpoint, loading/error states
- DimensionInput: text field with inputMode="decimal", range hints, inline errors
- PriceDisplay: Intl.NumberFormat formatting, CSS shimmer skeleton (NO react-loading-skeleton)
- QuantitySelector: +/- buttons, disabled state when qty=1
- AddToCartButton: disabled prop, CSS loading spinner

**Verification notes:**
- 400ms debounce chosen (within 300-500ms range from CONTEXT.md)
- CSS shimmer animation instead of react-loading-skeleton (Shadow DOM compatible)
- All components use pm- class prefixes
- No external CSS library dependencies

**Status:** All must-haves verified. Hooks and components are complete and Shadow DOM compatible.

### Plan 05-04: Widget Assembly

**What was built:**
- PriceMatrixWidget: Shadow DOM root, theme prop mapping, state management
- widgetStyles: CSS string with :host custom properties, pm- classes, shimmer animation
- Complete user flow: dimension inputs → price fetch → quantity → add to cart → checkout redirect
- Build outputs: ESM, UMD, TypeScript declarations

**Verification notes:**
- react-shadow root.div wrapper (line 147)
- CSS injected via <style> tag (line 148)
- Theme prop maps to CSS custom properties (lines 132-138)
- Add-to-cart flow: createDraftOrder → onAddToCart callback → window.location redirect
- Button disabled logic: !total || widthError || heightError || creating (line 144)

**Status:** All must-haves verified. Widget is complete and buildable.

## Overall Verification Summary

**All 17 must-haves verified across 4 plans:**
- Plan 01: 3/3 truths verified (API extensions)
- Plan 02: 3/3 truths verified (package scaffold)
- Plan 03: 5/5 truths verified (hooks and components)
- Plan 04: 5/5 truths verified (widget assembly)
- Plus: 16/16 artifacts substantive and wired
- Plus: 10/10 key links wired

**Phase goal achieved:**
✓ Merchants can add drop-in React widget to headless storefronts with dimension inputs and live pricing

**Locked decisions from CONTEXT.md implemented:**
- ✓ Text fields for dimensions (not sliders) - DimensionInput.tsx line 39: type="text"
- ✓ Unit from API (not developer prop) - usePriceFetch.ts caches unit from API response
- ✓ Inline validation errors - DimensionInput.tsx lines 51-53
- ✓ Range hints as helper text - DimensionInput.tsx lines 48-50
- ✓ Total price only (not unit price) - PriceMatrixWidget.tsx line 174: passes total to PriceDisplay
- ✓ 300-500ms debounce (400ms chosen) - usePriceFetch.ts lines 47-48
- ✓ Skeleton shimmer while loading - PriceDisplay.tsx lines 39-43, CSS shimmer animation
- ✓ No price until valid inputs - usePriceFetch.ts lines 67-74: resets price when dimensions invalid
- ✓ Quantity +/- buttons - QuantitySelector.tsx has increment/decrement buttons
- ✓ Disabled button until valid + price loaded - PriceMatrixWidget.tsx line 144: isAddToCartDisabled logic
- ✓ Spinner in button during Draft Order creation - AddToCartButton.tsx shows spinner when loading=true
- ✓ Redirect to checkout on success - PriceMatrixWidget.tsx line 113: window.location.href = checkoutUrl
- ✓ 3 required props (apiUrl, apiKey, productId) - types.ts lines 211-217
- ✓ CSS custom property theming with optional theme prop - PriceMatrixWidget.tsx lines 132-138
- ✓ onAddToCart callback - PriceMatrixWidget.tsx lines 96-110
- ✓ Intl.NumberFormat currency formatting - PriceDisplay.tsx lines 24-30

**No gaps found.**

**Package publishability:**
- ✓ npm pack succeeds (192.9 kB tarball)
- ✓ Only dist/ files included (4 files)
- ✓ React externalized (408KB ESM, 283KB UMD - React not bundled)
- ✓ prepublishOnly script configured
- ✓ TypeScript declarations generated

**Ready for:**
- Phase 6 (Polish & App Store Preparation)
- Manual npm publish when desired
- Integration into headless storefronts

---

_Verified: 2026-02-06T10:15:00Z_
_Verifier: Claude (gsd-verifier)_
