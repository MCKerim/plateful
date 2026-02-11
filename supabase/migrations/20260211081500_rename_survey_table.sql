-- Migration: Rename survey_answears -> survey_answers (fix typo) and truncate data (clean break for beta)
-- Run this in the Supabase SQL Editor.
--
-- After running this migration:
-- 1. Run: npm run generate-supabase-types
-- 2. Find and replace "survey_answears" -> "survey_answers" in:
--    - src/page/onboarding/survey/Survey.tsx (3 occurrences)
--    - src/page/onboarding/surveyStart/SurveyStart.tsx (1 occurrence)

-- 1. Truncate existing data (clean break — beta only)
TRUNCATE TABLE survey_answears;

-- 2. Rename the table
ALTER TABLE survey_answears RENAME TO survey_answers;

-- 3. Reset has_completed_survey for all users since we wiped their answers
UPDATE users SET has_completed_survey = false;
