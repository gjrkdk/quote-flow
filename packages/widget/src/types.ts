/**
 * Props for the PriceMatrixWidget component.
 *
 * Required: apiUrl, apiKey, productId
 * Optional: theme, onAddToCart
 */
export interface PriceMatrixWidgetProps {
  /** REST API base URL (e.g., "https://your-app.example.com") */
  apiUrl: string;

  /** API key for X-API-Key authentication */
  apiKey: string;

  /** Shopify product ID (numeric string or gid:// format) */
  productId: string;

  /** Optional theme customization via CSS custom properties */
  theme?: ThemeProps;

  /** Callback fired when Draft Order is successfully created */
  onAddToCart?: (event: AddToCartEvent) => void;
}

/**
 * Theme customization props. Each maps to a CSS custom property.
 * All optional — defaults are applied via CSS fallbacks.
 */
export interface ThemeProps {
  /** Primary button/accent color. CSS var: --pm-primary-color. Default: #5c6ac4 */
  primaryColor?: string;
  /** Main text color. CSS var: --pm-text-color. Default: #202223 */
  textColor?: string;
  /** Border color for inputs. CSS var: --pm-border-color. Default: #c9cccf */
  borderColor?: string;
  /** Border radius for inputs and buttons. CSS var: --pm-border-radius. Default: 8px */
  borderRadius?: string;
  /** Base font size. CSS var: --pm-font-size. Default: 14px */
  fontSize?: string;
  /** Error text color. CSS var: --pm-error-color. Default: #d72c0d */
  errorColor?: string;
}

/**
 * Event payload when Draft Order is created.
 * Passed to onAddToCart callback.
 */
export interface AddToCartEvent {
  /** Shopify Draft Order GID */
  draftOrderId: string;
  /** Customer-facing checkout URL */
  checkoutUrl: string;
  /** Unit price from matrix */
  price: number;
  /** Total price (unit price * quantity) */
  total: number;
  /** Dimensions used for pricing */
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  /** Quantity ordered */
  quantity: number;
}

/**
 * Option group assigned to a product.
 * Internal type — not exported to consumers.
 */
export interface OptionGroup {
  id: string;
  name: string;
  requirement: 'REQUIRED' | 'OPTIONAL';
  choices: OptionChoice[];
}

/**
 * Choice within an option group.
 * Internal type — not exported to consumers.
 */
export interface OptionChoice {
  id: string;
  label: string;
  modifierType: 'FIXED' | 'PERCENTAGE';
  modifierValue: number;
  isDefault: boolean;
}

/**
 * User's selection for an option group.
 * Internal type — not exported to consumers.
 */
export interface OptionSelection {
  optionGroupId: string;
  choiceId: string;
}

/**
 * API response shape from GET /api/v1/products/:id/options
 * Internal type — not exported to consumers.
 */
export interface OptionGroupsApiResponse {
  optionGroups: OptionGroup[];
}

/**
 * Option modifier breakdown information.
 * Internal type — not exported to consumers.
 */
export interface OptionModifierInfo {
  optionGroup: string;
  choice: string;
  modifierType: 'FIXED' | 'PERCENTAGE';
  modifierValue: number;
  appliedAmount: number;
}

/**
 * API response shape from GET /api/v1/products/:id/price
 * Internal type — not exported to consumers.
 */
export interface PriceApiResponse {
  price: number;
  currency: string;
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  quantity: number;
  total: number;
  matrix: string;
  dimensionRange: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  };
  basePrice?: number;
  optionModifiers?: OptionModifierInfo[];
}

/**
 * API response shape from POST /api/v1/draft-orders
 * Internal type — not exported to consumers.
 */
export interface DraftOrderApiResponse {
  draftOrderId: string;
  name: string;
  checkoutUrl: string;
  total: string;
  price: number;
  dimensions: {
    width: number;
    height: number;
    unit: string;
  };
  quantity: number;
  basePrice?: number;
  optionModifiers?: OptionModifierInfo[];
}

/**
 * API error response (RFC 7807 format)
 * Internal type — not exported to consumers.
 */
export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, string[]>;
}
