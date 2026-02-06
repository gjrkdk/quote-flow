// Public API — only export what consumers need
// Internal components (DimensionInput, PriceDisplay, etc.) are NOT exported

export { PriceMatrixWidget } from './PriceMatrixWidget';
export type {
  PriceMatrixWidgetProps,
  ThemeProps,
  AddToCartEvent,
} from './types';
