# Architecture Patterns: Shopify Price Matrix App

**Domain:** Shopify embedded app with public API and npm widget
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

This Shopify price matrix app requires a **three-tier architecture** with distinct boundaries:

1. **Embedded Admin App** - Remix on Vercel, merchant-facing dashboard for matrix management
2. **Public REST API** - Headless storefront price lookups with API key authentication
3. **Drop-in React Widget** - npm package for storefront integration with CSS isolation

The app follows Shopify's **multi-tenant pattern** with shared database (Prisma + PostgreSQL) and tenant isolation via shop domain. Component communication flows unidirectionally: Admin → Database ← API ← Widget, with the database as the central source of truth.

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL DEPLOYMENT                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         EMBEDDED ADMIN APP (Remix/React Router v7)         │ │
│  │                                                             │ │
│  │  - OAuth installation flow                                 │ │
│  │  - Session token authentication (App Bridge)               │ │
│  │  - Matrix CRUD UI (Polaris components)                     │ │
│  │  - Product assignment interface                            │ │
│  │  - Draft Order creation                                    │ │
│  │                                                             │ │
│  │  Routes:                                                    │ │
│  │    /app/matrices         - List/manage matrices            │ │
│  │    /app/matrices/:id     - Edit matrix                     │ │
│  │    /app/products         - Assign products                 │ │
│  │    /app/settings         - API key management              │ │
│  └──────────────────┬──────────────────────────────────────────┘ │
│                     │                                            │
│                     │ Prisma Client                              │
│                     ▼                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           DATABASE LAYER (Prisma + PostgreSQL)             │ │
│  │                                                             │ │
│  │  Tables:                                                    │ │
│  │    - Session (Shopify sessions)                            │ │
│  │    - Shop (merchant metadata, API keys)                    │ │
│  │    - Matrix (dimensions, breakpoints, prices)              │ │
│  │    - ProductMatrix (product ↔ matrix assignments)          │ │
│  │                                                             │ │
│  │  Multi-tenant isolation: shop domain filter on all queries │ │
│  └──────────────────┬──────────────────────────────────────────┘ │
│                     │                                            │
│                     │ Prisma Client                              │
│                     ▼                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          PUBLIC REST API (Remix API routes)                │ │
│  │                                                             │ │
│  │  - API key authentication (custom header)                  │ │
│  │  - Rate limiting per shop                                  │ │
│  │  - Versioned endpoints (/api/v1/...)                       │ │
│  │                                                             │ │
│  │  Endpoints:                                                 │ │
│  │    GET /api/v1/products/:productId/price                   │ │
│  │      ?width=100&height=50                                  │ │
│  │    POST /api/v1/draft-orders                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS JSON responses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NPM PACKAGE (@your-org/pricing-widget)        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         DROP-IN REACT WIDGET (Shadow DOM isolated)         │ │
│  │                                                             │ │
│  │  - Fetches price from REST API                             │ │
│  │  - Displays price matrix UI                                │ │
│  │  - Handles dimension inputs (width/height)                 │ │
│  │  - Round-up logic for breakpoints                          │ │
│  │  - Optional: Add to cart integration                       │ │
│  │                                                             │ │
│  │  Usage:                                                     │ │
│  │    <PriceMatrixWidget                                       │ │
│  │      apiUrl="https://your-app.vercel.app"                  │ │
│  │      productId="gid://shopify/Product/123"                 │ │
│  │      apiKey="pk_live_..."                                  │ │
│  │    />                                                       │ │
│  │                                                             │ │
│  │  Built with: Vite + Rollup, Shadow DOM for CSS isolation   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Boundaries

### 1. Embedded Admin App (Merchant Interface)

**Technology:** Remix (React Router v7) + Polaris + App Bridge
**Deployed on:** Vercel
**Authenticates via:** Shopify OAuth + session tokens + token exchange

