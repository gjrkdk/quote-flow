# Architecture Research: Option Groups with Price Modifiers

**Domain:** Shopify pricing customization with configurable product options
**Researched:** 2026-02-09
**Confidence:** HIGH

## Integration Overview

Option groups add a layer of customizable selections (dropdowns) on top of the existing dimension-based price matrix. The architecture extends the current system with minimal modifications to core pricing logic while adding new models, API endpoints, and UI components.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STOREFRONT LAYER                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  PriceMatrixWidget (MODIFIED)                                │   │
│  │  ├─ DimensionInput (existing)                                │   │
│  │  ├─ OptionGroupSelector (NEW)                                │   │
│  │  ├─ PriceDisplay (existing)                                  │   │
│  │  └─ AddToCartButton (existing)                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                          API LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  GET /api/v1/products/:id/price (MODIFIED)                 │     │
│  │    + Accept optionSelections[] query param                 │     │
│  │    + Calculate option modifiers from base price            │     │
│  │                                                              │     │
│  │  POST /api/v1/draft-orders (MODIFIED)                      │     │
│  │    + Accept optionSelections[] in body                     │     │
│  │    + Include option data in line item properties           │     │
│  │                                                              │     │
│  │  GET /api/v1/products/:id/options (NEW)                    │     │
│  │    + Return assigned option groups and choices             │     │
│  └────────────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│                       ADMIN UI LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  app/routes/app.options._index.tsx (NEW)                   │     │
│  │  app/routes/app.options.new.tsx (NEW)                      │     │
│  │  app/routes/app.options.$id.edit.tsx (NEW)                 │     │
│  │  app/routes/app.products.$id.options.tsx (NEW)             │     │
│  │  app/routes/app.matrices.$id.edit.tsx (MODIFIED)           │     │
│  └────────────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  price-calculator.server.ts (MODIFIED)                     │     │
│  │    + applyOptionModifiers(basePrice, selections)           │     │
│  │                                                              │     │
│  │  option-lookup.server.ts (NEW)                             │     │
│  │    + lookupProductOptions(productId, storeId)              │     │
│  │    + validateOptionSelections(selections, options)         │     │
│  │                                                              │     │
│  │  draft-order.server.ts (MODIFIED)                          │     │
│  │    + Include option metadata in line item properties       │     │
│  └────────────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  OptionGroup │  │  OptionChoice│  │  Product     │              │
│  │  (NEW)       │  │  (NEW)       │  │  OptionGroup │              │
│  │              │  │              │  │  (NEW)       │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Store       │  │  PriceMatrix │  │  Product     │              │
│  │  (existing)  │  │  (existing)  │  │  Matrix      │              │
│  │              │  │              │  │  (existing)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

## New Database Models

### OptionGroup
Reusable option groups (e.g., "Glass Type", "Frame Color") managed per store.

```prisma
model OptionGroup {
  id          String                @id @default(cuid())
  storeId     String                @map("store_id")
  name        String                // "Glass Type", "Frame Color"
  displayName String?               @map("display_name") // Optional customer-facing label
  position    Int                   // Display order in UI
  createdAt   DateTime              @default(now()) @map("created_at")
  updatedAt   DateTime              @updatedAt @map("updated_at")

  store       Store                 @relation(fields: [storeId], references: [id], onDelete: Cascade)
  choices     OptionChoice[]
  products    ProductOptionGroup[]

  @@index([storeId])
  @@map("option_groups")
}
```

### OptionChoice
Individual choices within an option group with price modifiers.

```prisma
model OptionChoice {
  id              String       @id @default(cuid())
  optionGroupId   String       @map("option_group_id")
  name            String       // "Clear", "Tempered", "Laminated"
  displayName     String?      @map("display_name") // Optional customer-facing label
  position        Int          // Display order in dropdown
  modifierType    ModifierType @map("modifier_type") // FIXED or PERCENTAGE
  modifierValue   Float        @map("modifier_value") // Amount or percentage (e.g., 10 for 10%)

  optionGroup     OptionGroup  @relation(fields: [optionGroupId], references: [id], onDelete: Cascade)

  @@index([optionGroupId])
  @@map("option_choices")
}

enum ModifierType {
  FIXED       // Add/subtract fixed amount (e.g., +$5.00)
  PERCENTAGE  // Add/subtract percentage of base price (e.g., +10%)

  @@map("modifier_type")
}
```

