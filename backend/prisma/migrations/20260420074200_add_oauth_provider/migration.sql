-- Migration: add_oauth_provider
-- Adds auth_provider and provider_id fields to support Google & GitHub OAuth
-- alongside existing local (email+password) accounts.

-- 1. Make password_hash nullable (OAuth users have no password)
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- 2. Add auth_provider column (defaults to 'local' for all existing rows)
ALTER TABLE "users" ADD COLUMN "auth_provider" TEXT NOT NULL DEFAULT 'local';

-- 3. Add provider_id column (NULL for local accounts)
ALTER TABLE "users" ADD COLUMN "provider_id" TEXT;

-- 4. Add unique constraint: one account per (provider, provider_id) pair
--    The WHERE clause excludes local accounts (provider_id IS NULL) from the constraint
--    so multiple local accounts with NULL provider_id coexist safely.
CREATE UNIQUE INDEX "users_provider_account_key"
  ON "users"("auth_provider", "provider_id")
  WHERE "provider_id" IS NOT NULL;