**Responsibilities:**
- Authenticate merchants (OAuth installation flow)
- Manage matrices (CRUD operations)
- Assign products to matrices
- Generate and manage API keys for public API
- Create Draft Orders with custom pricing
- Display merchant analytics/usage

**Communicates with:**
- Shopify Admin GraphQL API (product data, draft order creation)
- Database (direct Prisma queries)
- Does NOT communicate with Public REST API

**Key patterns:**
- Embedded authorization strategy (token exchange, no redirects)
- Multi-tenant isolation via shop domain from session
- Polaris components for Shopify-native UX

### 2. Database Layer (Source of Truth)

**Technology:** Prisma ORM + PostgreSQL
**Deployed on:** Vercel Postgres (or Railway, Supabase)

**Responsibilities:**
- Store all application data
- Enforce multi-tenant isolation
- Maintain referential integrity
- Store Shopify sessions

**Data Model:**
```prisma
model Session {
  id          String   @id
  shop        String
  state       String
  isOnline    Boolean  @default(false)
  scope       String?
  expires     DateTime?
  accessToken String
  // Shopify session storage fields
}

model Shop {
  id              String          @id @default(cuid())
  shopDomain      String          @unique
  accessToken     String          // Encrypted
  apiKey          String          @unique // For public API auth
  installedAt     DateTime        @default(now())
  matrices        Matrix[]
  productMatrices ProductMatrix[]
}

model Matrix {
  id              String          @id @default(cuid())
  shopId          String
  shop            Shop            @relation(fields: [shopId], references: [id])
  name            String
  widthBreakpoints Json           // [50, 100, 150, 200]
  heightBreakpoints Json          // [30, 60, 90]
  prices          Json            // {width_index: {height_index: price}}
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  productMatrices ProductMatrix[]

  @@index([shopId])
}

model ProductMatrix {
  id              String   @id @default(cuid())
  shopId          String
  shop            Shop     @relation(fields: [shopId], references: [id])
  matrixId        String
  matrix          Matrix   @relation(fields: [matrixId], references: [id])
  productId       String   // Shopify GID
  productHandle   String
  assignedAt      DateTime @default(now())

  @@unique([shopId, productId]) // One matrix per product
  @@index([shopId])
  @@index([matrixId])
  @@index([productHandle])
}
```

**Multi-tenant isolation pattern:**
```typescript
// Prisma Client extension for automatic shop filtering
const prismaWithShopFilter = (shopDomain: string) => {
  return prisma.$extends({
    query: {
      matrix: {
        async findMany({ args, query }) {
          args.where = { ...args.where, shop: { shopDomain } };
          return query(args);
        },
        // Similar for all models with shopId
      }
    }
  });
};
```

**Communicates with:**
- Embedded Admin App (Prisma Client)
- Public REST API (Prisma Client)

### 3. Public REST API (Headless Storefront Integration)

**Technology:** Remix API routes (same deployment as admin app)
**Deployed on:** Vercel (shared with admin app)
**Authenticates via:** API key in custom header

**Responsibilities:**
- Authenticate API requests (API key validation)
- Look up product's assigned matrix
- Calculate price for given dimensions
- Return price data (with breakpoint round-up logic)
- Rate limiting per shop
- CORS configuration for storefront domains
- Optional: Create Draft Orders via proxy to admin

**API Design:**
```typescript
// GET /api/v1/products/:productId/price?width=100&height=50
// Headers: X-API-Key: pk_live_...

Response:
{
  "productId": "gid://shopify/Product/123",
  "dimensions": { "width": 100, "height": 50 },
  "matrix": {
    "id": "cm1x2y3z",
    "name": "Standard Print Matrix",
    "appliedBreakpoints": {
      "width": 100,  // Rounded up from 100 to breakpoint
      "height": 60   // Rounded up from 50 to breakpoint 60
    }
  },
  "price": {
    "amount": "45.99",
    "currencyCode": "USD"
  }
}

// POST /api/v1/draft-orders
// Headers: X-API-Key: pk_live_...
Body:
{
  "lineItems": [
    {
      "productId": "gid://shopify/Product/123",
      "quantity": 1,
      "customPrice": 45.99,
      "customAttributes": [
        { "key": "width", "value": "100" },
        { "key": "height", "value": "50" }
      ]
    }
  ],
  "customerId": "gid://shopify/Customer/456"
}

Response:
{
  "draftOrderId": "gid://shopify/DraftOrder/789",
  "invoiceUrl": "https://shop.myshopify.com/..."
}
```

