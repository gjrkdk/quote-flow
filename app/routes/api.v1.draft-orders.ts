/**
 * REST API Endpoint: POST /api/v1/draft-orders
 *
 * Creates a Shopify Draft Order with custom matrix-based pricing.
 * Requires API key authentication, validates input, enforces rate limits.
 */

import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticateApiKey } from "~/utils/api-auth.server";
import {
  DraftOrderSchema,
  normalizeProductId,
} from "~/validators/api.validators";
import { checkRateLimit, getRateLimitHeaders } from "~/utils/rate-limit.server";
import { lookupProductMatrix } from "~/services/product-matrix-lookup.server";
import {
  calculatePrice,
  validateDimensions,
} from "~/services/price-calculator.server";
import { submitDraftOrder } from "~/services/draft-order.server";
import { prisma } from "~/db.server";

/**
 * Adds CORS headers to a response to allow cross-origin requests.
 */
function withCors(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "X-API-Key, Content-Type");
  return response;
}

/**
 * Creates a Shopify admin GraphQL client using store's access token.
 * For REST API requests that don't have embedded app session context.
 */
function createShopifyAdmin(shop: string, accessToken: string) {
  return {
    graphql: async (query: string, options?: { variables?: Record<string, any> }) => {
      const response = await fetch(
        `https://${shop}/admin/api/2024-01/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({
            query,
            variables: options?.variables,
          }),
        }
      );
      return {
        json: () => response.json(),
      };
    },
  };
}

/**
 * Handles POST requests to create a Draft Order.
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    // Handle OPTIONS preflight for CORS
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    // Only allow POST
    if (request.method !== "POST") {
      return withCors(
        json(
          {
            type: "about:blank",
            title: "Method Not Allowed",
            status: 405,
            detail: `Method ${request.method} is not allowed. Use POST to create a draft order.`,
          },
          { status: 405 }
        )
      );
    }

    // 1. Authentication
    const store = await authenticateApiKey(request);

    // 2. Rate limiting
    checkRateLimit(store.id);

    // 3. Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      throw json(
        {
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

    const validation = DraftOrderSchema.safeParse(body);
    if (!validation.success) {
      throw json(
        {
          type: "about:blank",
          title: "Validation Failed",
          status: 400,
          detail: "Invalid request body",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { productId, width, height, quantity } = validation.data;
    const normalizedProductId = normalizeProductId(productId);

    // 4. Validate dimensions (business logic)
    const dimensionValidation = validateDimensions(width, height, quantity);
    if (!dimensionValidation.valid) {
      throw json(
        {
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: dimensionValidation.error || "Invalid dimensions",
        },
        { status: 400 }
      );
    }

    // 5. Look up product matrix
    const productMatrix = await lookupProductMatrix(
      normalizedProductId,
      store.id
    );
    if (!productMatrix) {
      throw json(
        {
          type: "about:blank",
          title: "Not Found",
          status: 404,
          detail: "No price matrix assigned to this product",
        },
        { status: 404 }
      );
    }

    // 6. Calculate price
    let unitPrice: number;
    try {
      unitPrice = calculatePrice(width, height, productMatrix.matrixData);
    } catch (error) {
      console.error("Price calculation error:", error);
      throw json(
        {
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: "Failed to calculate price",
        },
        { status: 500 }
      );
    }

    // 7. Get store's access token for Shopify API
    const storeWithToken = await prisma.store.findUnique({
      where: { id: store.id },
      select: { accessToken: true, shop: true },
    });

    if (!storeWithToken || !storeWithToken.accessToken) {
      throw json(
        {
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: "Store access token not available",
        },
        { status: 500 }
      );
    }

    // 8. Create Shopify admin client
    const admin = createShopifyAdmin(
      storeWithToken.shop,
      storeWithToken.accessToken
    );

    // 9. Get product title from database
    const productMatrixRecord = await prisma.productMatrix.findUnique({
      where: { productId: normalizedProductId },
      select: { productTitle: true, matrixId: true },
    });

    if (!productMatrixRecord) {
      throw json(
        {
          type: "about:blank",
          title: "Not Found",
          status: 404,
          detail: "Product not found",
        },
        { status: 404 }
      );
    }

    // 10. Submit Draft Order via shared service
    const result = await submitDraftOrder({
      admin,
      storeId: store.id,
      matrixId: productMatrixRecord.matrixId,
      productId: normalizedProductId,
      productTitle: productMatrixRecord.productTitle,
      width,
      height,
      quantity,
      unitPrice,
      unit: productMatrix.unit,
    });

    if (!result.success) {
      throw json(
        {
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: result.error || "Failed to create Draft Order in Shopify",
        },
        { status: 500 }
      );
    }

    // 11. Return success response with CORS and rate limit headers
    const rateLimitHeaders = getRateLimitHeaders(store.id);

    const response = json(
      {
        draftOrderId: result.draftOrder!.id,
        name: result.draftOrder!.name,
        checkoutUrl: result.draftOrder!.invoiceUrl,
        total: result.draftOrder!.totalPrice,
        price: unitPrice,
        dimensions: {
          width,
          height,
          unit: productMatrix.unit,
        },
        quantity,
      },
      {
        status: 201,
        headers: rateLimitHeaders,
      }
    );

    return withCors(response);
  } catch (error) {
    // Global error handler: add CORS to all error responses
    if (error instanceof Response) {
      return withCors(error);
    }

    // Unexpected error - return 500 with generic message
    console.error("Unexpected API error:", error);
    return withCors(
      json(
        {
          type: "about:blank",
          title: "Internal Server Error",
          status: 500,
          detail: "An unexpected error occurred",
        },
        { status: 500 }
      )
    );
  }
}
