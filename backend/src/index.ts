import http from "node:http";
import express from "express";
import cors from "cors";
import passport from "passport";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { smsRouter } from "./routes/sms.js";
import { registerSocketServer } from "./socket/registerSocket.js";

const app = express();

// ✅ CORS (Restricted to frontend URL in production)
app.use(
  cors({
    origin: [env.frontendUrl, "http://localhost:5173", "https://sim-api-one.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "256kb" }));
app.use(passport.initialize());

// ✅ Health route
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "simapi-backend" });
});

// ✅ Routes
app.use("/api", authRouter);
app.use("/api/v1", smsRouter);

// ✅ Error handler
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[unhandled]", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

// ✅ Create HTTP server
const httpServer = http.createServer(app);

// ✅ Attach socket server (VERY IMPORTANT)
registerSocketServer(httpServer);

// ✅ Start server
const PORT = Number(process.env.PORT) || env.port || 3000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`SimAPI backend listening on ${PORT}`);
});