/**
 * Better Auth Custom Plugins
 *
 * This file contains custom plugins for Better Auth to handle user profiles.
 *
 * The userProfile plugin creates a user_profiles record after successful signup
 * with the user's skill level, backgrounds, and learning goals.
 *
 * Reference: specs/007-auth-integration-fix/plan.md Phase 4
 */

import { Pool } from 'pg';

/**
 * User Profile Plugin
 *
 * This plugin hooks into the Better Auth lifecycle to create user profile records
 * in the user_profiles table after successful user registration.
 *
 * NOTE: Better Auth's after hooks have specific requirements.
 * The handler MUST return the context to avoid breaking the response chain.
 */
const userProfilePlugin = () => {
  return {
    id: 'user-profile',
    hooks: {
      after: [
        {
          matcher: (context) => {
            // Hook into the sign-up endpoint
            return context.path === '/sign-up/email' && context.method === 'POST';
          },
          handler: async (context) => {
            // CRITICAL: Must return context to maintain response chain
            try {
              // Extract user data from the returned response
              const userId = context.returned?.user?.id;

              if (!userId) {
                // No user ID - signup may have failed, just return context
                return context;
              }

              // Extract profile data from the original request body
              let profileData = {};
              if (context.body) {
                profileData = context.body;
              }

              const {
                skill_level,
                software_background,
                hardware_background,
                learning_goal
              } = profileData;

              // Only create profile if there's actual profile data
              if (skill_level || software_background || hardware_background || learning_goal) {
                const pool = new Pool({
                  connectionString: process.env.DATABASE_URL,
                  max: 1,
                  idleTimeoutMillis: 30000,
                });

                await pool.query(`
                  INSERT INTO user_profiles (
                    "userId",
                    skill_level,
                    software_background,
                    hardware_background,
                    learning_goal,
                    "createdAt",
                    "updatedAt"
                  )
                  VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                  ON CONFLICT ("userId") DO UPDATE SET
                    skill_level = EXCLUDED.skill_level,
                    software_background = EXCLUDED.software_background,
                    hardware_background = EXCLUDED.hardware_background,
                    learning_goal = EXCLUDED.learning_goal,
                    "updatedAt" = NOW()
                `, [
                  userId,
                  skill_level || null,
                  software_background || null,
                  hardware_background || null,
                  learning_goal || null
                ]);

                await pool.end();
                console.log(`User profile created for user ${userId}`);
              }
            } catch (error) {
              console.error('Error creating user profile:', error);
              // Don't throw - profile creation failure shouldn't break signup
            }

            // CRITICAL: Always return context
            return context;
          }
        }
      ]
    }
  };
};

export { userProfilePlugin };