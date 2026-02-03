# Technology Stack

**Project:** Shopify Price Matrix App
**Researched:** 2026-02-03
**Overall Confidence:** HIGH

## Executive Summary

The Shopify app ecosystem is in transition as of early 2026. Remix has merged with React Router v7, and Polaris React was deprecated in favor of framework-agnostic Polaris Web Components. For a production app in 2026, this creates important architectural decisions around whether to use the legacy Remix template or migrate to the newer React Router approach.

**Critical Decision Required:** The official Shopify Remix template still exists but Shopify now recommends React Router for new projects. However, for this specific project with dual requirements (embedded admin app + standalone React widget), staying with Remix may provide better separation of concerns until React Router patterns stabilize.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Remix** | Latest (via `@shopify/shopify-app-remix` 4.1.0) | Embedded admin app framework | Shopify's official template with built-in OAuth, session management, and App Bridge. Despite React Router recommendation for new apps, Remix template remains fully functional and better understood. | HIGH |
| **Node.js** | 20.x LTS | Runtime environment | Vercel default, LTS until April 2026. Required for Polaris Web Components compatibility (v20+). | HIGH |
| **TypeScript** | 5.x | Type safety | Industry standard for React/Remix apps, required for component library. | HIGH |
| **Polaris Web Components** | Latest (CDN) | Admin UI components | Replaces deprecated Polaris React. Framework-agnostic, works with Remix/React. Loaded via CDN: `https://cdn.shopify.com/shopifycloud/polaris.js` | MEDIUM |

**Critical Notes:**
- **Polaris React is deprecated** (archived Jan 6, 2026). Do not use `@shopify/polaris` npm package.
- Remix template still maintained but Shopify encourages React Router for new projects.
- For this project, Remix provides cleaner separation: admin app (Remix) + widget (standalone React).

### Database & ORM

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Prisma ORM** | 7.2.0+ | Database toolkit | Shopify's recommended ORM. Version 7 is Rust-free (90% smaller bundles, 3x faster queries). Official Shopify session storage adapter available. | HIGH |
| **PostgreSQL** | Latest (via Neon) | Primary database | Industry standard. Neon provides serverless Postgres with Vercel integration (Vercel Postgres transitioned to Neon in Q4 2024). | HIGH |
| **Neon** | Serverless driver | Postgres hosting | Vercel's recommended Postgres provider. Serverless driver works with Edge Functions. Use pooled connection (`-pooler` hostname). | HIGH |
| **@shopify/shopify-app-session-storage-prisma** | Latest | Session storage | Official Shopify adapter for storing OAuth sessions in Prisma. 21,689 weekly downloads, actively maintained. | HIGH |

**Configuration Notes:**
- Use Neon's pooled connection for app (`-pooler` in hostname)
- Use direct connection for Prisma CLI migrations
- As of Prisma 5.10.0 + PgBouncer 1.22.0, only pooled connection needed (no `pgbouncer=true` param)

### Deployment & Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Vercel** | N/A | Hosting platform | Native Remix support with serverless + edge functions. Auto-detects framework. Node.js 20 default. Zero-config deployment. | HIGH |
| **Vercel Serverless Functions** | Node.js 20 runtime | API endpoints | Custom REST API endpoints for price lookups. Supports TypeScript, automatic routing from file structure. | HIGH |

**Deployment Architecture:**
- Remix app → Vercel Serverless Functions (OAuth, admin routes)
- Custom REST API → Vercel Serverless Functions (`/api/*` routes)
- Static assets → Vercel CDN
- Database → Neon Postgres (serverless, auto-scaling)

### React Component Library (npm Widget)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **React** | 19.x | UI library for widget | Latest stable. Polaris Web Components compatible with React 19 (framework-agnostic). Widget targets headless storefronts. | HIGH |
| **Vite** | 7.x | Build tool | Modern, fast. Library mode for bundling React components. Better DX than Rollup alone. `vite-plugin-lib-inject-css` for CSS handling. | HIGH |
| **vite-plugin-lib-inject-css** | Latest | CSS injection | Solves Vite's CSS module problem - auto-generates import statements for CSS in bundle. Zero config. | MEDIUM |
| **vite-plugin-externalize-deps** | Latest | Dependency externalization | Prevents bundling React/ReactDOM. Essential for library mode to avoid duplicate React instances. | MEDIUM |
| **tsup** (alternative) | Latest | TypeScript bundler | Simpler alternative to Vite for pure TS libraries. Esbuild-powered, zero-config. Consider if widget has no special build requirements. | MEDIUM |

