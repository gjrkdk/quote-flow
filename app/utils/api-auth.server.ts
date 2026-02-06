import type { UnitPreference } from "@prisma/client";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { verifyApiKey, getApiKeyPrefix } from "~/utils/api-key.server";

/**
 * Store object returned after successful authentication.
 */
export interface AuthenticatedStore {
  id: string;
  shop: string;
  unitPreference: UnitPreference;
}

/**
 * Authenticates a request using the X-API-Key header.
 * Performs timing-safe comparison of the provided API key against the stored hash.
 *
 * @param request - The incoming request object
 * @returns Store object (id, shop, unitPreference) on success
 * @throws 401 JSON response if authentication fails
 */
export async function authenticateApiKey(
  request: Request
): Promise<AuthenticatedStore> {
  // Extract API key from header
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey) {
    throw json(
      {
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "X-API-Key header is required",
      },
      { status: 401 }
    );
  }

  // Extract prefix and look up store
  const prefix = getApiKeyPrefix(apiKey);
  const store = await prisma.store.findFirst({
    where: { apiKeyPrefix: prefix },
    select: {
      id: true,
      shop: true,
      apiKeyHash: true,
      unitPreference: true,
    },
  });

  // Use same error message for both missing store and wrong key (prevents enumeration)
  if (!store || !store.apiKeyHash) {
    throw json(
      {
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid API key",
      },
      { status: 401 }
    );
  }

  // Timing-safe verification
  const isValid = verifyApiKey(apiKey, store.apiKeyHash);

  if (!isValid) {
    throw json(
      {
        type: "about:blank",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid API key",
      },
      { status: 401 }
    );
  }

  // Return store info (exclude apiKeyHash)
  return {
    id: store.id,
    shop: store.shop,
    unitPreference: store.unitPreference,
  };
}
