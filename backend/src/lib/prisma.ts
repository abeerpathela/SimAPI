import { PrismaClient } from "@prisma/client";

/**
 * Single PrismaClient instance for the Node process (avoids exhausting connections in dev hot-reload).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    console.error("🔍 Current DATABASE_URL (host):", process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || "not set");
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