**Why Vite over tsup/Rollup:**
- **Vite:** Best for component libraries needing visual development (Storybook integration, HMR). Uses Rollup internally for production builds.
- **tsup:** Better for simple utility libraries without visual development needs.
- **Rollup alone:** Too complex, Vite provides better DX.

**Library Structure:**
```
packages/
  widget/              # React component library
    src/
      components/
      index.ts
    package.json       # Published to npm
    vite.config.ts     # Library mode
  app/                 # Remix admin app
    app/
    public/
    package.json
```

### Shopify Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **@shopify/shopify-app-remix** | 4.1.0+ | Shopify app framework | Official package for OAuth, session management, GraphQL client, webhooks. Despite React Router recommendation, still actively maintained. | HIGH |
| **@shopify/app-bridge** | Latest (CDN) | Embedded app SDK | Required for embedded admin apps. Loaded via CDN: `https://cdn.shopify.com/shopifycloud/app-bridge.js` | HIGH |
| **Shopify GraphQL Admin API** | 2026-01 | Store data access | For managing app data, Draft Orders, products. REST API is legacy (deprecated Oct 2024), use GraphQL exclusively. | HIGH |

**Authentication Strategy:**
- **Admin app:** OAuth 2.0 via `@shopify/shopify-app-remix` (per-store access tokens)
- **REST API for storefronts:** Custom API keys stored in database (per-store)
  - Generate on install, store in Prisma DB
  - Validate in API middleware
  - NOT Shopify's access tokens (those are for admin API only)

**Draft Orders API:**
- Use `draftOrderCreate` mutation with `lineItem.priceOverride` for custom prices
- Prices lock on creation (basis for tax, discount calculations)
- As of 2025-01 API version, custom prices fully supported

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **zod** | Latest | Runtime validation | Validate API requests, env vars, form data. TypeScript-first schema validation. | HIGH |
| **dotenv** | Latest | Environment variables | Development only. Vercel uses native env vars in production. | HIGH |
| **@remix-run/node** | Latest | Server utilities | Headers, redirects, JSON responses in Remix loaders/actions. | HIGH |
| **@remix-run/react** | Latest | React utilities | Remix routing hooks, form components. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not | Confidence |
|----------|-------------|-------------|---------|------------|
| **Framework** | Remix (via Shopify template) | React Router v7 (new Shopify recommendation) | React Router is future direction but Remix template more mature. Migration path exists. For dual architecture (admin + widget), Remix cleaner. | MEDIUM |
| **Framework** | Remix | Next.js + Shopify template | Next.js templates exist but Remix is Shopify's official choice. Next.js requires more custom OAuth setup. | HIGH |
| **UI Components** | Polaris Web Components | Polaris React | Polaris React deprecated Jan 2026. Web Components are framework-agnostic and actively maintained. | HIGH |
| **ORM** | Prisma | Raw SQL / Drizzle | Prisma has official Shopify adapters, excellent DX, and version 7 is performant. Drizzle lighter but less Shopify integration. | MEDIUM |
| **Database** | Neon Postgres | Vercel Postgres / Railway / Supabase | Vercel transitioned to Neon (Q4 2024). Native Vercel integration, serverless, generous free tier. | MEDIUM |
| **Deployment** | Vercel | Cloudflare Workers / Railway / Fly.io | Vercel has best Remix support, zero config. Cloudflare Workers require adapter, more complex for Remix. | HIGH |
| **Component Bundler** | Vite | Rollup alone | Vite provides better DX with HMR, Storybook integration. Uses Rollup internally for production builds. | MEDIUM |
| **Component Bundler** | Vite | tsup | Vite better for visual component development. tsup better for pure utility libraries. | MEDIUM |
| **Bundler for npm** | Vite library mode | Webpack | Webpack too complex for library bundling. Vite/Rollup designed for libraries. | HIGH |