### ProductOptionGroup
Join table linking products to option groups (many-to-many).

```prisma
model ProductOptionGroup {
  id            Int         @id @default(autoincrement())
  productId     String      @map("product_id")      // Shopify GID
  optionGroupId String      @map("option_group_id")
  position      Int         // Display order when multiple groups per product
  required      Boolean     @default(true)          // Whether customer must select
  assignedAt    DateTime    @default(now()) @map("assigned_at")

  optionGroup   OptionGroup @relation(fields: [optionGroupId], references: [id], onDelete: Cascade)

  @@unique([productId, optionGroupId])
  @@index([productId])
  @@index([optionGroupId])
  @@map("product_option_groups")
}
```

## Modified API Endpoints

### GET /api/v1/products/:productId/price

**Changes:**
- Accept new query parameter: `optionSelections` (repeatable or JSON array)
- Calculate base price from matrix (existing logic)
- Apply option modifiers sequentially
- Return breakdown in response

**Query format options:**

Option 1 (repeatable):
```
?width=100&height=200&quantity=1
&optionSelections[][groupId]=grp_abc&optionSelections[][choiceId]=choice_123
&optionSelections[][groupId]=grp_xyz&optionSelections[][choiceId]=choice_456
```

Option 2 (JSON, simpler for widget):
```
?width=100&height=200&quantity=1
&optionSelections=[{"groupId":"grp_abc","choiceId":"choice_123"},{"groupId":"grp_xyz","choiceId":"choice_456"}]
```

**Response (modified):**
```json
{
  "price": 50.00,
  "basePrice": 45.00,
  "optionModifiers": [
    {
      "groupId": "grp_abc",
      "groupName": "Glass Type",
      "choiceId": "choice_123",
      "choiceName": "Tempered",
      "modifierType": "PERCENTAGE",
      "modifierValue": 10,
      "appliedAmount": 4.50
    },
    {
      "groupId": "grp_xyz",
      "groupName": "Frame Color",
      "choiceId": "choice_456",
      "choiceName": "Black",
      "modifierType": "FIXED",
      "modifierValue": 0.50,
      "appliedAmount": 0.50
    }
  ],
  "currency": "USD",
  "dimensions": { "width": 100, "height": 200, "unit": "mm" },
  "quantity": 1,
  "total": 50.00,
  "matrix": "Standard Glass Pricing",
  "dimensionRange": { ... }
}
```

### POST /api/v1/draft-orders

**Changes:**
- Accept `optionSelections` array in request body
- Validate selections against assigned option groups
- Apply modifiers to base price
- Include option metadata in Draft Order line item properties

**Request body (modified):**
```json
{
  "productId": "gid://shopify/Product/123",
  "width": 100,
  "height": 200,
  "quantity": 1,
  "optionSelections": [
    { "groupId": "grp_abc", "choiceId": "choice_123" },
    { "groupId": "grp_xyz", "choiceId": "choice_456" }
  ]
}
```

**Draft Order line item properties:**
```json
{
  "properties": [
    { "name": "Width", "value": "100mm" },
    { "name": "Height", "value": "200mm" },
    { "name": "Glass Type", "value": "Tempered (+10%)" },
    { "name": "Frame Color", "value": "Black (+$0.50)" }
  ]
}
```

### GET /api/v1/products/:productId/options (NEW)

Returns assigned option groups and choices for a product.

**Response:**
```json
{
  "productId": "gid://shopify/Product/123",
  "optionGroups": [
    {
      "id": "grp_abc",
      "name": "Glass Type",
      "displayName": "Select Glass Type",
      "required": true,
      "position": 0,
      "choices": [
        {
          "id": "choice_123",
          "name": "Clear",
          "displayName": "Clear Glass",
          "position": 0,
          "modifierType": "FIXED",
          "modifierValue": 0
        },
        {
          "id": "choice_124",
          "name": "Tempered",
          "displayName": "Tempered Glass",
          "position": 1,
          "modifierType": "PERCENTAGE",
          "modifierValue": 10
        }
      ]
    }
  ]
}
```

