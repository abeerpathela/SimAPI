import type { Request, Response, NextFunction } from "express";
import { findUserByApiKey } from "../services/apiKeyService.js";

export interface AuthedApiKeyRequest extends Request {
  userId?: string;
}

export const requireApiKey = async (
  req: AuthedApiKeyRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "API key required in Authorization header as Bearer token" });
    return;
  }

  const rawKey = authHeader.slice("Bearer ".length);

  try {
    const user = await findUserByApiKey(rawKey);
    if (!user) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    req.userId = user.id;
    next();
  } catch (err) {
    console.error("[requireApiKey]", err);
    res.status(500).json({ error: "Authentication failed" });
  }
};
