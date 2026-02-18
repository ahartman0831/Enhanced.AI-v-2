-- Add subscription_tier to profiles for tracking free vs paid vs elite
-- Values: 'free' (default), 'paid', 'elite'
-- You can manually set a user to 'elite' in Supabase Dashboard: Table Editor > profiles > subscription_tier
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'paid', 'elite'));

-- Add comment for clarity
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription tier: free (default), paid (any paid plan), elite (highest tier). Set manually in Supabase Dashboard.';
