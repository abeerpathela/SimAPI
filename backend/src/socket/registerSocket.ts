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
      origin: "*",
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
        console.log("❌ Missing or invalid API key length:", rawKey?.length);
        next(new Error("Missing or invalid API key"));
        return;
      }

      console.log("🔑 Incoming API Key:", rawKey);
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

  io.on("connection", async (socket: Socket) => {
    console.log("🔥 Client connected:", socket.id);

    const userId = socket.data.userId as string;
    const deviceNameRaw =
      socket.handshake.auth?.deviceName ??
      socket.handshake.auth?.device_name ??
      socket.handshake.query?.deviceName ??
      socket.handshake.query?.device_name;

    const deviceName =
      typeof deviceNameRaw === "string" && deviceNameRaw.trim().length > 0
        ? deviceNameRaw.trim().slice(0, 120)
        : "Android device";

    // ✅ REGISTER/UPSERT DEVICE
    try {
      console.log("📱 Attempting to register device:", deviceName, "for user:", userId);
      
      const existing = await prisma.device.findFirst({
        where: { userId, deviceName },
      });

      let device;
      if (existing) {
        device = await prisma.device.update({
          where: { id: existing.id },
          data: {
            socketId: socket.id,
            isOnline: true,
            lastHeartbeat: new Date(),
          },
        });
        console.log("📱 Existing device updated:", device.id);
      } else {
        device = await prisma.device.create({
          data: {
            userId,
            deviceName,
            socketId: socket.id,
            isOnline: true,
            lastHeartbeat: new Date(),
          },
        });
        console.log("📱 New device created:", device.id);
      }
      
      // Emit connection confirmation with device info
      socket.emit("connected", {
        status: "ok",
        socketId: socket.id,
        deviceId: device.id,
      });
    } catch (err: any) {
      console.error("❌ Device registration failed:", err.message);
      
      // Still notify success even if DB update fails (so app knows it's at least connected to socket)
      socket.emit("connected", {
        status: "ok",
        socketId: socket.id,
        error: "DB_SYNC_FAILED"
      });
    }

    socket.on("heartbeat", () => {
      void touchHeartbeat(socket.id);
    });

    socket.on("disconnect", async (reason) => {
      console.log("❌ Client disconnected:", socket.id, `(${reason})`);
      try {
        await prisma.device.updateMany({
          where: { socketId: socket.id },
          data: { isOnline: false, socketId: null },
        });
      } catch (err) {
        console.error("❌ Failed to mark device offline:", err);
      }
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
