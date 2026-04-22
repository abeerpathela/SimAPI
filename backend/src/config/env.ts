import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized environment validation so the server fails fast with a clear message.
 */
const required = [
  "DATABASE_URL",
  "JWT_SECRET",
  "FRONTEND_URL",
  "BACKEND_URL",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

for (const key of required) {
  if (!process.env[key] || String(process.env[key]).trim() === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  /** Single allowed browser origin for the React dashboard (Vite dev: http://localhost:5173). */
  frontendUrl: process.env.FRONTEND_URL as string,
  /** The public URL of the backend (for OAuth callbacks). */
  backendUrl: process.env.BACKEND_URL as string,
  /** JWT access token lifetime — production requirement: 24 hours. */
  jwtExpiresIn: "24h" as const,
  /** GitHub OAuth credentials */
  githubClientId: process.env.GITHUB_CLIENT_ID as string,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET as string,
  githubCallbackUrl: process.env.GITHUB_CALLBACK_URL || `${process.env.BACKEND_URL}/api/auth/github/callback`,
  /** Google OAuth credentials */
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL}/api/auth/google/callback`,
};
