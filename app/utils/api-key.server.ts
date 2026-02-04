import crypto from "crypto";

/**
 * Generates a new API key with "pm_" prefix.
 * Format: pm_{64 character hex string}
 * @returns Generated API key string
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32);
  const hexString = randomBytes.toString("hex");
  return `pm_${hexString}`;
}

/**
 * Hashes an API key using SHA-256.
 * @param apiKey - The API key to hash
 * @returns Hex-encoded hash digest
 */
export function hashApiKey(apiKey: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(apiKey);
  return hash.digest("hex");
}

/**
 * Verifies an API key against a stored hash using timing-safe comparison.
 * @param providedKey - The API key to verify
 * @param storedHash - The stored hash to compare against
 * @returns True if the key matches the hash
 */
export function verifyApiKey(
  providedKey: string,
  storedHash: string
): boolean {
  const providedHash = hashApiKey(providedKey);

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedHash, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch (error) {
    // Catch errors from mismatched buffer lengths
    return false;
  }
}

/**
 * Extracts the display prefix from an API key (first 8 characters).
 * Used for masked display: pm_abc123...
 * @param apiKey - The full API key
 * @returns First 8 characters for display
 */
export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 8);
}
