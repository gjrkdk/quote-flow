/**
 * REST API Endpoint: GET /api/v1/products/:productId/options
 *
 * Returns option groups assigned to a product with their choices.
 * Requires API key authentication, validates input, enforces rate limits.
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { authenticateApiKey } from "~/utils/api-auth.server";
import {
  ProductIdSchema,
  normalizeProductId,
} from "~/validators/api.validators";
import { checkRateLimit, getRateLimitHeaders } from "~/utils/rate-limit.server";
import { getProductOptionGroups } from "~/services/option-group.server";

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
 * Handles GET requests to fetch option groups for a product.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  // Handle OPTIONS preflight before authentication
  if (request.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

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

    // 4. Fetch option groups for product
    const groups = await getProductOptionGroups(
      normalizedProductId,
      store.id
    );

    // 5. If product not found or unauthorized, return empty array (not 404)
    // The widget should handle empty state gracefully
    if (!groups) {
      const rateLimitHeaders = getRateLimitHeaders(store.id);
      const response = json(
        { optionGroups: [] },
        { headers: rateLimitHeaders }
      );
      return withCors(response);
    }

    // 6. Transform groups to API format
    const optionGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      requirement: group.requirement,
      choices: group.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        modifierType: choice.modifierType,
        modifierValue: choice.modifierValue,
        isDefault: choice.isDefault,
      })),
    }));

    // 7. Return success response with CORS and rate limit headers
    const rateLimitHeaders = getRateLimitHeaders(store.id);
    const response = json(
      { optionGroups },
      { headers: rateLimitHeaders }
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
        detail: `Method ${request.method} is not allowed. Use GET to fetch option groups.`,
      },
      { status: 405 }
    )
  );
}
