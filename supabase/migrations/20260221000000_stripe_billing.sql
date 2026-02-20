-- Stripe subscription integration: profiles.subscription_tier is source of truth
-- Webhooks are the ONLY thing that updates subscription_tier

-- Add Stripe-related columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Allow 'pro' in subscription_tier (Stripe uses pro/elite; keep 'paid' for backward compat)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'paid', 'pro', 'elite'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pending_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_pending_subscription_tier_check
  CHECK (pending_subscription_tier IS NULL OR pending_subscription_tier IN ('free', 'paid', 'pro', 'elite'));

COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN profiles.subscription_status IS 'Stripe subscription status: active, canceled, past_due, etc.';
COMMENT ON COLUMN profiles.current_period_end IS 'When current billing period ends';