## Service Layer Changes

### price-calculator.server.ts (MODIFIED)

Add option modifier logic that applies to base price.

```typescript
export interface OptionSelection {
  groupId: string;
  choiceId: string;
}

export interface AppliedModifier {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  modifierType: 'FIXED' | 'PERCENTAGE';
  modifierValue: number;
  appliedAmount: number;
}

/**
 * Applies option modifiers to a base price.
 *
 * Percentages are calculated from base price (not compounded).
 * Order of application: all percentage modifiers first, then fixed modifiers.
 *
 * @param basePrice - Base price from matrix calculation
 * @param optionChoices - Resolved option choices with modifiers
 * @returns Final price and breakdown of applied modifiers
 */
export function applyOptionModifiers(
  basePrice: number,
  optionChoices: Array<{
    groupId: string;
    groupName: string;
    choiceId: string;
    choiceName: string;
    modifierType: 'FIXED' | 'PERCENTAGE';
    modifierValue: number;
  }>
): {
  finalPrice: number;
  appliedModifiers: AppliedModifier[];
} {
  let finalPrice = basePrice;
  const appliedModifiers: AppliedModifier[] = [];

  // Sort: percentage modifiers first, then fixed
  const sorted = [...optionChoices].sort((a, b) => {
    if (a.modifierType === 'PERCENTAGE' && b.modifierType === 'FIXED') return -1;
    if (a.modifierType === 'FIXED' && b.modifierType === 'PERCENTAGE') return 1;
    return 0;
  });

  sorted.forEach((choice) => {
    let appliedAmount: number;

    if (choice.modifierType === 'PERCENTAGE') {
      // Calculate from base price (not compounded)
      appliedAmount = basePrice * (choice.modifierValue / 100);
    } else {
      // Fixed amount
      appliedAmount = choice.modifierValue;
    }

    finalPrice += appliedAmount;

    appliedModifiers.push({
      groupId: choice.groupId,
      groupName: choice.groupName,
      choiceId: choice.choiceId,
      choiceName: choice.choiceName,
      modifierType: choice.modifierType,
      modifierValue: choice.modifierValue,
      appliedAmount,
    });
  });

  return { finalPrice, appliedModifiers };
}
```

### option-lookup.server.ts (NEW)

Handles option group queries and validation.

```typescript
/**
 * Looks up option groups assigned to a product.
 *
 * @param productId - Normalized Shopify product GID
 * @param storeId - Store ID
 * @returns Option groups with choices, or null if no options assigned
 */
export async function lookupProductOptions(
  productId: string,
  storeId: string
): Promise<ProductOptionsData | null> {
  const assignments = await prisma.productOptionGroup.findMany({
    where: { productId },
    include: {
      optionGroup: {
        where: { storeId }, // Security: ensure group belongs to same store
        include: {
          choices: {
            orderBy: { position: 'asc' },
          },
        },
      },
    },
    orderBy: { position: 'asc' },
  });

  if (assignments.length === 0) {
    return null;
  }

  // Transform to API format
  return {
    productId,
    optionGroups: assignments.map((a) => ({
      id: a.optionGroup.id,
      name: a.optionGroup.name,
      displayName: a.optionGroup.displayName,
      required: a.required,
      position: a.position,
      choices: a.optionGroup.choices.map((c) => ({
        id: c.id,
        name: c.name,
        displayName: c.displayName,
        position: c.position,
        modifierType: c.modifierType,
        modifierValue: c.modifierValue,
      })),
    })),
  };
}

/**
 * Validates option selections against assigned option groups.
 *
 * @param selections - Customer selections
 * @param productOptions - Product's assigned option groups
 * @returns Validation result with error if invalid
 */
export function validateOptionSelections(
  selections: OptionSelection[],
  productOptions: ProductOptionsData
): ValidationResult {
  // Check required groups
  for (const group of productOptions.optionGroups) {
    if (group.required) {
      const hasSelection = selections.some((s) => s.groupId === group.id);
      if (!hasSelection) {
        return {
          valid: false,
          error: `Option group "${group.name}" is required`,
        };
      }
    }
  }

  // Check each selection is valid
  for (const selection of selections) {
    const group = productOptions.optionGroups.find((g) => g.id === selection.groupId);
    if (!group) {
      return {
        valid: false,
        error: `Invalid option group ID: ${selection.groupId}`,
      };
    }

    const choice = group.choices.find((c) => c.id === selection.choiceId);
    if (!choice) {
      return {
        valid: false,
        error: `Invalid choice ID: ${selection.choiceId} for group "${group.name}"`,
      };
    }
  }

  return { valid: true };
}
```

