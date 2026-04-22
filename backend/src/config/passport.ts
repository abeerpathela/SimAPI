import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { prisma } from "../lib/prisma.js";
import { generateWebhookSecret } from "../utils/tokens.js";
import { env } from "./env.js";

/**
 * GitHub OAuth 2.0 Strategy (passport-github2)
 * Scope: user:email — needed because GitHub may not expose email in profile by default.
 */
passport.use(
  new GitHubStrategy(
    {
      clientID: env.githubClientId,
      clientSecret: env.githubClientSecret,
      callbackURL: env.githubCallbackUrl,
      scope: ["user:email"],
      proxy: true,
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
