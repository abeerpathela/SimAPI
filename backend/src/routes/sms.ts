import { Router } from "express";
import { z } from "zod";
import { MessageStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthedApiKeyRequest } from "../middleware/requireApiKey.js";
import { requireApiKey } from "../middleware/requireApiKey.js";
import { sendSignedWebhook } from "../services/webhookService.js";
import { runExclusiveSms } from "../services/smsSendGate.js";
import { resolveSpintaxContent } from "../services/spintax.js";
import { getIo } from "../socket/registerSocket.js";

const router = Router();

const sendSmsSchema = z.object({
  to_number: z.string().min(5).max(32),
  /** Leave headroom for optional duplicate-body spintax footer (≤1600 chars total on wire). */
  content: z.string().min(1).max(1560),
});

type SendOutcome =
  | { kind: "sent"; id: string; to_number: string }
  | {
      kind: "failed";
      id: string;
      to_number: string;
      error: string;
      webhook_dispatched: boolean;
    }
  | { kind: "no_user" };

/**
 * POST /api/v1/send-sms
 * Requires API key (Bearer token). Serialized per user, ≥3s between attempts, spintax on duplicate bodies.
 */
router.post("/send-sms", requireApiKey, async (req, res) => {
  const parsed = sendSmsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { userId } = req as AuthedApiKeyRequest;
  const { to_number, content } = parsed.data;

  try {
    const outcome = await runExclusiveSms(userId, async (): Promise<SendOutcome> => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          devices: {
            where: { isOnline: true, socketId: { not: null } },
            orderBy: { lastHeartbeat: "desc" },
            take: 1,
          },
        },
      });

      if (!user) {
        return { kind: "no_user" };
      }

      const outboundContent = await resolveSpintaxContent({
        userId,
        toNumber: to_number,
        content,
      });

      const message = await prisma.message.create({
        data: {
          userId,
          toNumber: to_number,
          content: outboundContent,
          status: MessageStatus.PENDING,
        },
      });

      const device = user.devices[0];
      const io = getIo();

      if (device?.socketId && io) {
        io.to(device.socketId).emit("send_message", {
          message_id: message.id,
          to_number,
          content: outboundContent,
        });

        await prisma.message.update({
          where: { id: message.id },
          data: { status: MessageStatus.SENT },
        });

        return { kind: "sent", id: message.id, to_number };
      }

      const failed = await prisma.message.update({
        where: { id: message.id },
        data: { status: MessageStatus.FAILED },
      });

      const reason = "No online device with an active connection";

      if (user.webhookUrl && user.webhookSecret) {
        const webhookResult = await sendSignedWebhook({
          webhookUrl: user.webhookUrl,
          webhookSecret: user.webhookSecret,
          message: failed,
          reason,
        });
        if (!webhookResult.ok) {
          console.error("[send-sms] Webhook delivery failed", webhookResult);
        }
      }

      return {
        kind: "failed",
        id: failed.id,
        to_number,
        error: reason,
        webhook_dispatched: Boolean(user.webhookUrl),
      };
    });

    if (outcome.kind === "no_user") {
      res.status(404).json({ error: "User not found", to_number });
      return;
    }

    if (outcome.kind === "sent") {
      res.status(202).json({
        id: outcome.id,
        to_number: outcome.to_number,
        status: "sent",
        message: "Dispatched to connected device",
      });
      return;
    }

    res.status(503).json({
      id: outcome.id,
      to_number: outcome.to_number,
      status: "failed",
      error: outcome.error,
      webhook_dispatched: outcome.webhook_dispatched,
    });
  } catch (err) {
    console.error("[send-sms]", err);
    res.status(500).json({ error: "Failed to process SMS request" });
  }
});

/**
 * GET /api/v1/debug/jobs
 * Requires API key. Shows pending/recent jobs for the device.
 */
router.get("/debug/jobs", requireApiKey, async (req, res) => {
  const { userId } = req as AuthedApiKeyRequest;

  try {
    const jobs = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const devices = await prisma.device.findMany({
      where: { userId },
    });

    res.json({
      jobs: jobs.map(j => ({
        id: j.id,
        to: j.toNumber,
        status: j.status,
        created: j.createdAt,
      })),
      devices: devices.map(d => ({
        name: d.deviceName,
        online: d.isOnline,
        lastSeen: d.lastHeartbeat,
        socketId: d.socketId,
      })),
    });
  } catch (err) {
    console.error("[debug/jobs]", err);
    res.status(500).json({ error: "Failed to fetch debug data" });
  }
});

export { router as smsRouter };
