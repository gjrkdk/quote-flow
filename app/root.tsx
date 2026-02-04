import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";

function Document({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="shopify-api-key"
          content={process.env.SHOPIFY_API_KEY || ""}
        />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  return (
    <Document>
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>Something went wrong</h1>
        {isRouteErrorResponse(error) ? (
          <p>
            {error.status} {error.statusText}
          </p>
        ) : error instanceof Error ? (
          <p>{error.message}</p>
        ) : (
          <p>Unknown error</p>
        )}
        <a
          href="/auth/login"
          style={{ marginTop: "1rem", display: "inline-block" }}
        >
          Try installing again
        </a>
      </div>
    </Document>
  );
}
