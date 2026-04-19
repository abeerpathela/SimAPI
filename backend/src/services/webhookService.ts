import crypto from "node:crypto";
import type { Message } from "@prisma/client";

const SIGNATURE_HEADER = "x-simapi-signature";

export type WebhookEventPayload = {
  id: string;
  type: "message.failed";
  created_at: string;
  data: {
    message_id: string;
    to_number: string;
    reason: string;
    status: string;
  };
};

/**
 * Delivers a signed webhook POST to the developer’s `webhookUrl`.
 * Body is JSON; integrity is proven via HMAC-SHA256 over the raw JSON bytes.
 */
export async function sendSignedWebhook(params: {
  webhookUrl: string;
  webhookSecret: string;
  message: Pick<Message, "id" | "toNumber" | "status">;
  reason: string;
}): Promise<{ ok: boolean; status?: number; error?: string }> {
  const { webhookUrl, webhookSecret, message, reason } = params;

  const body: WebhookEventPayload = {
    id: crypto.randomUUID(),
    type: "message.failed",
    created_at: new Date().toISOString(),
    data: {
      message_id: message.id,
      to_number: message.toNumber,
      reason,
      status: message.status,
    },
  };

  const rawBody = JSON.stringify(body);
  const signature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [SIGNATURE_HEADER]: `sha256=${signature}`,
        "User-Agent": "SimAPI-Webhook/1.0",
      },
      body: rawBody,
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    const messageText = err instanceof Error ? err.message : String(err);
    return { ok: false, error: messageText };
  }
}