**Authentication pattern:**
```typescript
// API key validation middleware
async function validateApiKey(request: Request) {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) throw new UnauthorizedError();

  const shop = await prisma.shop.findUnique({
    where: { apiKey }
  });

  if (!shop) throw new UnauthorizedError();

  return shop; // Attach to request context
}
```

**Versioning strategy:**
- URL path versioning: `/api/v1/...`, `/api/v2/...`
- Maintain backward compatibility within major versions
- Add optional fields, never remove required fields
- HTTP response codes never change meaning

**Communicates with:**
- Database (Prisma queries with shop filter)
- Shopify Admin GraphQL API (for Draft Order creation only)
- Does NOT communicate with Embedded Admin App directly

**Rate limiting:**
```typescript
// Per-shop rate limiting
const rateLimiter = new Map<string, { count: number, resetAt: Date }>();

const RATE_LIMIT = 100; // requests per minute per shop
```

### 4. Drop-in React Widget (Storefront UI)

**Technology:** React + Vite + Rollup + Shadow DOM
**Distributed as:** npm package
**Consumed by:** Headless storefronts, custom themes

**Responsibilities:**
- Accept dimension inputs (width/height)
- Fetch price from Public REST API
- Display price matrix UI
- Validate dimension inputs
- Handle loading/error states
- CSS isolation via Shadow DOM
- Optional: Add to cart integration

**Package structure:**
```
@your-org/pricing-widget/
├── src/
│   ├── PriceMatrixWidget.tsx   // Main component
│   ├── hooks/
│   │   ├── usePriceQuery.ts    // API fetching
│   │   └── useDimensions.ts    // Input handling
│   ├── components/
│   │   ├── DimensionInput.tsx
│   │   └── PriceDisplay.tsx
│   └── styles/
│       └── widget.css          // Injected into Shadow DOM
├── vite.config.ts              // Build config
├── package.json
└── README.md
```

**Build configuration (Vite + Rollup):**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.tsx',
      name: 'PricingWidget',
      formats: ['es', 'umd'],
      fileName: (format) => `pricing-widget.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
```

**Shadow DOM CSS isolation:**
```typescript
// PriceMatrixWidget.tsx
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import styles from './widget.css?inline';

export function PriceMatrixWidget(props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    // Create Shadow DOM
    const shadow = hostRef.current.attachShadow({ mode: 'open' });

    // Inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    shadow.appendChild(styleSheet);

    // Render React into Shadow DOM
    const container = document.createElement('div');
    shadow.appendChild(container);

    const root = createRoot(container);
    root.render(<WidgetContent {...props} />);

    return () => root.unmount();
  }, []);

  return <div ref={hostRef} />;
}
```

**Usage example:**
```tsx
// In merchant's headless storefront (Next.js, etc.)
import { PriceMatrixWidget } from '@your-org/pricing-widget';

<PriceMatrixWidget
  apiUrl="https://your-app.vercel.app"
  productId="gid://shopify/Product/123"
  apiKey="pk_live_abc123"
  defaultWidth={100}
  defaultHeight={50}
  onPriceChange={(price) => console.log(price)}
/>
```

**Communicates with:**
- Public REST API only (fetch prices)
- Does NOT communicate with Embedded Admin App or Database