## What NOT to Use

| Technology | Why Avoid | Instead Use |
|------------|-----------|-------------|
| **@shopify/polaris (npm)** | Deprecated Jan 2026, archived repository. No React 19 support. | Polaris Web Components (CDN) |
| **Polaris React components** | Entire React library deprecated. | Web Components with JSX wrappers if needed |
| **Shopify REST Admin API** | Legacy as of Oct 2024. New public apps must use GraphQL (as of April 2025). | GraphQL Admin API |
| **Custom apps via Shopify Admin** | Disabled Jan 1, 2026. | Apps via Shopify CLI or Dev Dashboard only |
| **Vercel Postgres direct** | Transitioned to Neon partnership. | Neon (via Vercel integration) |
| **Node.js 18 or lower** | Polaris v13 requires Node 20+. Node 18 support ends April 2025. | Node.js 20 LTS |
| **Remix with custom OAuth** | Shopify template handles OAuth. Don't reinvent. | @shopify/shopify-app-remix |

## Monorepo Structure (Recommended)

For this project with both admin app and npm widget:

```
pricing-app/
├── packages/
│   ├── widget/                    # Published to npm
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── PriceMatrix.tsx
│   │   │   │   └── DimensionInput.tsx
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── package.json           # "@your-org/shopify-price-widget"
│   │   ├── vite.config.ts         # Library mode config
│   │   └── tsconfig.json
│   └── app/                       # Remix admin app
│       ├── app/
│       │   ├── routes/
│       │   │   ├── app._index.tsx      # Dashboard
│       │   │   ├── api.price.ts        # REST endpoint
│       │   │   └── webhooks.tsx
│       │   ├── models/
│       │   │   └── matrix.server.ts
│       │   └── root.tsx
│       ├── prisma/
│       │   └── schema.prisma
│       ├── public/
│       ├── package.json
│       └── vercel.json             # If needed (usually auto-detected)
├── package.json                    # Root package.json (workspaces)
├── pnpm-workspace.yaml             # or package.json workspaces
└── tsconfig.json                   # Shared config

```

**Workspace Manager:** Use **pnpm** (recommended) or npm workspaces. pnpm faster, better monorepo support.

## Installation

### Initial Setup (Shopify Remix App)

```bash
# Using Shopify CLI (recommended)
npm init @shopify/app@latest
# Select: Remix > TypeScript

cd your-app-name
npm install

# Add Prisma
npm install prisma @prisma/client @shopify/shopify-app-session-storage-prisma
npx prisma init

# Add additional dependencies
npm install zod
npm install -D @types/node
```

### Prisma Setup

```bash
# Configure DATABASE_URL in .env
echo "DATABASE_URL=postgresql://user:pass@host/db?sslmode=require" > .env

# Update schema.prisma with Session model (required for Shopify)
# See @shopify/shopify-app-session-storage-prisma docs for schema

# Run migrations
npx prisma migrate dev --name init
npx prisma generate
```

### Widget Package (Separate)

```bash
mkdir -p packages/widget
cd packages/widget

# Initialize package
npm init -y

# Install dependencies
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
npm install -D vite-plugin-lib-inject-css vite-plugin-externalize-deps

# Configure vite.config.ts for library mode (see below)
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from app directory)
cd packages/app
vercel

# Set environment variables in Vercel dashboard:
# - DATABASE_URL (Neon connection string with -pooler)
# - SHOPIFY_API_KEY
# - SHOPIFY_API_SECRET
# - SHOPIFY_SCOPES
# - SHOPIFY_APP_URL
```

### Vite Library Config Example

```typescript
// packages/widget/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    externalizeDeps(), // Externalizes all deps from package.json
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'ShopifyPriceWidget',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

## Environment Variables

### Development (.env)

```bash
# Shopify App
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_draft_orders
SHOPIFY_APP_URL=https://your-app.ngrok.io

# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-xyz-pooler.region.neon.tech/dbname?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xyz.region.neon.tech/dbname?sslmode=require