### draft-order.server.ts (MODIFIED)

Include option metadata in line item properties.

```typescript
/**
 * Formats option selections for Draft Order line item properties.
 */
function formatOptionProperties(
  optionChoices: Array<{
    groupName: string;
    choiceName: string;
    modifierType: 'FIXED' | 'PERCENTAGE';
    modifierValue: number;
  }>
): Array<{ name: string; value: string }> {
  return optionChoices.map((choice) => {
    let modifier = '';
    if (choice.modifierValue !== 0) {
      if (choice.modifierType === 'PERCENTAGE') {
        modifier = ` (+${choice.modifierValue}%)`;
      } else {
        modifier = ` (+$${choice.modifierValue.toFixed(2)})`;
      }
    }
    return {
      name: choice.groupName,
      value: `${choice.choiceName}${modifier}`,
    };
  });
}
```

## Widget Changes

### PriceMatrixWidget.tsx (MODIFIED)

Add option group selectors between dimensions and price display.

```tsx
// New state
const [optionSelections, setOptionSelections] = useState<OptionSelection[]>([]);

// New hook
const {
  optionGroups,
  loading: optionsLoading,
  error: optionsError,
} = useOptionGroups({ apiUrl, apiKey, productId });

// Pass optionSelections to usePriceFetch
const { price, total, ... } = usePriceFetch(
  { apiUrl, apiKey, productId },
  quantity,
  optionSelections // NEW
);

// Render option groups
return (
  <root.div style={themeStyles}>
    <style>{widgetStyles}</style>
    <div className="pm-widget">
      <DimensionInput label="Width" ... />
      <DimensionInput label="Height" ... />

      {/* NEW: Option group selectors */}
      {optionGroups?.map((group) => (
        <OptionGroupSelector
          key={group.id}
          group={group}
          value={optionSelections.find((s) => s.groupId === group.id)?.choiceId}
          onChange={(choiceId) => {
            setOptionSelections((prev) => [
              ...prev.filter((s) => s.groupId !== group.id),
              { groupId: group.id, choiceId },
            ]);
          }}
        />
      ))}

      <QuantitySelector ... />
      <PriceDisplay ... />
      <AddToCartButton ... />
    </div>
  </root.div>
);
```

### OptionGroupSelector.tsx (NEW)

```tsx
interface OptionGroupSelectorProps {
  group: {
    id: string;
    name: string;
    displayName: string | null;
    required: boolean;
    choices: Array<{
      id: string;
      name: string;
      displayName: string | null;
      modifierType: 'FIXED' | 'PERCENTAGE';
      modifierValue: number;
    }>;
  };
  value: string | undefined;
  onChange: (choiceId: string) => void;
}

export function OptionGroupSelector({ group, value, onChange }: OptionGroupSelectorProps) {
  const label = group.displayName || group.name;
  const isRequired = group.required;

  return (
    <div className="pm-option-group">
      <label className="pm-option-label">
        {label}
        {isRequired && <span className="pm-required">*</span>}
      </label>
      <select
        className="pm-option-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={isRequired}
      >
        <option value="" disabled>
          {isRequired ? 'Select an option' : 'None'}
        </option>
        {group.choices.map((choice) => {
          const displayName = choice.displayName || choice.name;
          let priceLabel = '';
          if (choice.modifierValue !== 0) {
            if (choice.modifierType === 'PERCENTAGE') {
              priceLabel = ` (+${choice.modifierValue}%)`;
            } else {
              priceLabel = ` (+$${choice.modifierValue.toFixed(2)})`;
            }
          }
          return (
            <option key={choice.id} value={choice.id}>
              {displayName}{priceLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
}
```

