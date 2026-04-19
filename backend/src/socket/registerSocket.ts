import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { findUserByApiKey } from "../services/apiKeyService.js";

let ioSingleton: Server | null = null;

export function getIo(): Server | null {
  return ioSingleton;
}

/**
 * Attaches Socket.io to the HTTP server with API-key authentication (mobile app).
 * Links `socket.id` to `devices` and maintains `is_online` / `last_heartbeat`.
 */
export function registerSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      // Browsers send Origin; React Native / native HTTP stacks often omit it — allow those through.
      origin: (origin, callback) => {
        if (origin === undefined) {
          callback(null, true);
          return;
        }
        if (origin === env.frontendUrl) {
          callback(null, true);
          return;
        }
        callback(new Error("CORS: origin not allowed"));
      },
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const rawKey =
        typeof socket.handshake.auth?.apiKey === "string"
          ? socket.handshake.auth.apiKey
          : typeof socket.handshake.query.apiKey === "string"
            ? (socket.handshake.query.apiKey as string)
            : null;

      if (!rawKey || rawKey.length < 20) {
        next(new Error("Missing or invalid API key"));
        return;
      }

      const user = await findUserByApiKey(rawKey);
      if (!user) {
        next(new Error("Invalid API key"));
        return;
      }

      socket.data.userId = user.id as string;
      socket.data.email = user.email as string;
      next();
    } catch (err) {
      console.error("[socket.io auth]", err);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    const deviceNameRaw = socket.handshake.auth?.deviceName ?? socket.handshake.auth?.device_name;
    const deviceName =
      typeof deviceNameRaw === "string" && deviceNameRaw.trim().length > 0
        ? deviceNameRaw.trim().slice(0, 120)
        : "Android device";

    void attachDeviceSession(socket, userId, deviceName);

    socket.on("heartbeat", () => {
      void touchHeartbeat(socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.info(`[socket] disconnect ${socket.id} (${reason})`);
      void markDeviceOffline(socket.id);
    });
  });

  ioSingleton = io;
  return io;
}

async function attachDeviceSession(socket: Socket, userId: string, deviceName: string): Promise<void> {
  try {
    const existing = await prisma.device.findFirst({
      where: { userId, deviceName },
    });

    if (existing) {
      await prisma.device.update({
        where: { id: existing.id },
        data: {
          socketId: socket.id,
          isOnline: true,
          lastHeartbeat: new Date(),
        },
      });
    } else {
      await prisma.device.create({
        data: {
          userId,
          deviceName,
          socketId: socket.id,
          isOnline: true,
          lastHeartbeat: new Date(),
        },
      });
    }
  } catch (err) {
    console.error("[attachDeviceSession]", err);
    socket.disconnect(true);
  }
}

async function touchHeartbeat(socketId: string): Promise<void> {
  try {
    await prisma.device.updateMany({
      where: { socketId },
      data: { lastHeartbeat: new Date() },
    });
  } catch (err) {
    console.error("[heartbeat]", err);
  }
}

async function markDeviceOffline(socketId: string): Promise<void> {
  try {
    await prisma.device.updateMany({
      where: { socketId },
      data: { isOnline: false, socketId: null },
    });
  } catch (err) {
    console.error("[markDeviceOffline]", err);
  }
}