**Distribution:**
```json
// package.json
{
  "name": "@your-org/pricing-widget",
  "version": "1.0.0",
  "main": "./dist/pricing-widget.umd.js",
  "module": "./dist/pricing-widget.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/pricing-widget.es.js",
      "require": "./dist/pricing-widget.umd.js"
    }
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## Data Flow Patterns

### Pattern 1: Merchant Creates Matrix (Admin → Database)

```
1. Merchant opens admin app in Shopify
2. App Bridge validates session token
3. Token exchange gets access token
4. Merchant creates matrix via UI
5. Remix action handler:
   - Validates merchant session
   - Extracts shop domain from session
   - Calls Prisma to insert matrix
   - Returns success/error
6. UI updates with new matrix
```

**Code:**
```typescript
// app/routes/app.matrices.new.tsx
export async function action({ request }: ActionArgs) {
  const { admin, session } = await authenticate.admin(request);

  const formData = await request.formData();
  const matrixData = parseMatrixData(formData);

  const matrix = await prisma.matrix.create({
    data: {
      ...matrixData,
      shop: { connect: { shopDomain: session.shop } }
    }
  });

  return json({ matrix });
}
```

### Pattern 2: Storefront Fetches Price (Widget → API → Database)

```
1. Widget renders in storefront
2. User enters dimensions (width: 100, height: 50)
3. Widget calls REST API:
   GET /api/v1/products/123/price?width=100&height=50
   Header: X-API-Key: pk_live_...
4. API route handler:
   - Validates API key
   - Finds shop from API key
   - Queries ProductMatrix to find matrix for product
   - Applies round-up logic to dimensions
   - Looks up price from matrix.prices JSON
   - Returns price
5. Widget displays price to user
```

**Code:**
```typescript
// app/routes/api.v1.products.$productId.price.tsx
export async function loader({ request, params }: LoaderArgs) {
  const shop = await validateApiKey(request);
  const { width, height } = parseQueryParams(request.url);

  const productMatrix = await prisma.productMatrix.findUnique({
    where: {
      shopId_productId: {
        shopId: shop.id,
        productId: params.productId
      }
    },
    include: { matrix: true }
  });

  if (!productMatrix) {
    return json({ error: 'No matrix assigned' }, { status: 404 });
  }

  const price = calculatePrice(
    productMatrix.matrix,
    width,
    height
  );

  return json({
    productId: params.productId,
    dimensions: { width, height },
    matrix: formatMatrixResponse(productMatrix.matrix),
    price
  });
}

function calculatePrice(matrix: Matrix, width: number, height: number) {
  const widthBreakpoints = matrix.widthBreakpoints as number[];
  const heightBreakpoints = matrix.heightBreakpoints as number[];

  // Round up to next breakpoint
  const widthIndex = widthBreakpoints.findIndex(bp => width <= bp);
  const heightIndex = heightBreakpoints.findIndex(bp => height <= bp);

  const prices = matrix.prices as Record<string, Record<string, string>>;
  return {
    amount: prices[widthIndex][heightIndex],
    currencyCode: 'USD'
  };
}
```

### Pattern 3: Draft Order Creation (Admin OR API → Shopify GraphQL)

```
1. Either:
   a) Merchant creates draft order in admin UI, OR
   b) Storefront calls REST API to create draft order
2. Handler uses Shopify Admin GraphQL API:
   mutation draftOrderCreate(...)
