-- Create shared_recipes table
-- Stores public snapshots of recipes that can be shared via link
CREATE TABLE shared_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  snapshot JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE shared_recipes ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can view shared recipes
CREATE POLICY "Anyone can view shared recipes"
  ON shared_recipes
  FOR SELECT
  USING (true);

-- Only authenticated users can create shares
CREATE POLICY "Authenticated users can create shares"
  ON shared_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can delete their shares
CREATE POLICY "Creators can delete their shares"
  ON shared_recipes
  FOR DELETE
  USING (auth.uid() = created_by);
