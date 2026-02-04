import { prisma } from "~/db.server";
import { generateApiKey, hashApiKey, getApiKeyPrefix } from "~/utils/api-key.server";

export interface EnsureStoreResult {
  store: {
    id: string;
    shop: string;
    apiKeyPrefix: string | null;
    onboardingCompleted: boolean;
  };
  isNewInstall: boolean;
  apiKey?: string; // Only returned on new install
}

/**
 * Ensures a Store record exists for the given shop.
 * - On first install: Creates Store with API key
 * - On reinstall: Updates accessToken, preserves data
 *
 * @param shop - The shop domain (e.g., "example.myshopify.com")
 * @param accessToken - The OAuth access token
 * @returns Store record, isNewInstall flag, and apiKey (only on new install)
 */
export async function ensureStoreExists(
  shop: string,
  accessToken: string
): Promise<EnsureStoreResult> {
  // Check if store already exists
  const existingStore = await prisma.store.findUnique({
    where: { shop },
    select: {
      id: true,
      shop: true,
      apiKeyPrefix: true,
      onboardingCompleted: true,
    },
  });

  if (existingStore) {
    // Reinstall: update access token but preserve data
    await prisma.store.update({
      where: { shop },
      data: {
        accessToken,
        updatedAt: new Date(),
      },
    });

    return {
      store: existingStore,
      isNewInstall: false,
    };
  }

  // New install: create store with API key
  const apiKey = generateApiKey();
  const apiKeyHash = hashApiKey(apiKey);
  const apiKeyPrefix = getApiKeyPrefix(apiKey);

  const newStore = await prisma.store.create({
    data: {
      shop,
      accessToken,
      apiKeyHash,
      apiKeyPrefix,
      onboardingCompleted: false,
    },
    select: {
      id: true,
      shop: true,
      apiKeyPrefix: true,
      onboardingCompleted: true,
    },
  });

  return {
    store: newStore,
    isNewInstall: true,
    apiKey, // Return the full key only on new install (one-time view)
  };
}
