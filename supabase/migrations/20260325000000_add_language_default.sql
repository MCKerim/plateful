-- Fix: null value in "language" column violates not-null constraint
-- The Supabase auth trigger creates users rows without a language value.
-- Adding a default prevents the INSERT from failing for new sign-ups.
ALTER TABLE users ALTER COLUMN language SET DEFAULT 'en';
