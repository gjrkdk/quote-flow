# @pricing-matrix/widget

Drop-in React widget for Shopify dimension-based pricing with live price updates and Draft Order checkout.

## Installation

```bash
npm install @pricing-matrix/widget
```

**Peer Dependencies:**
- `react` ^18.0.0
- `react-dom` ^18.0.0

## Usage

```tsx
import { PriceMatrixWidget } from '@pricing-matrix/widget';

function ProductPage() {
  return (
    <PriceMatrixWidget
      apiUrl="https://your-app.example.com"
      apiKey="your-api-key"
      productId="gid://shopify/Product/1234567890"
      theme={{
        primaryColor: '#5c6ac4',
        borderRadius: '8px',
        fontSize: '14px'
      }}
      onAddToCart={(event) => {
        console.log('Draft Order created:', event.draftOrderId);
        console.log('Checkout URL:', event.checkoutUrl);
        // Optionally redirect to checkout
        window.location.href = event.checkoutUrl;
      }}
    />
  );
}
```

## API

### PriceMatrixWidget Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiUrl` | `string` | **Yes** | REST API base URL (e.g., "https://your-app.example.com") |
| `apiKey` | `string` | **Yes** | API key for X-API-Key authentication |
| `productId` | `string` | **Yes** | Shopify product ID (numeric string or gid:// format) |
| `theme` | `ThemeProps` | No | Optional theme customization via CSS custom properties |
| `onAddToCart` | `(event: AddToCartEvent) => void` | No | Callback fired when Draft Order is successfully created |

### ThemeProps

All theme properties are optional. Each maps to a CSS custom property within the widget's Shadow DOM.

| Property | CSS Variable | Type | Default | Description |
|----------|--------------|------|---------|-------------|
| `primaryColor` | `--pm-primary-color` | `string` | `#5c6ac4` | Primary button/accent color |
| `textColor` | `--pm-text-color` | `string` | `#202223` | Main text color |
| `borderColor` | `--pm-border-color` | `string` | `#c9cccf` | Border color for inputs |
| `borderRadius` | `--pm-border-radius` | `string` | `8px` | Border radius for inputs and buttons |
| `fontSize` | `--pm-font-size` | `string` | `14px` | Base font size |
| `errorColor` | `--pm-error-color` | `string` | `#d72c0d` | Error text color |

### AddToCartEvent

Event payload passed to the `onAddToCart` callback when a Draft Order is successfully created.

| Property | Type | Description |
|----------|------|-------------|
| `draftOrderId` | `string` | Shopify Draft Order GID |
| `checkoutUrl` | `string` | Customer-facing checkout URL |
| `price` | `number` | Unit price from matrix |
| `total` | `number` | Total price (unit price × quantity) |
| `dimensions` | `{ width: number; height: number; unit: string; }` | Dimensions used for pricing |
| `quantity` | `number` | Quantity ordered |

## Features

- **Shadow DOM CSS Isolation** — Styles are scoped and won't conflict with your site's CSS
- **Live Price Calculation** — Price updates as user enters dimensions and quantity
- **Draft Order Creation** — Submits to Shopify Draft Order API with custom line items
- **Customizable Theming** — Override colors, fonts, and spacing via theme props
- **TypeScript Support** — Full type definitions included

## Example: Redirect to Checkout

```tsx
<PriceMatrixWidget
  apiUrl="https://your-app.example.com"
  apiKey="your-api-key"
  productId="gid://shopify/Product/1234567890"
  onAddToCart={(event) => {
    // Redirect user to Shopify checkout
    window.location.href = event.checkoutUrl;
  }}
/>
```

## Example: Track Analytics

```tsx
<PriceMatrixWidget
  apiUrl="https://your-app.example.com"
  apiKey="your-api-key"
  productId="gid://shopify/Product/1234567890"
  onAddToCart={(event) => {
    // Track conversion in your analytics
    analytics.track('Draft Order Created', {
      orderId: event.draftOrderId,
      total: event.total,
      dimensions: event.dimensions,
    });

    // Then redirect
    window.location.href = event.checkoutUrl;
  }}
/>
```

## License

MIT