### useOptionGroups.ts (NEW)

```tsx
/**
 * Fetches option groups for a product.
 */
export function useOptionGroups(options: {
  apiUrl: string;
  apiKey: string;
  productId: string;
}) {
  const [optionGroups, setOptionGroups] = useState<OptionGroup[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const url = `${options.apiUrl}/api/v1/products/${options.productId}/options`;
        const response = await fetch(url, {
          headers: { 'X-API-Key': options.apiKey },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // No options assigned, this is OK
            setOptionGroups(null);
            setError(null);
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch options');
        }

        const data = await response.json();
        setOptionGroups(data.optionGroups);
        setError(null);
      } catch (err) {
        setError('Failed to load options');
        setOptionGroups(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [options.apiUrl, options.apiKey, options.productId]);

  return { optionGroups, loading, error };
}
```

### usePriceFetch.ts (MODIFIED)

Accept `optionSelections` and include in API call.

```tsx
export function usePriceFetch(
  options: UsePriceFetchOptions,
  quantity: number = 1,
  optionSelections: OptionSelection[] = [] // NEW
): UsePriceFetchReturn {
  // ... existing state ...

  useEffect(() => {
    // ... existing validation ...

    const fetchPrice = async () => {
      const url = new URL(`${apiUrl}/api/v1/products/${productId}/price`);
      url.searchParams.set('width', debouncedWidth);
      url.searchParams.set('height', debouncedHeight);
      url.searchParams.set('quantity', String(quantity));

      // NEW: Add option selections
      if (optionSelections.length > 0) {
        url.searchParams.set('optionSelections', JSON.stringify(optionSelections));
      }

      // ... rest of fetch logic ...
    };

    fetchPrice();
  }, [debouncedWidth, debouncedHeight, quantity, optionSelections, ...]); // Add optionSelections to deps
}
```

## Admin UI Components

### app/routes/app.options._index.tsx (NEW)

List all option groups with create/edit/delete actions.

- Polaris Page with IndexTable
- Shows group name, number of choices, products using it
- Actions: Edit, Delete (with confirmation)
- Create new button → navigates to `/app/options/new`

### app/routes/app.options.new.tsx (NEW)

Create option group form.

- Input: Group name, display name
- Dynamic choices array (add/remove rows)
- Per choice: name, display name, modifier type (dropdown), modifier value
- Save creates OptionGroup + OptionChoice records
- Redirect to edit page on success

### app/routes/app.options.$id.edit.tsx (NEW)

Edit option group form.

- Same structure as new form, pre-populated
- Show products using this option group (read-only list)
- Save updates OptionGroup + OptionChoice records
- Handle cascading updates (product assignments remain)

### app/routes/app.products.$id.options.tsx (NEW)

Assign option groups to a product.

- ProductPicker to select product (or productId from URL)
- Show assigned option groups with position/required controls
- Add option group: dropdown of available groups
- Remove option group button
- Position drag-and-drop (optional for v1, can use numeric input)
- Save updates ProductOptionGroup records

### Modified Navigation

Update app sidebar to include "Option Groups" link.

```tsx
// app/routes/app.tsx (MODIFIED)
<Navigation location={location}>
  <Navigation.Section
    items={[
      { label: 'Dashboard', url: '/app', icon: HomeIcon },
      { label: 'Price Matrices', url: '/app/matrices', icon: ProductsIcon },
      { label: 'Option Groups', url: '/app/options', icon: CollectionsIcon }, // NEW
      { label: 'Settings', url: '/app/settings', icon: SettingsIcon },
    ]}
  />
</Navigation>
```

## Data Flow

### Price Calculation with Options

```
1. Widget: User enters dimensions (100mm x 200mm)
2. Widget: User selects options (Glass Type: Tempered, Frame Color: Black)
3. Widget: usePriceFetch sends GET /api/v1/products/123/price
   → Query params: width=100, height=200, quantity=1, optionSelections=[...]
4. API: validateDimensions(100, 200, 1) ✓
5. API: lookupProductMatrix(123) → matrix data
6. API: calculatePrice(100, 200, matrix) → basePrice = $45.00
7. API: lookupProductOptions(123) → option groups
8. API: validateOptionSelections(selections, options) ✓
9. API: applyOptionModifiers(45.00, selections)
   → Tempered (+10%): $45.00 * 0.10 = +$4.50
   → Black (fixed): +$0.50
   → finalPrice = $50.00
10. API: Return { basePrice: 45.00, price: 50.00, optionModifiers: [...], ... }
11. Widget: Display $50.00 with breakdown (optional)
```