3. Custom price applied to line item
4. Draft order created in Shopify
5. Invoice URL returned to user
```

**Code:**
```typescript
// Shared Draft Order creation logic
async function createDraftOrder(
  admin: AdminApiContext,
  lineItems: Array<{
    productId: string;
    quantity: number;
    customPrice: number;
    customAttributes: Array<{ key: string; value: string }>;
  }>,
  customerId?: string
) {
  const mutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      customerId,
      lineItems: lineItems.map(item => ({
        variantId: item.productId,
        quantity: item.quantity,
        originalUnitPrice: item.customPrice,
        customAttributes: item.customAttributes
      }))
    }
  };

  const response = await admin.graphql(mutation, { variables });
  const data = await response.json();

  return data.data.draftOrderCreate.draftOrder;
}
```

## Build Order and Dependencies

### Phase 1: Foundation (Database + Auth)

**What to build:**
1. Database schema (Prisma)
2. Multi-tenant session storage
3. Shopify OAuth installation flow
4. Basic Remix app structure

**Why first:**
- Everything depends on database
- Auth must work before any features
- Establishes multi-tenant pattern

**Validation:**
- Can install app in test store
- Session persists across requests
- Database queries filtered by shop

### Phase 2: Admin Matrix Management

**What to build:**
1. Matrix CRUD UI (Polaris components)
2. Matrix data model and API
3. Product assignment interface
4. GraphQL queries to Shopify for products

**Depends on:**
- Phase 1 (auth and database)

**Why second:**
- Creates the data that API/widget will consume
- Merchants need this before anything else is useful

**Validation:**
- Can create/edit/delete matrices
- Can assign products to matrices
- Data persists correctly with shop isolation

### Phase 3: Public REST API

**What to build:**
1. API key generation and storage
2. API authentication middleware
3. Price lookup endpoints
4. Rate limiting
5. CORS configuration

**Depends on:**
- Phase 1 (database)
- Phase 2 (matrices must exist to query)

**Why third:**
- Widget depends on API
- Can test API independently with Postman before widget

**Validation:**
- API key auth works
- Price calculation correct
- Rate limiting functions
- CORS allows storefront domains

### Phase 4: React Widget (npm package)

**What to build:**
1. React component with Shadow DOM
2. API client for price fetching
3. Dimension input UI
4. Price display UI
5. Vite/Rollup build config
6. npm package publishing

**Depends on:**
- Phase 3 (API must be live)

**Why fourth:**
- Can develop against live API
- End-to-end testing requires API + database
- Independent npm package allows separate versioning

**Validation:**
- npm package installs correctly
- Widget renders in test storefront
- Fetches prices from API
- CSS isolated from host page

### Phase 5: Draft Order Integration

**What to build:**
1. Draft Order mutation in admin app
2. Draft Order endpoint in REST API (optional)
3. Invoice URL generation

**Depends on:**
- Phase 2 (matrices exist)
- Phase 3 (API structure established)

**Why fifth:**
- Value-add feature, not core functionality
- Requires matrix + price calculation working
- Can be added without breaking existing features

**Validation:**
- Draft Order created with custom price
- Custom attributes preserved
- Invoice URL valid

## Deployment Architecture

### Monorepo Structure

```
pricing-app/
├── app/                        # Remix app (admin + API)
│   ├── routes/
│   │   ├── app.matrices.tsx   # Admin UI routes
│   │   ├── app.products.tsx
│   │   └── api.v1.*.tsx       # Public API routes
│   ├── models/                # Prisma client wrappers
│   └── shopify.server.ts      # Shopify config
├── packages/
│   └── widget/                # React widget (separate package)
│       ├── src/
│       ├── vite.config.ts
│       └── package.json
├── prisma/
│   └── schema.prisma
├── package.json               # Root package (workspace)
└── vercel.json                # Deployment config
```

**Workspace configuration:**
```json
// package.json (root)
{
  "name": "pricing-app",
  "private": true,
  "workspaces": ["app", "packages/*"],
  "scripts": {
    "dev": "npm run dev --workspace=app",
    "build": "npm run build --workspaces",
    "deploy": "vercel"
  }
}
```

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "app/build/client",
  "serverBuildDirectory": "app/build/server",
  "framework": "remix",
  "env": {
    "SHOPIFY_API_KEY": "@shopify-api-key",
    "SHOPIFY_API_SECRET": "@shopify-api-secret",
    "DATABASE_URL": "@database-url"
  },
  "headers": [
    {
      "source": "/api/v1/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ]
}
```

