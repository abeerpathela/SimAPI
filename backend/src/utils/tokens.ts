import crypto from "node:crypto";

/** Human-readable API key prefix so keys are identifiable in logs (never log full key). */
const API_KEY_PREFIX = "sim_live_";

/**
 * Generates a high-entropy API key. The caller must persist only a hash (Argon2) of the raw value.
 */
export function generateApiKey(): string {
  const suffix = crypto.randomBytes(24).toString("hex");
  return `${API_KEY_PREFIX}${suffix}`;
}

/** Prefix for webhook signing secrets (developer verifies HMAC with this value). */
const WEBHOOK_SECRET_PREFIX = "whsec_";

export function generateWebhookSecret(): string {
  return `${WEBHOOK_SECRET_PREFIX}${crypto.randomBytes(24).toString("hex")}`;
}