### Draft Order Creation with Options

```
1. Widget: User clicks "Add to Cart"
2. Widget: useDraftOrder sends POST /api/v1/draft-orders
   → Body: { productId, width, height, quantity, optionSelections }
3. API: Validate dimensions + options (same as price calculation)
4. API: Calculate final price with modifiers
5. API: submitDraftOrder(admin, ...)
   → customAttributes for dimensions
   → properties array includes option selections
6. Shopify: Create Draft Order with locked custom price
7. API: Return { draftOrderId, checkoutUrl, total, ... }
8. Widget: Redirect to checkoutUrl
```

## Build Order Recommendations

Based on dependencies, implement in this sequence:

### Phase 1: Data Models & Services (Foundation)
**Tasks:**
1. Prisma schema updates (OptionGroup, OptionChoice, ProductOptionGroup, ModifierType enum)
2. Database migration
3. option-lookup.server.ts (NEW)
4. price-calculator.server.ts modifications (applyOptionModifiers)

**Rationale:** Foundation for all other work. Can be tested in isolation with unit tests.

### Phase 2: Admin UI (Management)
**Tasks:**
1. app/routes/app.options._index.tsx (list)
2. app/routes/app.options.new.tsx (create)
3. app/routes/app.options.$id.edit.tsx (edit)
4. app/routes/app.products.$id.options.tsx (assign to products)
5. Update navigation in app.tsx

**Rationale:** Merchants need to create option groups before API/widget can use them. Can be tested manually through admin UI.

### Phase 3: REST API (Backend)
**Tasks:**
1. GET /api/v1/products/:id/options (NEW endpoint)
2. Modify GET /api/v1/products/:id/price (accept optionSelections, apply modifiers)
3. Modify POST /api/v1/draft-orders (accept optionSelections, include in properties)
4. Update validators in api.validators.ts

**Rationale:** API must be ready before widget integration. Can be tested with curl/Postman using option groups created in Phase 2.

### Phase 4: Widget (Frontend)
**Tasks:**
1. OptionGroupSelector.tsx (NEW component)
2. useOptionGroups.ts (NEW hook)
3. Modify usePriceFetch.ts (accept optionSelections)
4. Modify PriceMatrixWidget.tsx (render option selectors, manage state)
5. Update widgetStyles for option group styling
6. Update TypeScript types

**Rationale:** Final integration layer. Requires API from Phase 3 and option groups from Phase 2. Can be tested end-to-end.

### Phase 5: Testing & Polish
**Tasks:**
1. E2E tests for full flow (create group → assign → widget → Draft Order)
2. Edge case testing (required vs optional, no modifiers, negative modifiers)
3. Update widget demo page
4. Update documentation (README, API docs)

## Architectural Patterns

### Pattern 1: Option Group Reusability

**What:** Option groups are store-scoped and reusable across products via ProductOptionGroup join table.

**When to use:** Merchants sell multiple products with similar customization needs (e.g., all glass products share "Glass Type" options).

**Trade-offs:**
- **Pro:** DRY principle - define options once, reuse everywhere
- **Pro:** Consistent pricing across product catalog
- **Pro:** Easy updates - change one group, affects all products
- **Con:** Less flexibility for product-specific pricing (mitigated by allowing multiple groups per product)

**Example:**
```typescript
// Create option group once
const glassType = await prisma.optionGroup.create({
  data: {
    storeId: 'store_123',
    name: 'Glass Type',
    position: 0,
    choices: {
      create: [
        { name: 'Clear', position: 0, modifierType: 'FIXED', modifierValue: 0 },
        { name: 'Tempered', position: 1, modifierType: 'PERCENTAGE', modifierValue: 10 },
      ],
    },
  },
});

// Assign to multiple products
await prisma.productOptionGroup.createMany({
  data: [
    { productId: 'prod_1', optionGroupId: glassType.id, position: 0, required: true },
    { productId: 'prod_2', optionGroupId: glassType.id, position: 0, required: true },
    { productId: 'prod_3', optionGroupId: glassType.id, position: 0, required: true },
  ],
});
```

