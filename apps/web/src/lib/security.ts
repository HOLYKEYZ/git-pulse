import { createHash } from "crypto";

/**
 * Hashes an API key securely before storing it in the database.
 * We use SHA-256 so that if the DB is compromised, raw API keys remain safe.
 * 
 * @param key The raw API key generated for the user
 * @returns The hex-encoded SHA-256 hash
 */
export async function hashApiKey(key: string): Promise<string> {
  try {
    return createHash("sha256").update(key).digest("hex");
  } catch (error) {
    // Wrap the original error to provide context while preserving the cause
    throw new Error(`Failed to hash API key: ${error instanceof Error ? error.message : String(error)}`);
  }
}