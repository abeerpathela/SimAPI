import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { generateApiKey } from "../utils/tokens.js";

/**
 * Derives a short public prefix from a raw API key for O(1) DB lookup before Argon2 verify.
 * Format: `sim_live_` + first 16 hex chars of the secret segment (collision risk negligible).
 */
export function deriveApiKeyPrefix(rawKey: string): string {
  const withoutPrefix = rawKey.startsWith("sim_live_") ? rawKey.slice("sim_live_".length) : rawKey;
  return `sim_live_${withoutPrefix.slice(0, 16)}`;
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
 * Persists a newly generated API key (hash + prefix). Returns the raw key once — never log or return again.
 */
export async function saveNewApiKeyForUser(userId: string): Promise<{ rawKey: string }> {
  const rawKey = generateApiKey();
  const prefix = deriveApiKeyPrefix(rawKey);
  const apiKeyHash = await hashApiKey(rawKey);

  await prisma.user.update({
    where: { id: userId },
    data: { apiKeyHash, apiKeyPrefix: prefix },
  });

  return { rawKey };
}

/**
 * Resolves a user by raw API key: prefix lookup, then Argon2 verify.
 */
export async function findUserByApiKey(rawKey: string) {
  const prefix = deriveApiKeyPrefix(rawKey);
  const user = await prisma.user.findUnique({
    where: { apiKeyPrefix: prefix },
  });
  if (!user?.apiKeyHash) {
    return null;
  }
  const ok = await verifyApiKey(user.apiKeyHash, rawKey);
  return ok ? user : null;
}
