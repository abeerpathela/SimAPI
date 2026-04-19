import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(userId: string, email: string): string {
  const payload: JwtPayload = { sub: userId, email };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }
  const sub = (decoded as Record<string, unknown>).sub;
  const email = (decoded as Record<string, unknown>).email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Invalid token claims");
  }
  return { sub, email };
}