# Optional
NODE_ENV=development
```

### Production (Vercel Environment Variables)

Set in Vercel dashboard under Project Settings > Environment Variables:
- `SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_SCOPES`
- `SHOPIFY_APP_URL` (auto-populated via Vercel URL)
- `DATABASE_URL` (Neon pooled connection)
- `DIRECT_URL` (Neon direct connection, for migrations)

## Critical Configuration Notes

### 1. Polaris Web Components Setup (Remix)

**app/root.tsx:**
```tsx
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

export default function App() {
  return (
    <html>
      <head>
        <Meta />
        <Links />
        {/* App Bridge - MUST load before Polaris */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        {/* Polaris Web Components */}
        <script src="https://cdn.shopify.com/shopifycloud/polaris.js" />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
```

**Using Polaris components in Remix:**
```tsx
// Use as JSX (React 18+ compatibility)
export default function Dashboard() {
  return (
    <ui-page>
      <ui-layout>
        <ui-layout-section>
          <ui-card>
            <ui-text variant="headingMd">Price Matrix</ui-text>
          </ui-card>
        </ui-layout-section>
      </ui-layout>
    </ui-page>
  );
}
```

**Remix router integration:**
```tsx
// Handle Polaris navigation with Remix router
import { useNavigate } from "@remix-run/react";

useEffect(() => {
  const handleNavigate = (event: CustomEvent) => {
    const navigate = useNavigate();
    navigate(event.detail.url);
  };

  window.addEventListener('shopify:navigate', handleNavigate as EventListener);

  return () => {
    window.removeEventListener('shopify:navigate', handleNavigate as EventListener);
  };
}, []);
```

### 2. Prisma Session Storage Schema

**prisma/schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}

generator client {
  provider = "prisma-client-js"
}

model Session {
  id          String    @id
  shop        String
  state       String
  isOnline    Boolean   @default(false)
  scope       String?
  expires     DateTime?
  accessToken String    @db.Text
  userId      BigInt?
  firstName   String?
  lastName    String?
  email       String?
  accountOwner Boolean  @default(false)
  locale      String?
  collaborator Boolean? @default(false)
  emailVerified Boolean? @default(false)
}

model Store {
  id        String   @id @default(cuid())
  shop      String   @unique
  apiKey    String   @unique @default(cuid()) // For REST API auth
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PriceMatrix {
  id          String   @id @default(cuid())
  shop        String
  name        String
  minWidth    Float
  maxWidth    Float
  minHeight   Float
  maxHeight   Float
  pricePerUnit Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([shop])
}
```

### 3. Custom REST API for Storefronts

**app/routes/api.price.ts:**
```typescript
import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const apiKey = request.headers.get("X-API-Key");
  const width = url.searchParams.get("width");
  const height = url.searchParams.get("height");

  // Validate API key
  const store = await prisma.store.findUnique({
    where: { apiKey: apiKey || "" },
  });

  if (!store) {
    return json({ error: "Invalid API key" }, { status: 401 });
  }

  // Find matching matrix
  const matrix = await prisma.priceMatrix.findFirst({
    where: {
      shop: store.shop,
      minWidth: { lte: Number(width) },
      maxWidth: { gte: Number(width) },
      minHeight: { lte: Number(height) },
      maxHeight: { gte: Number(height) },
    },
  });

  if (!matrix) {
    return json({ error: "No price found for dimensions" }, { status: 404 });
  }

  const totalPrice = matrix.pricePerUnit * Number(width) * Number(height);

  return json({
    price: totalPrice,
    currency: "USD",
    matrix: matrix.name,
  });
}
```

### 4. Widget npm Package.json

**packages/widget/package.json:**
```json
{
  "name": "@your-org/shopify-price-widget",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/style.css"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "vite build && tsc --emitDeclarationOnly",
    "dev": "vite"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.0.0",
    "vite": "^7.0.0",
    "vite-plugin-lib-inject-css": "^2.0.0",
    "vite-plugin-externalize-deps": "^0.8.0"
  }
}
```

## TypeScript Configuration

### Remix App (packages/app/tsconfig.json)

```json
{
  "include": ["**/*.ts", "**/*.tsx"],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "target": "ES2022",
    "strict": true,
    "allowJs": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./app/*"]
    },
    "noEmit": true
  }
}
```

### Widget (packages/widget/tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    "declaration": true,
    "declarationDir": "./dist",
    "emitDeclarationOnly": false
  },
  "include": ["src"]
}
```

## Version Matrix (Quick Reference)

| Technology | Minimum | Recommended | Latest Verified |
|------------|---------|-------------|-----------------|
| Node.js | 20.0.0 | 20.11.1 (Vercel default) | 20.x LTS |
| TypeScript | 5.0.0 | 5.6.x | 5.6.3 |
| React | 18.0.0 | 19.x | 19.0.0 |
| Remix | Latest in template | Latest | Via @shopify/shopify-app-remix 4.1.0 |
| Prisma | 5.10.0 | 7.2.0+ | 7.2.0 |
| Vite | 5.0.0 | 7.x | 7.x |
| @shopify/shopify-app-remix | 3.x | 4.1.0+ | 4.1.0 |

## Migration Path (If Starting Today)

**Option 1: Use Remix Template (Recommended for this project)**
- Start with `@shopify/shopify-app-remix` template
- Stable, well-documented, production-ready
- Migrate to React Router later when patterns stabilize
- Best for dual architecture (admin app + separate widget)

**Option 2: Use React Router Template (Future-proof)**
- Start with new `@shopify/shopify-app-react-router` template
- Future direction, but less mature
- May require more custom configuration
- Consider if building single-purpose app (no separate widget)

**Recommendation:** Start with Remix (Option 1). The template is mature, the monorepo structure cleanly separates admin app from widget, and a migration path to React Router exists when needed.

## Sources

### Official Shopify Documentation
- [Shopify Remix App Template](https://github.com/Shopify/shopify-app-template-remix)
- [Shopify API: Using Polaris Web Components](https://shopify.dev/docs/api/app-home/using-polaris-components)
- [Shopify GraphQL Admin API](https://shopify.dev/docs/api/admin-graphql/latest)
- [Draft Orders: Set Custom Prices](https://shopify.dev/changelog/set-custom-prices-in-draft-orders)
- [Shopify App Authentication](https://shopify.dev/docs/apps/build/authentication-authorization)

### Framework & Tools
- [Polaris React Repository (Deprecated)](https://github.com/Shopify/polaris-react)
- [Polaris—unified and for the web (2025)](https://www.shopify.com/partners/blog/polaris-unified-and-for-the-web)
- [Vercel Remix Integration](https://vercel.com/blog/vercel-remix-integration-with-edge-functions-support)
- [Vercel Node.js Versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Prisma ORM 7.2.0 Release](https://www.prisma.io/blog/announcing-prisma-orm-7-2-0)
- [Neon: Connect from Prisma](https://neon.com/docs/guides/prisma)

### Component Library
- [Vite: Library Mode](https://dev.to/receter/how-to-create-a-react-component-library-using-vites-library-mode-4lma)
- [tsup vs Vite/Rollup](https://dropanote.de/en/blog/20250914-tsup-vs-vite-rollup-when-simple-beats-complex/)
- [React Component Libraries 2026 Guide](https://yakhil25.medium.com/react-component-libraries-in-2026-the-definitive-guide-to-choosing-your-stack-fa7ae0368077)

### Version Information (WebSearch findings - verify with official docs)
- [@shopify/shopify-app-remix on npm](https://www.npmjs.com/package/@shopify/shopify-app-remix) (version 4.1.0)
- [Prisma Releases](https://github.com/prisma/prisma/releases) (version 7.2.0+)
- [Vercel Changelog: Node.js 20 LTS](https://vercel.com/changelog/node-js-v20-lts-is-now-generally-available)

### Package Managers
- [@shopify/shopify-app-session-storage-prisma](https://www.npmjs.com/package/@shopify/shopify-app-session-storage-prisma)
- [Monorepos in JavaScript & TypeScript](https://www.robinwieruch.de/javascript-monorepos/)

**Note:** All version numbers verified as of February 3, 2026. Always check official documentation for latest versions before starting development.
