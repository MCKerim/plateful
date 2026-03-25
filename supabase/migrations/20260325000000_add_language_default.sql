-- Fix: null value in "language" column violates not-null constraint
-- The Supabase auth trigger creates user rows without a language value.
-- Making the column nullable allows the INSERT to succeed.
-- useUserData.ts already handles null by detecting browser language on first login.
ALTER TABLE users ALTER COLUMN language DROP NOT NULL;
