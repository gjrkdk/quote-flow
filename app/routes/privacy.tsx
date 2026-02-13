import type { MetaFunction, HeadersFunction } from "@remix-run/node";
import { Links, Meta, Scripts, ScrollRestoration } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Privacy Policy - Price Matrix" },
    {
      name: "description",
      content:
        "Privacy policy for Price Matrix Shopify app. Learn how we collect, use, and protect your data.",
    },
  ];
};

export const headers: HeadersFunction = () => {
  return {
    "Cache-Control": "public, max-age=86400",
  };
};

// Override default layout to avoid Shopify App Bridge on public page
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
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

export default function Privacy() {
  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
        lineHeight: "1.7",
        color: "#1a1a1a",
        backgroundColor: "#fafafa",
        padding: "40px 20px",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          padding: "60px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "12px",
            color: "#1a1a1a",
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#666",
            marginBottom: "40px",
          }}
        >
          Effective Date: February 2026
        </p>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            About This App
          </h2>
          <p style={{ marginBottom: "12px" }}>
            Price Matrix is a Shopify app that enables merchants to offer custom
            dimension-based pricing and option group selections on their
            storefronts. This privacy policy explains how we collect, use, and
            protect your data.
          </p>
          <p style={{ marginBottom: "12px" }}>
            <strong>App Name:</strong> Price Matrix
          </p>
          <p style={{ marginBottom: "12px" }}>
            <strong>Developer:</strong> Robin Konijnendijk
          </p>
          <p style={{ marginBottom: "12px" }}>
            <strong>Contact Email:</strong>{" "}
            <a
              href="mailto:robin@boldinnovations.io"
              style={{ color: "#0070f3", textDecoration: "none" }}
            >
              robin@boldinnovations.io
            </a>
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Data We Collect
          </h2>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "12px",
              marginTop: "20px",
              color: "#333",
            }}
          >
            From Merchants
          </h3>
          <p style={{ marginBottom: "12px" }}>
            When you install and use Price Matrix, we collect:
          </p>
          <ul style={{ marginLeft: "24px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "8px" }}>
              Shopify store domain and session tokens (for authentication)
            </li>
            <li style={{ marginBottom: "8px" }}>
              Pricing matrix configurations (dimension breakpoints and prices)
            </li>
            <li style={{ marginBottom: "8px" }}>
              Option group configurations (choices and price modifiers)
            </li>
            <li style={{ marginBottom: "8px" }}>
              Product assignment data (which products use which pricing
              configurations)
            </li>
            <li style={{ marginBottom: "8px" }}>
              API keys (generated per store for REST API access)
            </li>
          </ul>

          <h3
            style={{
              fontSize: "18px",
              fontWeight: "600",
              marginBottom: "12px",
              marginTop: "20px",
              color: "#333",
            }}
          >
            From Your Customers
          </h3>
          <p style={{ marginBottom: "12px" }}>
            When your customers interact with the Price Matrix widget on your
            storefront:
          </p>
          <ul style={{ marginLeft: "24px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "8px" }}>
              Product dimensions entered for pricing calculations (not stored
              permanently in our database)
            </li>
            <li style={{ marginBottom: "8px" }}>
              Option selections for pricing calculations (not stored permanently
              in our database)
            </li>
            <li style={{ marginBottom: "8px" }}>
              Draft order data passed to Shopify (stored in Shopify's systems,
              with only order references maintained in our database)
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            How We Use Your Data
          </h2>
          <ul style={{ marginLeft: "24px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "8px" }}>
              <strong>Merchant Data:</strong> To provide pricing matrix and
              option group functionality, display your configurations in the
              admin interface, and enable API access to your pricing data
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Customer Data:</strong> To calculate prices based on
              entered dimensions and selected options, and to create Shopify
              draft orders on behalf of your store
            </li>
          </ul>
          <p style={{ marginBottom: "12px" }}>
            We do not sell, rent, or share your data with third parties for
            advertising or marketing purposes. We do not track your customers
            across websites or use their data for any purpose other than
            providing the pricing functionality.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Third-Party Services
          </h2>
          <p style={{ marginBottom: "12px" }}>
            To provide our services, we use the following third-party providers:
          </p>
          <ul style={{ marginLeft: "24px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "8px" }}>
              <strong>Vercel:</strong> Hosting platform for our application and
              serverless functions. Processes all HTTP requests to the app.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Neon (PostgreSQL):</strong> Database service that stores
              merchant configuration data (pricing matrices, option groups,
              product assignments).
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Shopify:</strong> Platform provider. We use Shopify's APIs
              to create draft orders, access product data, and authenticate
              merchant sessions.
            </li>
          </ul>
          <p style={{ marginBottom: "12px" }}>
            These services process data on our behalf and are subject to their
            own privacy policies and data protection agreements.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Data Retention and Deletion
          </h2>
          <ul style={{ marginLeft: "24px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "8px" }}>
              <strong>While App is Installed:</strong> Merchant configuration
              data is retained in our database to provide app functionality.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>On App Uninstall:</strong> When you uninstall the app,
              Shopify sends us a SHOP_REDACT webhook. We delete all your store's
              data from our database within 48 hours of receiving this webhook.
              This process is GDPR compliant and was implemented in Phase 15 of
              our development.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Customer Data:</strong> Customer dimension inputs and
              option selections are processed in real-time for pricing
              calculations and are not permanently stored in our database. Draft
              order references are stored only as needed for order tracking.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>GDPR Webhooks:</strong> We handle Shopify's
              CUSTOMERS_DATA_REQUEST webhook (to provide customer data access)
              and CUSTOMERS_REDACT webhook (to delete customer data upon
              request).
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Your Privacy Rights
          </h2>
          <p style={{ marginBottom: "12px" }}>
            Under GDPR (for EU residents) and CCPA (for California residents),
            you have the following rights:
          </p>
          <ul style={{ marginLeft: "24px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "8px" }}>
              <strong>Right to Access:</strong> You can request a copy of the
              data we have stored about your store.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Right to Deletion:</strong> You can request deletion of
              your data at any time (this happens automatically when you
              uninstall the app).
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Right to Data Portability:</strong> You can request your
              data in a machine-readable format.
            </li>
            <li style={{ marginBottom: "8px" }}>
              <strong>Right to Rectification:</strong> You can update or correct
              your data through the app's admin interface at any time.
            </li>
          </ul>
          <p style={{ marginBottom: "12px" }}>
            To exercise any of these rights, please contact us at{" "}
            <a
              href="mailto:robin@boldinnovations.io"
              style={{ color: "#0070f3", textDecoration: "none" }}
            >
              robin@boldinnovations.io
            </a>
            . We will respond to your request within 30 days.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Security
          </h2>
          <p style={{ marginBottom: "12px" }}>
            We implement industry-standard security measures to protect your
            data:
          </p>
          <ul style={{ marginLeft: "24px", marginBottom: "16px" }}>
            <li style={{ marginBottom: "8px" }}>
              All data transmission uses HTTPS encryption
            </li>
            <li style={{ marginBottom: "8px" }}>
              Shopify OAuth for secure merchant authentication
            </li>
            <li style={{ marginBottom: "8px" }}>
              API key authentication for REST API access
            </li>
            <li style={{ marginBottom: "8px" }}>
              Database hosted in secure, SOC 2 compliant infrastructure (Neon)
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Updates to This Policy
          </h2>
          <p style={{ marginBottom: "12px" }}>
            We may update this privacy policy from time to time to reflect
            changes in our practices or legal requirements. We will notify you
            of any material changes by updating the effective date at the top of
            this page. Continued use of the app after changes constitutes
            acceptance of the updated policy.
          </p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#1a1a1a",
            }}
          >
            Contact Us
          </h2>
          <p style={{ marginBottom: "12px" }}>
            If you have any questions about this privacy policy or how we handle
            your data, please contact us:
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:robin@boldinnovations.io"
              style={{ color: "#0070f3", textDecoration: "none" }}
            >
              robin@boldinnovations.io
            </a>
          </p>
          <p style={{ marginBottom: "8px" }}>
            <strong>Developer:</strong> Robin Konijnendijk
          </p>
        </section>
      </div>
    </div>
  );
}