### Database (Vercel Postgres or External)

**Options:**
1. **Vercel Postgres** (easiest, same platform)
2. **Railway** (cheap, good for dev)
3. **Supabase** (free tier, good backup/restore)

**Connection pooling:**
```typescript
// Required for serverless
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true'
    }
  }
});
```

## Patterns to Follow

### Pattern 1: Multi-Tenant Data Isolation

**What:** Every database query must filter by shop domain
**Why:** Prevent cross-shop data leaks in shared database
**How:**

```typescript
// Use Prisma Client extension for automatic filtering
export function getPrismaForShop(shopDomain: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query, model }) {
          // Only apply to models with shopId
          if ('shopId' in args.where || model === 'Session') {
            args.where = {
              ...args.where,
              shop: { shopDomain }
            };
          }
          return query(args);
        },
        // Apply to all query types
      }
    }
  });
}

// Usage in route handler
const { session } = await authenticate.admin(request);
const db = getPrismaForShop(session.shop);
const matrices = await db.matrix.findMany(); // Auto-filtered
```

### Pattern 2: API Versioning for Backward Compatibility

**What:** Version public API in URL path
**Why:** Allow breaking changes without breaking existing integrations
**How:**

```typescript
// app/routes/api.v1.products.$productId.price.tsx
export async function loader({ request, params }: LoaderArgs) {
  // v1 logic
}

// app/routes/api.v2.products.$productId.price.tsx
export async function loader({ request, params }: LoaderArgs) {
  // v2 logic with breaking changes
}

// Never remove v1, only deprecate after 6-12 months
```

**Rules:**
- Add optional fields freely
- Never remove required response fields within major version
- Never change HTTP status code meanings
- Document deprecations 6 months in advance

### Pattern 3: Shadow DOM for Widget CSS Isolation

**What:** Render React widget inside Shadow DOM
**Why:** Prevent host page CSS from breaking widget styles
**How:**

```typescript
// Attach Shadow DOM to host element
const shadow = hostRef.current.attachShadow({ mode: 'open' });

// Inject widget styles into Shadow DOM
const style = document.createElement('style');
style.textContent = widgetStyles;
shadow.appendChild(style);

// Render React into Shadow DOM
const container = document.createElement('div');
shadow.appendChild(container);
createRoot(container).render(<Widget {...props} />);
```

### Pattern 4: Session Token → Access Token Flow (Embedded Apps)

**What:** Use Shopify's token exchange for embedded app auth
**Why:** No redirects, better UX, recommended by Shopify
**How:**

```typescript
// Handled by @shopify/shopify-app-remix
export const authenticate = shopifyApp({
  authStrategy: 'token-exchange', // New 2024+ pattern
  sessionStorage: new PrismaSessionStorage(prisma),
  // ...
});

// In routes:
export async function loader({ request }: LoaderArgs) {
  const { admin, session } = await authenticate.admin(request);
  // session.shop, session.accessToken available
}
```

### Pattern 5: Separate Admin and API Concerns

**What:** Admin routes and API routes are separate, don't cross boundaries
**Why:** Different auth, different concerns, different consumers
**How:**

```
app/routes/
├── app.*.tsx              # Admin routes (session token auth)
└── api.v1.*.tsx           # Public API routes (API key auth)

Admin routes:
- Use authenticate.admin(request)
- Return HTML (Remix UI)
- Session-based auth

API routes:
- Use validateApiKey(request)
- Return JSON
- API key auth
- CORS headers
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Access Tokens in Frontend

**What goes wrong:** Embedding API keys in widget JavaScript
**Why it's bad:** API keys exposed in browser, anyone can steal
**Instead:**

```typescript
// BAD: Hardcoding API key in widget
<PriceMatrixWidget
  apiKey="pk_live_abc123_hardcoded"  // Exposed in source!
/>

