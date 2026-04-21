import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { generateApiKey } from "../utils/tokens.js";

/**
 * Derives a short public prefix from a raw API key for O(1) DB lookup before Argon2 verify.
 * Format: `sim_live_` + first 16 hex chars of the secret segment (collision risk negligible).
 */
export function deriveApiKeyPrefix(rawKey: string): string {
  return rawKey; // Now returning full key for direct matching
}

export async function hashApiKey(rawKey: string): Promise<string> {
  return argon2.hash(rawKey, { type: argon2.argon2id });
}

export async function verifyApiKey(hash: string, rawKey: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, rawKey);
  } catch {
    return false;
  }
}

/**
 * Persists a newly generated API key (hash + full key in prefix field).
 */
export async function saveNewApiKeyForUser(userId: string): Promise<{ rawKey: string }> {
  const rawKey = generateApiKey();
  const apiKeyHash = await hashApiKey(rawKey);

  await prisma.user.update({
    where: { id: userId },
    data: { 
      apiKeyHash, 
      apiKeyPrefix: rawKey // Store full key here for direct O(1) matching
    },
  });

  return { rawKey };
}

/**
 * Resolves a user by raw API key: direct match on apiKeyPrefix field.
 */
export async function findUserByApiKey(rawKey: string) {
  console.log("🔑 Raw API Key:", rawKey);
  
  const user = await prisma.user.findUnique({
    where: { apiKeyPrefix: rawKey },
  });

  console.log("👤 User found:", user ? user.email : "null");

  if (!user?.apiKeyHash) {
    return null;
  }
  
  // Still verify with Argon2 for extra security, assuming apiKeyHash stores the actual hash
  const ok = await verifyApiKey(user.apiKeyHash, rawKey);
  if (ok) {
    console.log("✅ API Key verified for user:", user.email);
  } else {
    console.log("❌ Argon2 verification failed for user:", user.email);
  }
  return ok ? user : null;
}