### Pattern 2: Non-Compounding Percentage Modifiers

**What:** Percentage modifiers always calculate from the base matrix price, not from the running total.

**When to use:** When predictable, merchant-friendly pricing is more important than sophisticated price adjustments.

**Trade-offs:**
- **Pro:** Merchants can easily predict final price
- **Pro:** Simpler calculation logic
- **Pro:** Order of option selection doesn't affect price
- **Con:** Can't model compounding discounts (e.g., "10% off, then 5% off the discounted price")

**Example:**
```typescript
// Base price: $100
// Option 1: +10% = $100 * 0.10 = +$10
// Option 2: +5% = $100 * 0.05 = +$5
// Final: $100 + $10 + $5 = $115

// NOT: $100 + ($100 * 0.10) = $110, then $110 + ($110 * 0.05) = $115.50
```

### Pattern 3: Option Metadata in Draft Order Properties

**What:** Store option selections as line item properties in Shopify Draft Orders for merchant reference.

**When to use:** When custom pricing needs to be transparent to merchants and visible in order details.

**Trade-offs:**
- **Pro:** Merchants see what customer selected in Shopify admin
- **Pro:** No additional database storage needed
- **Pro:** Properties are included in order confirmation emails
- **Con:** Properties are display-only (can't be used for inventory management)

**Example:**
```graphql
mutation {
  draftOrderCreate(input: {
    lineItems: [
      {
        title: "Custom Glass Panel"
        quantity: 1
        originalUnitPrice: 50.00
        customAttributes: [
          { key: "Width", value: "100mm" }
          { key: "Height", value: "200mm" }
          { key: "Glass Type", value: "Tempered (+10%)" }
          { key: "Frame Color", value: "Black (+$0.50)" }
        ]
      }
    ]
  }) { ... }
}
```

## Anti-Patterns

### Anti-Pattern 1: Product-Specific Option Pricing

**What people might do:** Create separate option groups for each product to allow product-specific modifier values.

**Why it's wrong:**
- Violates DRY principle
- Creates management overhead (dozens of "Glass Type" groups for dozens of products)
- Makes bulk pricing updates nearly impossible
- Pollutes option group list in admin UI

**Do this instead:**
- Use reusable option groups with percentage modifiers (automatically scales with product price)
- If truly need product-specific pricing, create distinct option groups with different names ("Premium Glass Type", "Standard Glass Type")
- Use multiple option groups per product to compose pricing (e.g., "Base Material" + "Finish Quality")

### Anti-Pattern 2: Option Groups as Variants

**What people might do:** Try to use option groups to replace Shopify variants for inventory-tracked options.

**Why it's wrong:**
- Option groups don't manage inventory
- Shopify variants are the proper tool for SKU-level tracking
- Creates confusion between customization (options) and variants
- Can't use Shopify's built-in variant features (images, barcodes, etc.)

**Do this instead:**
- Use Shopify variants for inventory-tracked choices (size, color with stock)
- Use option groups for non-inventory customizations (engraving, glass type, frame style)
- If needed, create separate products for fundamentally different items

### Anti-Pattern 3: Compounding Percentage Calculations

**What people might do:** Calculate each percentage modifier from the running total.

**Why it's wrong:**
- Order of option selection affects final price (confusing for customers)
- Harder for merchants to predict pricing
- More complex calculation logic
- Doesn't match merchant mental model ("I want 10% extra for tempered glass")

**Do this instead:**
- Always calculate percentages from base matrix price
- Document this clearly in admin UI when creating percentage modifiers
- If truly need compounding, use fixed modifiers calculated from expected price ranges

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-50 products | Current architecture is optimal. In-memory query results, no caching needed. |
| 50-500 products | Consider caching option group lookups per product (Redis or in-memory LRU cache). Most products share option groups, so cache hit rate will be high. |
| 500-5000 products | Add database indexes on ProductOptionGroup.productId and OptionGroup.storeId. Consider read replicas for price API if query load exceeds 1000 req/min. |
| 5000+ products | Denormalize option data into product matrix lookup table to reduce joins. Pre-calculate common option combinations. Consider CDN caching for GET /products/:id/options endpoint (with cache invalidation on updates). |

### Scaling Priorities

1. **First bottleneck:** Option group lookups in price API (join through ProductOptionGroup → OptionGroup → OptionChoice)
   - **Fix:** Add Redis cache with 60s TTL, invalidate on option group updates
   - **Code:** `await redis.get(\`product_options:${productId}\`) || lookupProductOptions(...)`

2. **Second bottleneck:** Repeated validation of option selections on each price request
   - **Fix:** Cache validation results keyed by `${productId}:${JSON.stringify(selections)}`
   - **Code:** Implement in `validateOptionSelections` with 5-minute TTL

## Integration Points

### Shopify Draft Orders

| Integration | Pattern | Notes |
|-------------|---------|-------|
| Custom pricing | `originalUnitPrice` in line items | Already working in existing system |
| Option metadata | `customAttributes` array | Display-only, included in order details and emails |
| Line item properties | Legacy approach | Use customAttributes instead (newer API) |

### REST API Authentication

| Integration | Pattern | Notes |
|-------------|---------|-------|
| API key | `X-API-Key` header | Already implemented, no changes needed |
| CORS | Wildcard `Access-Control-Allow-Origin: *` | Already configured, option endpoints follow same pattern |
| Rate limiting | In-memory store (100 req/min per store) | Already implemented, applies to option endpoints automatically |

### Widget Integration

| Integration | Pattern | Notes |
|-------------|---------|-------|
| Shadow DOM | `react-shadow` for CSS isolation | Already working, option styles go inside shadow root |
| State management | React useState + useEffect | Consistent with existing dimension state |
| API calls | Fetch API with AbortController | Reuse existing patterns from usePriceFetch |

## Security Considerations

### Store Isolation
- Option groups are scoped to `storeId` - queries MUST filter by store
- ProductOptionGroup assignments don't store storeId directly - validate through OptionGroup.storeId
- API authentication via `authenticateApiKey` already provides `store.id`

### Validation
- Validate option selections against assigned option groups (prevent invalid groupId/choiceId)
- Enforce required option groups (block Draft Order if required selection missing)
- Validate modifier values during option group creation (percentage: -100 to +1000, fixed: any number)

### SQL Injection
- Prisma ORM parameterizes all queries automatically
- No raw SQL in option-related queries

## Sources

- [Qikify Custom Product Options - Shopify App Store](https://apps.shopify.com/tepo-product-options)
- [APO Product Options, Variants - Shopify App Store](https://apps.shopify.com/advanced-product-options)
- [How to Add Extra Charges for Custom Product Options on Shopify](https://easifyapps.com/blog/adding-extra-charges-for-custom-product-options-shopify/)
- [2026 Ecommerce Customization and Personalization Guide | Kickflip](https://gokickflip.com/blog/ecommerce-customization-and-personalization-guide)
- [Choosing a Database Schema for Polymorphic Data | DoltHub Blog](https://www.dolthub.com/blog/2024-06-25-polymorphic-associations/)
- [Set custom prices in draft orders - Shopify developer changelog](https://shopify.dev/changelog/set-custom-prices-in-draft-orders)
- [DraftOrder - Shopify API](https://shopify.dev/docs/api/admin-rest/latest/resources/draftorder)
- [Design Patterns for Relational Databases - GeeksforGeeks](https://www.geeksforgeeks.org/system-design/design-patterns-for-relational-databases/)
- [Oracle Advanced Pricing Implementation Guide](https://docs.oracle.com/cd/E18727_01/doc.121/e13428/T327893T327903.htm)
- [Product data attributes reference | Adobe Commerce](https://experienceleague.adobe.com/en/docs/commerce-admin/systems/data-transfer/data-attributes-product)

---
*Architecture research for: Option Groups with Price Modifiers*
*Researched: 2026-02-09*
*Confidence: HIGH - based on existing codebase analysis, official Shopify API documentation, and established e-commerce patterns*
