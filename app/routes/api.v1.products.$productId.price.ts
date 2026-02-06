/**
 * REST API Endpoint: GET /api/v1/products/:productId/price
 *
 * Returns dimension-based price for a product with assigned matrix.
 * Requires API key authentication, validates input, enforces rate limits.
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticateApiKey } from "~/utils/api-auth.server";
import {
  PriceQuerySchema,
  ProductIdSchema,
  normalizeProductId,
} from "~/validators/api.validators";
import { checkRateLimit, getRateLimitHeaders } from "~/utils/rate-limit.server";
import { lookupProductMatrix } from "~/services/product-matrix-lookup.server";
import {
  calculatePrice,
  validateDimensions,
} from "~/services/price-calculator.server";

/**
 * Adds CORS headers to a response to allow cross-origin requests.
 */
function withCors(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "X-API-Key, Content-Type");
  return response;
}

/**
 * Handles GET requests to fetch price for given dimensions.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    // 1. Authentication
    const store = await authenticateApiKey(request);

    // 2. Rate limiting
    checkRateLimit(store.id);

    // 3. Validate product ID
    const productIdValidation = ProductIdSchema.safeParse(params.productId);
    if (!productIdValidation.success) {
      throw json(
        {
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: "Invalid product ID format",
        },
        { status: 400 }
      );
    }
    const normalizedProductId = normalizeProductId(productIdValidation.data);

    // 4. Validate query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    const widthParam = url.searchParams.get("width");
    const heightParam = url.searchParams.get("height");
    const quantityParam = url.searchParams.get("quantity");
    if (widthParam !== null) queryParams.width = widthParam;
    if (heightParam !== null) queryParams.height = heightParam;
    if (quantityParam !== null) queryParams.quantity = quantityParam;

    const queryValidation = PriceQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      throw json(
        {
          type: "about:blank",
          title: "Validation Failed",
          status: 400,
          detail: "Invalid query parameters",
          errors: queryValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { width, height, quantity } = queryValidation.data;

    // 5. Validate dimensions (business logic)
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

    // 6. Look up product matrix
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

    // 7. Calculate price
    let unitPrice: number;
    try {
      unitPrice = calculatePrice(width, height, productMatrix.matrixData);
    } catch (error) {
      // Price calculation failed (missing cell) - return 500
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

    // 8. Return success response with CORS and rate limit headers
    const total = unitPrice * quantity;
    const rateLimitHeaders = getRateLimitHeaders(store.id);

    const response = json(
      {
        price: unitPrice,
        currency: "store-default",
        dimensions: {
          width,
          height,
          unit: store.unitPreference,
        },
        quantity,
        total,
        matrix: productMatrix.matrixName,
      },
      {
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

/**
 * Handles non-GET methods (OPTIONS for CORS preflight, 405 for others).
 */
export async function action({ request }: LoaderFunctionArgs) {
  // Handle OPTIONS preflight for CORS
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  // All other methods: 405 Method Not Allowed
  return withCors(
    json(
      {
        type: "about:blank",
        title: "Method Not Allowed",
        status: 405,
        detail: `Method ${request.method} is not allowed. Use GET to fetch price.`,
      },
      { status: 405 }
    )
  );
}
