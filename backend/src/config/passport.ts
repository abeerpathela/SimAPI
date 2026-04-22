import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { prisma } from "../lib/prisma.js";
import { generateWebhookSecret } from "../utils/tokens.js";
import { env } from "./env.js";

/**
 * Google OAuth 2.0 Strategy
 * Scope: profile + email — we only store the email and provider ID, nothing else.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: `${env.backendUrl}/api/auth/google/callback`,
      scope: ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0]?.value ??
          `${profile.id}@google-noemail.simapi.dev`;

        // Try to find by provider first (most reliable — email can change)
        let user = await prisma.user.findFirst({
          where: { authProvider: "google", providerId: profile.id },
        });

        if (!user) {
          // Fallback: existing local account with the same email → link it to Google
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
            user = await prisma.user.update({
              where: { id: existing.id },
              data: { authProvider: "google", providerId: profile.id },
            });
          } else {
            // Brand-new OAuth user — create account, no password required
            user = await prisma.user.create({
              data: {
                email,
                authProvider: "google",
                providerId: profile.id,
                webhookSecret: generateWebhookSecret(),
              },
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

/**
 * GitHub OAuth 2.0 Strategy (passport-github2)
 * Scope: user:email — needed because GitHub may not expose email in profile by default.
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: env.githubClientId,
      clientSecret: env.githubClientSecret,
      callbackURL: `${env.backendUrl}/api/auth/github/callback`,
      scope: ["user:email"],
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: (err: Error | null, user?: any) => void) => {
      try {
        // GitHub can return multiple emails; prefer the primary verified one
        const email =
          profile.emails?.find((e: any) => e.primary && e.verified)?.value ??
          profile.emails?.[0]?.value ??
          `${profile.id}@github-noemail.simapi.dev`;

        let user = await prisma.user.findFirst({
          where: { authProvider: "github", providerId: String(profile.id) },
        });

        if (!user) {
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
            user = await prisma.user.update({
              where: { id: existing.id },
              data: { authProvider: "github", providerId: String(profile.id) },
            });
          } else {
            user = await prisma.user.create({
              data: {
                email,
                authProvider: "github",
                providerId: String(profile.id),
                webhookSecret: generateWebhookSecret(),
              },
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    },
  ),
);

// We use stateless JWT — no session serialization needed.
// passport.serializeUser / deserializeUser are intentionally omitted.

export default passport;
