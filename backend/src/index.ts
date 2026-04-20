import http from "node:http";
import express from "express";
import cors from "cors";
import passport from "passport";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { smsRouter } from "./routes/sms.js";
import { registerSocketServer } from "./socket/registerSocket.js";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "256kb" }));
// Initialize passport — stateless mode, no session required
app.use(passport.initialize());


app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "simapi-backend" });
});

app.use("/api", authRouter);
app.use("/api/v1", smsRouter);

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

const httpServer = http.createServer(app);
registerSocketServer(httpServer);

httpServer.listen(env.port, () => {
  console.log(`SimAPI backend listening on port ${env.port}`);
  console.log(`CORS allowed origin: ${env.frontendUrl}`);
});
