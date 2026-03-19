-- Create household_subscriptions table
-- Tracks which household has an active subscription and who is paying for it
CREATE TABLE household_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  payer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_household_subscription UNIQUE (household_id)
);

-- Enable Row Level Security
ALTER TABLE household_subscriptions ENABLE ROW LEVEL SECURITY;

-- Household members can read their household's subscription row
CREATE POLICY "Household members can read own subscription"
  ON household_subscriptions
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

-- The payer can insert a subscription for their own household
CREATE POLICY "Payer can insert household subscription"
  ON household_subscriptions
  FOR INSERT
  WITH CHECK (
    payer_user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM users WHERE id = auth.uid()
    )
  );

-- The payer can update their own household subscription row
CREATE POLICY "Payer can update household subscription"
  ON household_subscriptions
  FOR UPDATE
  USING (payer_user_id = auth.uid())
  WITH CHECK (payer_user_id = auth.uid());
