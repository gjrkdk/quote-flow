import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { BillingReplacementBehavior } from "@shopify/shopify-api";
import { PostgreSQLSessionStorage } from "@shopify/shopify-app-session-storage-postgresql";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-01";
import pg from "pg";

// The Shopify session storage package creates pg.Pool without SSL options,
// but Neon requires SSL. Setting pg.defaults.ssl ensures all pg connections use SSL.
if (process.env.DATABASE_URL?.includes("neon.tech")) {
  pg.defaults.ssl = true;
}

// Export session storage so REST API routes can load offline sessions directly.
// The embedded auth strategy (token exchange) returns short-lived tokens,
// but offline sessions have permanent access tokens needed for REST API calls.
export const sessionStorage = new PostgreSQLSessionStorage(
  process.env.DATABASE_URL || "",
);

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January24,
  scopes: process.env.SCOPES?.split(",") || [],
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage,
  distribution: AppDistribution.AppStore,
  restResources,
  billing: {
    UNLIMITED_PLAN: {
      amount: 12.0,
      currencyCode: "USD",
      interval: BillingInterval.Every30Days,
      trialDays: 14,
      replacementBehavior: BillingReplacementBehavior.ApplyImmediately,
    },
  },
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session });
    },
  },
});

export default shopify;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const login = shopify.login;
