# Phase 14: Widget Integration - Research

**Researched:** 2026-02-10
**Domain:** React widget development, accessible form controls, live price updates
**Confidence:** HIGH

## Summary

Phase 14 extends the existing React widget (`packages/widget/`) to support option groups with accessible dropdown selects, live price updates, and price modifier displays. The widget already has a mature architecture using React 18, Shadow DOM for CSS isolation, debounced price fetching, and a complete component library. This phase adds option group dropdowns that integrate with Phase 13's REST API extensions (`/api/v1/products/:productId/price?options=...`).

The research reveals three viable paths for accessible dropdowns: (1) native HTML `<select>` with progressive enhancement, (2) headless UI libraries (Radix UI, Headless UI, React Aria), or (3) custom ARIA implementation. Given the Shadow DOM environment, existing widget patterns (no external dependencies beyond `use-debounce` and `react-shadow`), and backward compatibility requirements, **native HTML `<select>` with progressive enhancement** is the recommended approach. It provides built-in accessibility, works reliably in Shadow DOM, requires zero additional dependencies, and degrades gracefully.

**Primary recommendation:** Use native HTML `<select>` elements for option group dropdowns, extend `usePriceFetch` to accept option selections, format price modifiers with `Intl.NumberFormat`, and maintain backward compatibility by rendering options only when product has assigned option groups.

## Standard Stack

### Core (Already in Place)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.2.0 | UI framework | Widget already built with React 18 |
| react-shadow | 20.0.0 | Shadow DOM wrapper | Already used for CSS isolation |
| use-debounce | 10.0.0 | Input debouncing | Already used in `usePriceFetch` |
| TypeScript | 5.3.0 | Type safety | Widget is fully typed |

### Supporting (No Additions Needed)
No new libraries required. The existing stack provides all necessary capabilities:
- Native `<select>` for accessible dropdowns (built-in to HTML)
- `Intl.NumberFormat` for currency formatting (built-in to JavaScript)
- Existing debounce patterns via `use-debounce`
- Existing fetch patterns via `usePriceFetch` hook

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<select>` | Radix UI Select | Better customization, but adds 50KB dependency and Shadow DOM complexity |
| Native `<select>` | Headless UI Listbox | More control over styling, but requires Tailwind CSS and external deps |
| Native `<select>` | React Aria useSelect | Industry-standard accessibility, but 200KB+ dependency for marginal UX gains |
| Manual JSON in URL | Structured param encoding | URL-encoding JSON works, simpler than custom serialization |

**Rationale for Native `<select>`:**
- Built-in keyboard navigation (Arrow Up/Down, Home, End, type-to-search)
- Built-in ARIA semantics (no manual role/aria-* attributes needed)
- Zero bundle size impact
- Works reliably in Shadow DOM (no portal/teleport complications)
- Consistent cross-browser behavior
- Mobile-friendly native pickers on iOS/Android
- Widget already uses simple, unstyled patterns (no design system to match)

**Installation:**
```bash
# No new dependencies required
```

## Architecture Patterns

### Recommended Project Structure
```
packages/widget/src/
├── components/
│   ├── DimensionInput.tsx       # Existing
│   ├── QuantitySelector.tsx     # Existing
│   ├── PriceDisplay.tsx         # Existing (extend for breakdown)
│   ├── AddToCartButton.tsx      # Existing
│   ├── OptionGroupSelect.tsx    # NEW: dropdown for single option group
│   └── PriceModifierLabel.tsx   # NEW: "+$15.00" or "+20%" display
├── hooks/
│   ├── usePriceFetch.ts         # EXTEND: accept optionSelections
│   ├── useDraftOrder.ts         # EXTEND: include options in POST
│   └── useOptionGroups.ts       # NEW: fetch option groups for product
├── types.ts                     # EXTEND: add option types
├── styles.ts                    # EXTEND: add select styles
└── PriceMatrixWidget.tsx        # EXTEND: render option selects
```

### Pattern 1: Native Select Component
**What:** Accessible dropdown using HTML `<select>` with progressive enhancement
**When to use:** When accessibility, reliability, and simplicity outweigh custom styling needs

**Example:**
```typescript
interface OptionGroupSelectProps {
  group: OptionGroup;
  value: string | null;
  onChange: (choiceId: string) => void;
  currency: string;
}

