import { prisma } from "../lib/prisma.js";

/** Footers we add for duplicate detection: `\n[ISO]` or compact `\n#ms`. */
const SPINTAX_FOOTER = /(\n\[[^\]]+\]|\n#\d+)$/;

function stripKnownFooter(s: string): string {
  return s.replace(SPINTAX_FOOTER, "").trimEnd();
}

const MAX_SMS_CHARS = 1600;

function appendUniqueFooter(base: string): string {
  const iso = `\n[${new Date().toISOString()}]`;
  if (base.length + iso.length <= MAX_SMS_CHARS) {
    return base + iso;
  }
  const compact = `\n#${Date.now()}`;
  if (base.length + compact.length <= MAX_SMS_CHARS) {
    return base + compact;
  }
  const room = MAX_SMS_CHARS - compact.length;
  return base.slice(0, Math.max(0, room)) + compact;
}

/**
 * If this message body matches the previous one to the same number (ignoring our footer),
 * append an ISO timestamp so carriers see a distinct payload (“spintax” style variation).
 */
export async function resolveSpintaxContent(params: {
  userId: string;
  toNumber: string;
  content: string;
}): Promise<string> {
  const { userId, toNumber, content } = params;

  const last = await prisma.message.findFirst({
    where: { userId, toNumber },
    orderBy: { createdAt: "desc" },
  });

  if (!last) {
    return content;
  }

  const previousBase = stripKnownFooter(last.content);
  if (previousBase === content) {
    return appendUniqueFooter(content);
  }

  return content;
}