// GOOD: Pass from server-rendered props
<PriceMatrixWidget
  apiKey={process.env.SHOPIFY_STOREFRONT_TOKEN}  // Server-only
/>

// OR: Proxy through merchant's backend
// Widget calls merchant's backend → backend calls your API with key
```

### Anti-Pattern 2: Missing Shop Filter in Database Queries

**What goes wrong:** Forgetting to filter by shop domain
**Consequences:** Data leaks across merchants (critical security bug)
**Prevention:**

```typescript
// BAD: No shop filter
const matrix = await prisma.matrix.findUnique({
  where: { id: matrixId }
});
// Any shop can access any matrix!

// GOOD: Always filter by shop
const matrix = await prisma.matrix.findUnique({
  where: {
    id: matrixId,
    shop: { shopDomain: session.shop }
  }
});
// Or use Prisma extension from Pattern 1
```

### Anti-Pattern 3: Coupling Widget to Admin App

**What goes wrong:** Widget calls admin app routes directly
**Why it's bad:**
- Auth mismatch (session tokens vs API keys)
- Tight coupling prevents independent versioning
- CORS issues

**Instead:**

```typescript
// BAD: Widget calls admin route
fetch('https://app.vercel.app/app/matrices/123/price')

// GOOD: Widget calls public API
fetch('https://app.vercel.app/api/v1/products/123/price', {
  headers: { 'X-API-Key': apiKey }
})
```

### Anti-Pattern 4: Not Using Webhooks for Shopify Data

**What goes wrong:** Polling Shopify GraphQL API for product changes
**Why it's bad:**
- Rate limits
- Stale data
- Wasted requests

**Instead:**

```typescript
// Register webhooks on app install
export async function loader({ request }: LoaderArgs) {
  const { admin } = await authenticate.admin(request);

  await admin.webhook.subscribe({
    topic: 'PRODUCTS_UPDATE',
    callbackUrl: '/webhooks/products/update'
  });
}

// Handle webhook
export async function action({ request }: ActionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);

  if (topic === 'PRODUCTS_UPDATE') {
    // Update local cache/database
  }
}
```

### Anti-Pattern 5: Bundling React in Widget Package

**What goes wrong:** Including React in widget bundle
**Why it's bad:**
- Duplicate React on page (version conflicts)
- Large bundle size
- Hydration errors

**Instead:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'], // Don't bundle
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});

// package.json
{
  "peerDependencies": {
    "react": "^18.0.0",      // Require from host
    "react-dom": "^18.0.0"
  }
}
```

## Scalability Considerations

| Concern | At 100 Shops | At 1K Shops | At 10K Shops |
|---------|--------------|-------------|--------------|
| **Database** | Single Postgres on Vercel | Connection pooling (PgBouncer) | Read replicas for API queries |
| **API Rate Limits** | In-memory rate limiting | Redis-backed rate limiting | Distributed rate limiting (Upstash) |
| **Widget CDN** | npm registry | CDN cache (jsDelivr) | Self-hosted CDN (Cloudflare) |
| **Session Storage** | Postgres | Postgres with indexes | Redis sessions, Postgres for app data |
| **Shopify API Calls** | Direct calls | Batch queries | Webhook-driven cache, batch with DataLoader |

## Security Checklist

- [ ] All database queries filtered by shop domain
- [ ] API keys hashed/encrypted in database
- [ ] CORS restricted to allowed domains (configurable per shop)
- [ ] Rate limiting prevents abuse
- [ ] Input validation on dimensions (prevent injection)
- [ ] HTTPS only (enforced by Vercel)
- [ ] Environment variables for secrets (never in code)
- [ ] Webhook signature verification
- [ ] SQL injection prevented (Prisma parameterization)
- [ ] XSS prevention in widget (sanitize inputs)

## Technology Confidence Assessment