export function OptionGroupSelect({ group, value, onChange, currency }: OptionGroupSelectProps) {
  const formatter = useMemo(
    () => new Intl.NumberFormat(navigator.language, { style: 'currency', currency }),
    [currency]
  );

  return (
    <div className="pm-option-group">
      <label htmlFor={`option-${group.id}`} className="pm-option-label">
        {group.name}
        {group.requirement === 'REQUIRED' && ' *'}
      </label>
      <select
        id={`option-${group.id}`}
        className="pm-option-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={group.requirement === 'REQUIRED'}
      >
        {group.requirement === 'OPTIONAL' && (
          <option value="">None</option>
        )}
        {group.choices.map((choice) => (
          <option key={choice.id} value={choice.id}>
            {choice.label} {formatModifier(choice, formatter)}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatModifier(choice: OptionChoice, formatter: Intl.NumberFormat): string {
  if (choice.modifierValue === 0) return '';
  if (choice.modifierType === 'FIXED') {
    const sign = choice.modifierValue > 0 ? '+' : '';
    return `(${sign}${formatter.format(choice.modifierValue / 100)})`;
  }
  // PERCENTAGE: basis points to percent
  const percent = (choice.modifierValue / 100).toFixed(0);
  const sign = choice.modifierValue > 0 ? '+' : '';
  return `(${sign}${percent}%)`;
}
```

### Pattern 2: Extended usePriceFetch Hook
**What:** Extend existing hook to accept option selections and include them in API calls
**When to use:** When widget needs to fetch prices with option modifiers

**Example:**
```typescript
interface OptionSelection {
  optionGroupId: string;
  choiceId: string;
}

interface UsePriceFetchOptions {
  apiUrl: string;
  apiKey: string;
  productId: string;
  optionSelections?: OptionSelection[]; // NEW
}

export function usePriceFetch(
  options: UsePriceFetchOptions,
  quantity: number = 1
): UsePriceFetchReturn {
  const { apiUrl, apiKey, productId, optionSelections = [] } = options;

  // ... existing width/height state

  // Fetch price when debounced dimensions OR option selections change
  useEffect(() => {
    // ... existing validation

    const fetchPrice = async () => {
      const url = new URL(`${apiUrl}/api/v1/products/${productId}/price`);
      url.searchParams.set('width', debouncedWidth);
      url.searchParams.set('height', debouncedHeight);
      url.searchParams.set('quantity', String(quantity));

      // NEW: Add options parameter if selections exist
      if (optionSelections.length > 0) {
        const optionsJson = JSON.stringify({ selections: optionSelections });
        url.searchParams.set('options', optionsJson);
      }

      // ... existing fetch logic
    };

    fetchPrice();
  }, [debouncedWidth, debouncedHeight, quantity, optionSelections, /* ... */]);

  // ... return extended with basePrice, optionModifiers
}
```

### Pattern 3: Option Groups Fetch Hook
**What:** Fetch option groups assigned to a product (one-time on mount)
**When to use:** Widget needs to know which option groups to display for a product

**Example:**
```typescript
interface UseOptionGroupsOptions {
  apiUrl: string;
  apiKey: string;
  productId: string;
}

interface UseOptionGroupsReturn {
  groups: OptionGroup[];
  loading: boolean;
  error: string | null;
}

export function useOptionGroups(options: UseOptionGroupsOptions): UseOptionGroupsReturn {
  const { apiUrl, apiKey, productId } = options;
  const [groups, setGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/products/${productId}/options`,
          { headers: { 'X-API-Key': apiKey } }
        );

        if (!response.ok) {
          if (response.status === 404) {
            // No option groups assigned - not an error, just empty
            setGroups([]);
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch option groups');
        }

        const data = await response.json();
        setGroups(data.optionGroups ?? []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
        setLoading(false);
      }
    };

    fetchGroups();
  }, [apiUrl, apiKey, productId]);

  return { groups, loading, error };
}
```

### Pattern 4: Backward Compatibility Strategy
**What:** Widget works with products that have no option groups (Phase 4-13 behavior)
**When to use:** Ensure existing widget users are not broken by Phase 14 changes

**Strategy:**
1. **Fetch option groups on mount** - if endpoint returns 404 or empty array, render no option UI
2. **Conditional rendering** - only render option selects if `groups.length > 0`
3. **Optional API parameter** - omit `options` query param if no selections made
4. **Response compatibility** - parse `basePrice` and `optionModifiers` if present, ignore if absent
5. **Type safety** - all option-related types are optional in widget props

**Example:**
```typescript
export function PriceMatrixWidget(props: PriceMatrixWidgetProps) {
  const { apiUrl, apiKey, productId } = props;

  // Fetch option groups (may be empty)
  const { groups, loading: groupsLoading } = useOptionGroups({ apiUrl, apiKey, productId });

  // Option selections state (only used if groups exist)
  const [selections, setSelections] = useState<OptionSelection[]>([]);

  // Pass selections to price hook (empty array if no groups)
  const { price, total, basePrice, optionModifiers } = usePriceFetch(
    { apiUrl, apiKey, productId, optionSelections: selections },
    quantity
  );

  return (
    <root.div>
      <style>{widgetStyles}</style>
      <div className="pm-widget">
        <DimensionInput label="Width" {...widthProps} />
        <DimensionInput label="Height" {...heightProps} />

        {/* Only render option UI if groups exist */}
        {groups.length > 0 && groups.map((group) => (
          <OptionGroupSelect
            key={group.id}
            group={group}
            value={selections.find(s => s.optionGroupId === group.id)?.choiceId ?? null}
            onChange={(choiceId) => {
              // Update selections array
              setSelections(prev => {
                const filtered = prev.filter(s => s.optionGroupId !== group.id);
                return [...filtered, { optionGroupId: group.id, choiceId }];
              });
            }}
          />
        ))}

        <QuantitySelector quantity={quantity} onChange={setQuantity} />

        {/* Price display shows breakdown if optionModifiers present */}
        <PriceDisplay
          price={total}
          basePrice={basePrice}
          modifiers={optionModifiers}
          currency={currency}
          loading={priceLoading}
          error={priceError}
        />

        <AddToCartButton onClick={handleAddToCart} disabled={isDisabled} />
      </div>
    </root.div>
  );
}
```

### Anti-Patterns to Avoid
- **Don't use external UI libraries**: Widget uses Shadow DOM and has no design system dependencies (Material UI, Ant Design, etc.)
- **Don't create custom ARIA dropdowns**: Native `<select>` handles all keyboard/screen reader needs
- **Don't debounce option selections**: Options are discrete choices (not text input), apply immediately
- **Don't fetch option groups on every render**: Fetch once on mount, option groups don't change during session
- **Don't block price fetches on option groups loading**: Dimensions can be entered before options load

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible dropdown with keyboard nav | Custom div-based dropdown with manual ARIA | Native HTML `<select>` | Handles focus management, keyboard shortcuts (type-to-search, arrow keys), screen reader announcements, mobile native pickers |
| Currency formatting with locale support | String interpolation with `$` prefix | `Intl.NumberFormat` | Handles thousands separators, decimal places, currency symbols, RTL languages, locale-specific formats |
| Price modifier display (+15%, -$5.00) | Manual string formatting | `Intl.NumberFormat` + sign logic | Consistent with price display, handles negative values, respects locale |
| Debounced input handling | setTimeout + manual cleanup | `use-debounce` library (already used) | Handles cleanup, re-renders, edge cases, typed return values |
| Shadow DOM CSS injection | External stylesheets or CSS imports | Inline `<style>` string | Vite library mode doesn't support CSS imports, inline string works reliably |

**Key insight:** Browser built-ins (HTML `<select>`, `Intl.NumberFormat`) are more reliable, accessible, and performant than custom implementations. The widget's constraint (Shadow DOM, no external dependencies) actually steers toward simpler, better solutions.

## Common Pitfalls

### Pitfall 1: JSON in Query String Encoding
**What goes wrong:** Passing option selections as query parameter requires JSON encoding, which can break if not URL-encoded properly
**Why it happens:** `JSON.stringify()` produces unencoded JSON with `{`, `[`, `:` characters that are not URL-safe
**How to avoid:** Use `encodeURIComponent()` on the JSON string before adding to URL, or rely on `URLSearchParams.set()` which auto-encodes
**Warning signs:** 400 Bad Request from API, garbled option data in network tab

**Example:**
```typescript
// WRONG: Manual URL construction without encoding
const url = `${apiUrl}/api/v1/products/${productId}/price?options=${JSON.stringify({selections})}`;

// RIGHT: URLSearchParams handles encoding automatically
const url = new URL(`${apiUrl}/api/v1/products/${productId}/price`);
url.searchParams.set('options', JSON.stringify({ selections })); // auto-encoded
```

### Pitfall 2: Shadow DOM and External Libraries
**What goes wrong:** UI libraries (Radix UI, Headless UI, Material UI) that use React portals don't render correctly inside Shadow DOM
**Why it happens:** Portals render to `document.body` by default, which is outside the Shadow DOM boundary
**How to avoid:** Use native HTML elements or libraries explicitly designed for Shadow DOM (rare), or accept that custom styling is limited
**Warning signs:** Dropdown menus render outside widget container, styles don't apply, z-index issues

**Example:**
```typescript
// WRONG: Radix UI Select with portals
<Select.Root>
  <Select.Trigger />
  <Select.Portal> {/* Renders to document.body, outside Shadow DOM */}
    <Select.Content />
  </Select.Portal>
</Select.Root>

// RIGHT: Native select stays within Shadow DOM
<select className="pm-option-select">
  <option value="1">Choice 1</option>
</select>
```

### Pitfall 3: Debouncing Discrete Selections
**What goes wrong:** Applying debounce to option dropdown changes delays price updates unnecessarily
**Why it happens:** Copy-pasting debounce pattern from text inputs (width/height) to discrete controls
**How to avoid:** Only debounce continuous inputs (text fields), update immediately for discrete controls (select, buttons)
**Warning signs:** Price updates lag behind option selections, confusing UX

**Example:**
```typescript
// WRONG: Debouncing discrete selection
const [selection, setSelection] = useState('');
const [debouncedSelection] = useDebounce(selection, 400); // unnecessary delay

// RIGHT: Immediate update for discrete selection
const [selections, setSelections] = useState<OptionSelection[]>([]);
useEffect(() => {
  // Fetch price immediately when selections change
  fetchPrice(width, height, selections);
}, [width, height, selections]);
```

### Pitfall 4: Cents/Dollars Conversion Errors
**What goes wrong:** API returns prices in cents (integer), widget displays them as cents instead of dollars
**Why it happens:** Forgetting to divide by 100 when formatting with `Intl.NumberFormat`
**How to avoid:** Always divide by 100 before passing to `Intl.NumberFormat`, document units clearly in types
**Warning signs:** Prices display as $1500.00 instead of $15.00

**Example:**
```typescript
// WRONG: Formatting cents directly
formatter.format(1500) // "$1,500.00" (incorrect, should be $15.00)

// RIGHT: Convert cents to dollars before formatting
formatter.format(1500 / 100) // "$15.00" (correct)

// BETTER: Type safety to prevent confusion
interface PriceInCents {
  _brand: 'cents';
  value: number;
}
function formatCents(cents: PriceInCents, formatter: Intl.NumberFormat): string {
  return formatter.format(cents.value / 100);
}
```

### Pitfall 5: Missing Option Group Endpoint
**What goes wrong:** Widget needs to fetch option groups for a product, but REST API has no endpoint
**Why it happens:** Phase 13 implemented price/draft-order extensions but not option groups list endpoint
**How to avoid:** Create `GET /api/v1/products/:productId/options` endpoint before widget integration, or widget will have no data to render
**Warning signs:** Widget can't display option dropdowns, 404 errors in browser console

**Required for Phase 14:** New REST API endpoint must be created:
```typescript
// app/routes/api.v1.products.$productId.options.ts
export async function loader({ request, params }: LoaderFunctionArgs) {
  const store = await authenticateApiKey(request);
  const productId = normalizeProductId(params.productId);

  const groups = await getProductOptionGroups(productId, store.id);
  if (!groups) {
    return json({ optionGroups: [] }, { status: 200 }); // empty, not 404
  }

  return json({ optionGroups: groups });
}
```

## Code Examples

Verified patterns from official sources:

### Accessible Native Select
```typescript
// Pattern: Native HTML select with ARIA labels and required validation
// Source: MDN Web Docs + WAI-ARIA Authoring Practices
interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}

export function Select({ id, label, value, onChange, options, required }: SelectProps) {
  return (
    <div>
      <label htmlFor={id}>{label} {required && '*'}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-required={required}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Currency Formatting with Intl.NumberFormat
```typescript
// Pattern: Cents to dollars conversion with locale-aware formatting
// Source: MDN Intl.NumberFormat documentation
function formatPrice(cents: number, currency: string): string {
  const formatter = new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(cents / 100);
}

// Example: formatPrice(1500, 'USD') => "$15.00"
// Example: formatPrice(1500, 'EUR') => "15,00 €" (German locale)
```

### Price Modifier Formatting
```typescript
// Pattern: Display "+$15.00" or "+20%" based on modifier type
// Source: Phase 13 option-price-calculator.server.ts types
function formatModifier(
  type: 'FIXED' | 'PERCENTAGE',
  value: number,
  currency: string
): string {
  if (value === 0) return '';

  const sign = value > 0 ? '+' : '';

  if (type === 'FIXED') {
    const formatter = new Intl.NumberFormat(navigator.language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${sign}${formatter.format(value / 100)}`;
  }

  // PERCENTAGE: basis points (10000 = 100%) to percent
  const percent = (value / 100).toFixed(0);
  return `${sign}${percent}%`;
}

// Example: formatModifier('FIXED', 1500, 'USD') => "+$15.00"
// Example: formatModifier('PERCENTAGE', 1000, 'USD') => "+10%"
// Example: formatModifier('FIXED', -500, 'USD') => "-$5.00"
```

### Option Selection State Management
```typescript
// Pattern: Manage array of option selections, update/replace on change
// Source: React useState patterns
interface OptionSelection {
  optionGroupId: string;
  choiceId: string;
}

function useOptionSelections() {
  const [selections, setSelections] = useState<OptionSelection[]>([]);

  const updateSelection = useCallback((groupId: string, choiceId: string) => {
    setSelections(prev => {
      // Remove previous selection for this group
      const filtered = prev.filter(s => s.optionGroupId !== groupId);
      // Add new selection
      return [...filtered, { optionGroupId: groupId, choiceId }];
    });
  }, []);

  const clearSelection = useCallback((groupId: string) => {
    setSelections(prev => prev.filter(s => s.optionGroupId !== groupId));
  }, []);

  return { selections, updateSelection, clearSelection };
}
```

### Shadow DOM Style Injection
```typescript
// Pattern: Inline style string for Shadow DOM CSS isolation
// Source: packages/widget/src/styles.ts (existing pattern)
export const widgetStyles = `
  /* Native select styling */
  .pm-option-group {
    margin-bottom: 16px;
  }

  .pm-option-label {
    display: block;
    font-weight: 600;
    margin-bottom: 6px;
    font-size: var(--pm-font-size);
    color: var(--pm-text-color);
  }

  .pm-option-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--pm-border-color);
    border-radius: var(--pm-border-radius);
    font-size: var(--pm-font-size);
    font-family: inherit;
    color: var(--pm-text-color);
    background: white;
    cursor: pointer;
  }

  .pm-option-select:focus {
    outline: none;
    border-color: var(--pm-primary-color);
    box-shadow: 0 0 0 1px var(--pm-primary-color);
  }
`;

// Inject in Shadow DOM
<root.div>
  <style>{widgetStyles}</style>
  <div className="pm-widget">
    {/* components */}
  </div>
</root.div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom ARIA dropdowns with div/button | Native HTML `<select>` with progressive enhancement | 2023-2024 | Simpler implementations, better mobile UX, native accessibility |
| Third-party date pickers for mobile | Native `<input type="date">` | 2020-2023 | Now universally supported, better UX on mobile devices |
| React Portal for dropdowns | Shadow DOM-aware positioning or native elements | 2024-2025 | Shadow DOM adoption requires portal-free solutions |
| Currency string manipulation | `Intl.NumberFormat` API | 2019-2021 | Locale support, proper formatting, handles edge cases |
| lodash debounce + useCallback | Specialized hooks (`use-debounce`) | 2021-2023 | Better React integration, automatic cleanup, TypeScript support |

**Deprecated/outdated:**
- **React class components with lifecycle methods**: Use functional components with hooks (React 16.8+, 2019)
- **componentWillMount for data fetching**: Use `useEffect` for side effects (modern React pattern)
- **Manual ARIA implementation for native HTML equivalents**: Native elements have built-in semantics (WCAG 2.1 guidelines)

## Open Questions

1. **Option Groups REST API Endpoint**
   - What we know: `getProductOptionGroups()` service exists in `option-group.server.ts` (Phase 11)
   - What's unclear: No REST API endpoint exposes this service to external clients
   - Recommendation: Create `GET /api/v1/products/:productId/options` endpoint as first task in Phase 14 plan

2. **Default Option Values**
   - What we know: `OptionChoice` has `isDefault` boolean field in schema
   - What's unclear: Should widget pre-select default choices on mount, or leave all dropdowns empty?
   - Recommendation: Pre-select defaults for REQUIRED groups, leave OPTIONAL groups empty (better UX, matches form patterns)

3. **Price Breakdown Display Strategy**
   - What we know: API returns `basePrice` and `optionModifiers[]` when options used
   - What's unclear: Should widget show detailed breakdown (base + modifiers = total) or just final price?
   - Recommendation: Show only final price for simplicity, optionally add "Show breakdown" toggle in future phase (out of scope for MVP)

4. **Option Groups Loading State**
   - What we know: Option groups fetch is separate from initial price fetch
   - What's unclear: Should widget block all interaction until groups load, or allow dimension entry immediately?
   - Recommendation: Allow dimension entry immediately, show skeleton/loading for option section only (progressive loading, better perceived performance)

5. **Percentage Modifier Display**
   - What we know: API stores percentage as basis points (1000 = 10%), widget needs to display as human-readable
   - What's unclear: Should widget show "10%" or "10.0%" or "10.00%"?
   - Recommendation: Show whole number percentages without decimals (e.g., "10%"), matches common e-commerce patterns

## Sources

### Primary (HIGH confidence)
- Existing widget codebase: `packages/widget/src/` - architecture, patterns, styling approach
- Phase 13 implementation: `app/routes/api.v1.products.$productId.price.ts` - API response format
- Phase 13 calculator: `app/services/option-price-calculator.server.ts` - modifier types, basis points
- Prisma schema: `prisma/schema.prisma` - `OptionGroup`, `OptionChoice`, `ProductOptionGroup` models
- MDN Web Docs: [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - currency formatting
- MDN Web Docs: [Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) - Shadow DOM behavior

### Secondary (MEDIUM confidence)
- [React Aria useSelect](https://react-aria.adobe.com/Select/useSelect) - accessible dropdown patterns (Adobe official docs)
- [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select) - headless UI primitives (official docs)
- [Headless UI Select](https://headlessui.com/react/select) - Tailwind team's accessible components
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - official ARIA guidelines (W3C)
- [React Debounce patterns](https://www.developerway.com/posts/debouncing-in-react) - debouncing best practices
- [use-debounce documentation](https://github.com/xnimorz/use-debounce) - library already used by widget

### Secondary (MEDIUM confidence - WebSearch verified)
- [Building an Accessible Dropdown (Combobox) in React](https://medium.com/@katr.zaks/building-an-accessible-dropdown-combobox-in-react-a-step-by-step-guide-f6e0439c259c) - community patterns
- [Building accessible Select component in React](https://medium.com/lego-engineering/building-accessible-select-component-in-react-b61dbdf5122f) - LEGO engineering blog
- [React Shadow DOM styling](https://github.com/Wildhoney/ReactShadow) - react-shadow library (already used by widget)
- [Shadow DOM - Material UI](https://mui.com/material-ui/guides/shadow-dom/) - challenges with portals
- [Progressive Enhancement – React Router](https://reactrouter.com/explanation/progressive-enhancement) - backward compatibility strategies

### Tertiary (LOW confidence - needs validation)
- None - all critical findings verified through official documentation or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - widget already has complete stack, no new dependencies needed
- Architecture: HIGH - patterns verified in existing widget code and official React/Web APIs documentation
- Pitfalls: MEDIUM-HIGH - based on Shadow DOM limitations (documented), common React mistakes (community knowledge), and cents/dollars conversion (verified in existing codebase)
- API integration: HIGH - Phase 13 API response format fully documented in source code

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (30 days - stable technologies, mature patterns, no fast-moving dependencies)
