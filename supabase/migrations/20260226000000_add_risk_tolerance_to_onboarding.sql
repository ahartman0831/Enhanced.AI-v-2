-- Add risk_tolerance to user_onboarding_profiles for survey/tailoring
ALTER TABLE user_onboarding_profiles
ADD COLUMN IF NOT EXISTS risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high'));

COMMENT ON COLUMN user_onboarding_profiles.risk_tolerance IS 'User risk tolerance: low, medium, high. Used for stack explorer and AI tailoring.';
