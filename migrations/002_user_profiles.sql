-- User Profiles Extension
-- This migration creates the custom user_profiles table for storing additional user information
-- Fields collected during signup: skill_level, software_background, hardware_background, learning_goal

CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" VARCHAR(255) NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "skill_level" VARCHAR(50),
  "software_background" TEXT,
  "hardware_background" TEXT,
  "learning_goal" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_user_profiles_userId" ON "user_profiles"("userId");

-- Add comment explaining this is for future personalization
COMMENT ON TABLE "user_profiles" IS 'Extended user profile data collected during signup. Data is collected but NOT used for personalization in this phase (007-auth-integration-fix). Personalization logic will be implemented in a future phase.';