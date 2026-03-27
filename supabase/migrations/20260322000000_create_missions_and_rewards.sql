-- Mission definitions (source of truth for all missions)
CREATE TABLE mission_definitions (
  id text PRIMARY KEY,
  mission_set text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('household', 'user')),
  required_count int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mission_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read mission definitions"
  ON mission_definitions FOR SELECT
  TO authenticated
  USING (true);

-- Household-level mission progress
CREATE TABLE household_missions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  mission_id text NOT NULL REFERENCES mission_definitions(id),
  progress int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(household_id, mission_id)
);

ALTER TABLE household_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can read own missions"
  ON household_missions FOR SELECT
  USING (household_id IN (SELECT household_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Household members can insert own missions"
  ON household_missions FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Household members can update own missions"
  ON household_missions FOR UPDATE
  USING (household_id IN (SELECT household_id FROM users WHERE id = auth.uid()));

-- User-level mission progress (structure only, not used in UI yet)
CREATE TABLE user_missions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id text NOT NULL REFERENCES mission_definitions(id),
  progress int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own missions"
  ON user_missions FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own missions"
  ON user_missions FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own missions"
  ON user_missions FOR UPDATE USING (user_id = auth.uid());

-- Household rewards (badges earned by completing a mission set)
CREATE TABLE household_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  mission_set text NOT NULL,
  badge_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid NOT NULL REFERENCES users(id),
  UNIQUE(household_id, mission_set)
);

ALTER TABLE household_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can read own rewards"
  ON household_rewards FOR SELECT
  USING (household_id IN (SELECT household_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Household members can insert own rewards"
  ON household_rewards FOR INSERT
  WITH CHECK (
    claimed_by = auth.uid()
    AND household_id IN (SELECT household_id FROM users WHERE id = auth.uid())
  );

-- User rewards (structure only, not used in UI yet)
CREATE TABLE user_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rewards"
  ON user_rewards FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own rewards"
  ON user_rewards FOR INSERT WITH CHECK (user_id = auth.uid());

-- Seed onboarding missions
INSERT INTO mission_definitions (id, mission_set, scope, required_count) VALUES
  ('import_recipes', 'onboarding', 'household', 3),
  ('chat_with_chef',  'onboarding', 'household', 1),
  ('plan_meals',      'onboarding', 'household', 3);

-- RPC: increment household mission progress (capped at required_count, auto-completes)
CREATE OR REPLACE FUNCTION increment_household_mission(
  p_mission_id text,
  p_household_id uuid
) RETURNS household_missions
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_required int;
  v_row household_missions;
BEGIN
  SELECT required_count INTO v_required
    FROM mission_definitions WHERE id = p_mission_id;

  INSERT INTO household_missions (household_id, mission_id, progress)
    VALUES (p_household_id, p_mission_id, 1)
  ON CONFLICT (household_id, mission_id)
  DO UPDATE SET
    progress = LEAST(household_missions.progress + 1, v_required),
    completed_at = CASE
      WHEN household_missions.completed_at IS NULL
        AND (household_missions.progress + 1) >= v_required
      THEN now()
      ELSE household_missions.completed_at
    END
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE POLICY "Household members can delete own missions"
  ON household_missions FOR DELETE
  USING (household_id IN (SELECT household_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Household members can delete own rewards"
  ON household_rewards FOR DELETE
  USING (household_id IN (SELECT household_id FROM users WHERE id = auth.uid()));
