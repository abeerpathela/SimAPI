import { Router, type Request, type Response, type NextFunction } from "express";
import argon2 from "argon2";
import { z } from "zod";
import passport from "passport";
import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../utils/jwt.js";
import { generateWebhookSecret } from "../utils/tokens.js";
import { requireJwt, type AuthedRequest } from "../middleware/requireJwt.js";
import { saveNewApiKeyForUser } from "../services/apiKeyService.js";
import { env } from "../config/env.js";
// Side-effect import: registers GitHub strategy on the passport singleton
import "../config/passport.js";

const router = Router();


const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/register
 * Creates an account, hashes the password with Argon2id, issues a webhook signing secret (returned once).
 */
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const webhookSecret = generateWebhookSecret();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        webhookSecret,
      },
    });

    const token = signAccessToken(user.id, user.email);

    res.status(201).json({
      token,
      expires_in: "24h",
      user: { id: user.id, email: user.email },
      /** Shown once — store securely; used to verify HMAC on inbound webhooks. */
      webhook_secret: webhookSecret,
    });
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * POST /api/login
 * Returns a JWT valid for 24 hours.
 */
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }
  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // OAuth-only accounts have no password — direct them to the correct provider
    if (!user.passwordHash) {
      res.status(401).json({
        error: `This account uses ${user.authProvider} sign-in. Please continue with ${user.authProvider}.`,
      });
      return;
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signAccessToken(user.id, user.email);
    res.json({
      token,
      expires_in: "24h",
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * POST /api/generate-key
 * Requires JWT. Issues a new API key (raw value returned once); replaces any previous key.
 */
router.post("/generate-key", requireJwt, async (req, res) => {
  const { userId } = req as AuthedRequest;

  try {
    const { rawKey } = await saveNewApiKeyForUser(userId);
    res.json({
      api_key: rawKey,
      message: "Store this key securely. It will not be shown again.",
    });
  } catch (err) {
    console.error("[generate-key]", err);
    res.status(500).json({ error: "Could not generate API key" });
  }
});

const webhookSchema = z.object({
  webhook_url: z.string().url().nullable(),
});

/**
 * PATCH /api/webhook-url
 * Requires JWT. Saves the developer’s webhook URL for failure notifications (HMAC-signed).
 */
router.patch("/webhook-url", requireJwt, async (req, res) => {
  const parsed = webhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    return;
  }

  const { userId } = req as AuthedRequest;
  const { webhook_url } = parsed.data;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { webhookUrl: webhook_url },
    });
    res.json({ ok: true, webhook_url });
  } catch (err) {
    console.error("[webhook-url]", err);
    res.status(500).json({ error: "Could not update webhook URL" });
  }
});

/**
 * GET /api/messages
 * Requires JWT. Fetches all messages for the authenticated user.
 */
router.get("/messages", requireJwt, async (req, res) => {
  const { userId } = req as AuthedRequest;

  try {
    const messages = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ messages });
  } catch (err) {
    console.error("[messages]", err);
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

/**
 * GET /api/devices
 * Requires JWT. Fetches all devices for the authenticated user.
 */
router.get("/devices", requireJwt, async (req, res) => {
  const { userId } = req as AuthedRequest;

  try {
    const devices = await prisma.device.findMany({
      where: { userId },
      orderBy: { lastHeartbeat: "desc" },
    });
    res.json({ devices });
  } catch (err) {
    console.error("[devices]", err);
    res.status(500).json({ error: "Could not fetch devices" });
  }
});

/**
 * GET /api/me
 * Requires JWT. Fetches the authenticated user's data.
 */
router.get("/me", requireJwt, async (req, res) => {
  const { userId } = req as AuthedRequest;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        apiKeyPrefix: true,
        webhookUrl: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("[me]", err);
    res.status(500).json({ error: "Could not fetch user data" });
  }
});


// ---------------------------------------------------------------------------
// OAuth Routes — GitHub
// ---------------------------------------------------------------------------

/**
 * GET /api/auth/github
 * Redirects the browser to GitHub's consent screen.
 */
router.get(
  "/auth/github",
  passport.authenticate("github", { session: false, scope: ["user:email"] }),
);

/**
 * GET /api/auth/github/callback
 * GitHub redirects here after the user grants permission.
 */
router.get(
  "/auth/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: `${env.frontendUrl}/auth?error=oauth_failed` }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string; email: string };
    const token = signAccessToken(user.id, user.email);
    res.redirect(`${env.frontendUrl}/dashboard?token=${token}`);
  },
);

export { router as authRouter };

