-- Subscription billing: cancel/downgrade takes effect at next billing cycle
-- User keeps access until subscription_end_at

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pending_subscription_tier TEXT CHECK (pending_subscription_tier IN ('free', 'paid', 'elite'));

COMMENT ON COLUMN profiles.subscription_end_at IS 'When current paid access ends (for cancel/downgrade). User keeps access until this date.';
COMMENT ON COLUMN profiles.pending_subscription_tier IS 'Tier to switch to at period end. Set when user cancels or downgrades.';