| Technology | Confidence | Source |
|------------|------------|--------|
| Remix/React Router v7 | HIGH | Official Shopify template, [Shopify docs](https://shopify.dev/docs/apps/build/build?framework=remix) |
| Prisma + PostgreSQL | HIGH | Official Shopify session storage package, [npm package](https://www.npmjs.com/package/@shopify/shopify-app-session-storage-prisma) |
| Token Exchange Auth | HIGH | Recommended by Shopify 2024+, [Auth docs](https://shopify.dev/docs/apps/build/authentication-authorization) |
| Vercel Deployment | HIGH | Common pattern, [deployment guide](https://maxrozen.com/deploying-node-react-shopify-apps-on-vercel) |
| Shadow DOM for Widget | MEDIUM | Established pattern, [multiple implementations](https://blog.gooey.ai/embeddable-web-widget-made-with-react) |
| Draft Order GraphQL | HIGH | Official API, [mutation docs](https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftordercreate) |
| Multi-tenant Prisma | MEDIUM | Community patterns, [discussion](https://github.com/prisma/prisma/discussions/2846) |

## Sources

### Architecture & Patterns
- [Shopify App Template - Remix](https://github.com/Shopify/shopify-app-template-remix)
- [Build a Shopify app using Remix](https://shopify.dev/docs/apps/build/build?framework=remix)
- [Shopify multi-tenant architecture](https://www.infoq.com/presentations/shopify-architecture-flash-sale/)
- [Multi-tenant architecture guide 2026](https://www.rigbyjs.com/resources/multi-tenant-architecture)

### Authentication
- [Shopify API authentication](https://shopify.dev/docs/api/usage/authentication)
- [Embedded app authorization](https://shopify.dev/docs/apps/build/authentication-authorization/set-embedded-app-authorization)
- [Token exchange pattern](https://shopify.dev/docs/apps/build/authentication-authorization)

### Database & Session Storage
- [@shopify/shopify-app-session-storage-prisma](https://www.npmjs.com/package/@shopify/shopify-app-session-storage-prisma)
- [Prisma with Shopify guide](https://www.prisma.io/docs/guides/shopify)
- [Prisma multi-tenant patterns](https://zenstack.dev/blog/multi-tenant)
- [Row Level Security with Prisma](https://medium.com/@francolabuschagne90/securing-multi-tenant-applications-using-row-level-security-in-postgresql-with-prisma-orm-4237f4d4bd35)

### React Widget
- [React widget distribution guide](https://blog.logrocket.com/the-complete-guide-to-publishing-a-react-package-to-npm/)
- [Shadow DOM for CSS isolation](https://blog.gooey.ai/embeddable-web-widget-made-with-react)
- [Bundling React components with Rollup](https://medium.com/@bnivyan09/creating-bundling-and-publishing-a-react-package-with-rollup-and-typescript-bf94b38c97b4)
- [React best practices 2026](https://xpertlab.com/react-js-latest-features-and-best-practices-in-2026/)

### API Design
- [Shopify REST Admin API](https://shopify.dev/docs/api/admin-rest)
- [Draft Order API](https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftordercreate)
- [API versioning best practices](https://www.speakeasy.com/api-design/versioning)
- [REST API backward compatibility](https://medium.com/@fahimad/api-versioning-strategies-backward-compatibility-in-rest-apis-234bafd5388e)

### Deployment
- [Deploying Shopify apps on Vercel](https://maxrozen.com/deploying-node-react-shopify-apps-on-vercel)
- [Vercel and Shopify integration](https://vercel.com/docs/integrations/ecommerce/shopify)
- [Shopify app structure](https://shopify.dev/docs/apps/build/cli-for-apps/app-structure)

### Headless Commerce
- [Shopify headless architecture](https://ecommerce.folio3.com/blog/how-to-integrate-react-app-in-shopify/)
- [Hydrogen React components](https://shopify.dev/docs/api/hydrogen-react)
- [Storefront API](https://shopify.dev/docs/api/storefront/latest)
